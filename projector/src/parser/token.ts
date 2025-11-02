import { getNodeName } from "../concept";
import { AlternativeTokenTerm, AlternativeTokenTermDef, CharRangeTokenTerm, CharRangeTokenTermDef, ConstantCharTokenTerm, ConstantCharTokenTermDef, ConstantStringTokenTerm, ConstantStringTokenTermDef, NotTokenTerm, NotTokenTermDef, OneOrMoreTokenTerm, OneOrMoreTokenTermDef, OptionalTokenTerm, OptionalTokenTermDef, ParameterizedTokenTerm, ParameterizedTokenTermDef, ParenthesizedTokenTerm, ParenthesizedTokenTermDef, QuantizedTokenTerm, QuantizedTokenTermDef, SequenceTokenTerm, SequenceTokenTermDef, TokenDef, TokenDefRefTokenTerm, TokenDefRefTokenTermDef, ZeroOrMoreTokenTerm, ZeroOrMoreTokenTermDef } from "../core/tokenLang";
import type { INodeRef, IReadNode } from "../node";


const
    HI_SUR = 0xd800,
    LOW_SUR = 0xdc00,
    AFTER_SUR = 0xe000,
    ASTRAL = 0x10000,
    MAX_UNICODE = 0x10ffff;


export class Edge {
    constructor(
        readonly from: number,
        readonly to: number,
        readonly target: State) { }

    toString() {
        return `${JSON.stringify(
            this.from < 0
                ? "𐍈"
                : charFor(this.from) + (this.to > this.from + 1 ? "-" + charFor(this.to - 1) : "")
        )}-> ${this.target.id}`;
    }
}

function charFor(n: number) {
    return n >= ASTRAL ? "TooLargeCharCode"
        : n >= 0xd800 && n < 0xe000 ? "\\Sur{" + n.toString(16) + "}"
            : String.fromCharCode(n)
}

/*
 State:
  - edges
  - accepts
  - id (maybe)
  - compile() to create a minimized DFA
  - closure() to get the epsilon closure of the state
*/
let stateId = 1;

export type Token = INodeRef | string;

export class State {
    id = stateId++;
    accepts: Token[] | undefined;
    edges: Edge[] = [];

    constructor(accepts?: Token[] | undefined) {
        this.accepts = accepts;
    }

    edge(from: number, to: number, target: State) {
        this.edges.push(new Edge(from, to, target));
    }

    nullEdge(target: State) { this.edge(-1, -1, target) }
}

/*
TokenSet:
  - startState
  - built
  - building
  - rules

  - getToken(token)
  - getLiteral(literalStr)
  - buildToken(token, from, to)
  - build(expr, fromState, toState)

*/

class BuildingToken {
    constructor(readonly tokenDef: INodeRef, readonly start: State, readonly end: State) { }
}

export class Tokens {
    mainStart: State = new State();
    built: Set<Token> = new Set();
    building: BuildingToken[] = [];
    keywords: Set<string> = new Set();
    keywordAccept: State = new State([""]); // empty string to accept the keyword

    makeToken(token: Token) {
        if (this.built.has(token)) return;
        if (typeof token === "string") {
            if (token.length === 0) {
                throw new Error(`Empty literal token`);
            }
            if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
                this.buildKeyword(token);
            } else {
                buildLiteral(token, this.mainStart, new State([token]));
            }
        } else {
            this.buildToken(token, this.mainStart, new State([token]));
        }
        this.built.add(token);
    }

    buildKeyword(keyword: string) {
        if (this.keywords.size === 0) {
            const loop = this.keywordAccept;
            charRange(this.mainStart, loop, "a", "z");
            charRange(this.mainStart, loop, "A", "Z");
            charRange(this.mainStart, loop, "_", "_");

            charRange(loop, loop, "a", "z");
            charRange(loop, loop, "A", "Z");
            charRange(loop, loop, "0", "9");
            charRange(loop, loop, "_", "_");
        }
        this.keywords.add(keyword);
    }

    buildToken(tokenDef: INodeRef, start: State, end: State) {
        let building = this.building.find(b => b.tokenDef === tokenDef);
        if (building) {
            if (building.end === end) {
                start.nullEdge(building.start);
                return;
            }
            const lastIndex = this.building.findIndex(b => b.tokenDef === tokenDef);
            throw new Error(`Invalid (non-tail) recursion in token definitions: ${this.building.slice(lastIndex).map(b => getTokenName(b.tokenDef)).join(" -> ")}`);
        }
        const tokenStart = new State();
        start.nullEdge(tokenStart);
        this.building.push(new BuildingToken(tokenDef, tokenStart, end));
        const term = TokenDef.TermCA.getChild(tokenDef.read!)?.read!;
        this.build(term, tokenStart, end);
        this.building.pop();
    }

    build(term: IReadNode, start: State, end: State) {
        if (term.def === TokenDefRefTokenTermDef) {
            const tokenDef = TokenDefRefTokenTerm.TokenFA.get(term)!;
            this.buildToken(tokenDef, start, end);
        } else if (term.def === ConstantCharTokenTermDef) {
            const value = ConstantCharTokenTerm.ValueFA.get(term)!;
            buildLiteral(unescape(value), start, end);
        } else if (term.def === ConstantStringTokenTermDef) {
            const value = ConstantStringTokenTerm.ValueFA.get(term)!;
            buildLiteral(unescape(value), start, end);
        } else if (term.def === CharRangeTokenTermDef) {
            const fromChar = getConstantChar(CharRangeTokenTerm.FromCA.getChild(term)?.read!);
            const toChar = getConstantChar(CharRangeTokenTerm.ToCA.getChild(term)?.read!);
            unicodeRange(start, end, fromChar, toChar + 1);
        } else if (term.def === NotTokenTermDef) {
            const ranges: [number, number][] = [];
            let charTerm = NotTokenTerm.CharsCNA.getFirstChild(term)?.read;
            for (; charTerm; charTerm = charTerm.next?.read) {
                if (charTerm.def === ConstantCharTokenTermDef) {
                    const value = getConstantChar(charTerm);
                    ranges.push([value, value + 1]);
                } else if (charTerm.def === CharRangeTokenTermDef) {
                    const from = getConstantChar(CharRangeTokenTerm.FromCA.getChild(charTerm)?.read!);
                    const to = getConstantChar(CharRangeTokenTerm.ToCA.getChild(charTerm)?.read!);
                    ranges.push([from, to + 1]);
                }
            }
            for (const [from, to] of invertRanges(ranges)) {
                unicodeRange(start, end, from, to);
            }
        } else if (term.def === ParenthesizedTokenTermDef) {
            const parTerm = ParenthesizedTokenTerm.TermCA.getChild(term)?.read!;
            this.build(parTerm, start, end);
        } else if (term.def === QuantizedTokenTermDef) {
            const quantTerm = QuantizedTokenTerm.TermCA.getChild(term)?.read!;
            const min = Number(QuantizedTokenTerm.MinFA.get(term)!);
            const isRange = QuantizedTokenTerm.IsRangeFA.get(term)!;
            let max = isRange ? Number(QuantizedTokenTerm.MaxFA.get(term)!) : min;
            if (max > 42) max = 42;
            for (let i = 1; i <= max; i++) {
                const next = i === max ? end : new State();
                this.build(quantTerm, start, next);
                if (i >= min && next !== end) {
                    next.nullEdge(end);
                }
                start = next;
            }
        } else if (term.def === OptionalTokenTermDef) {
            const optTerm = OptionalTokenTerm.TermCA.getChild(term)?.read!;
            this.build(optTerm, start, end);
            start.nullEdge(end);
        } else if (term.def === ZeroOrMoreTokenTermDef) {
            const zeroOrMoreTerm = ZeroOrMoreTokenTerm.TermCA.getChild(term)?.read!;
            const loop = new State();
            start.nullEdge(loop);
            this.build(zeroOrMoreTerm, loop, loop);
            loop.nullEdge(end);
        } else if (term.def === OneOrMoreTokenTermDef) {
            const oneOrMoreTerm = OneOrMoreTokenTerm.TermCA.getChild(term)?.read!;
            const loopStart = new State();
            const loopEnd = new State();
            start.nullEdge(loopStart);
            this.build(oneOrMoreTerm, loopStart, loopEnd);
            loopEnd.nullEdge(loopStart);
            loopEnd.nullEdge(end);
        } else if (term.def === ParameterizedTokenTermDef) {
            const paramTerm = ParameterizedTokenTerm.TermCA.getChild(term)?.read!;
            this.build(paramTerm, start, end);
        } else if (term.def === SequenceTokenTermDef) {
            const leftTerm = SequenceTokenTerm.LeftCA.getChild(term)?.read!;
            const rightTerm = SequenceTokenTerm.RightCA.getChild(term)?.read!;
            const middle = new State();
            this.build(leftTerm, start, middle);
            this.build(rightTerm, middle, end);
        } else if (term.def === AlternativeTokenTermDef) {
            const leftTerm = AlternativeTokenTerm.LeftCA.getChild(term)?.read!;
            const rightTerm = AlternativeTokenTerm.RightCA.getChild(term)?.read!;
            this.build(leftTerm, start, end);
            this.build(rightTerm, start, end);
        } else {
            throw new Error(`Unsupported token term: ${term.def}`);
        }
    }
}

function getConstantChar(constantCharTerm: IReadNode): number {
    const value = ConstantCharTokenTerm.ValueFA.get(constantCharTerm)!;
    return unescape(value).codePointAt(0)!;
}

function buildLiteral(value: string, start: State, end: State) {
    for (let i = 0; i < value.length; i++) {
        const next = i === value.length - 1 ? end : new State();
        const ch = value.charCodeAt(i);
        start.edge(ch, ch + 1, next);
        start = next;
    }
}


function invertRanges(ranges: [number, number][]) {
    let pos = 0, result: [number, number][] = [];
    for (let [a, b] of ranges.sort(([a1], [a2]) => a1 - a2)) {
        if (a > pos) result.push([pos, a]);
        if (b > pos) pos = b;
    }
    if (pos <= MAX_UNICODE) result.push([pos, MAX_UNICODE + 1])
    return result
}

function unicodeRange(start: State, end: State, from: number, to: number) {
    if (from < ASTRAL) {
        if (from < HI_SUR) start.edge(from, Math.min(to, HI_SUR), end);
        if (to > AFTER_SUR) start.edge(Math.max(from, AFTER_SUR), Math.min(to, ASTRAL), end);
        from = ASTRAL;
    }
    if (to <= ASTRAL) return;

    let fromStr = String.fromCodePoint(from), maxStr = String.fromCodePoint(to - 1);
    let fromHiSur = fromStr.charCodeAt(0), fromLowSur = fromStr.charCodeAt(1);
    let maxHiSur = maxStr.charCodeAt(0), maxLowSur = maxStr.charCodeAt(1);
    if (fromHiSur == maxHiSur) { // Share the first char code
        let hop = new State();
        start.edge(fromHiSur, fromHiSur + 1, hop);
        hop.edge(fromLowSur, maxLowSur + 1, end);
    } else {
        let midHiSurFrom = fromHiSur, midHiSurMax = maxHiSur;
        if (fromLowSur > LOW_SUR) {
            midHiSurFrom++;
            let hop = new State();
            start.edge(fromHiSur, fromHiSur + 1, hop);
            hop.edge(fromLowSur, AFTER_SUR, end);
        }
        if (maxLowSur + 1 < AFTER_SUR) {
            midHiSurMax--;
            let hop = new State();
            start.edge(maxHiSur, maxHiSur + 1, hop);
            hop.edge(LOW_SUR, maxLowSur + 1, end);
        }
        if (midHiSurFrom <= midHiSurMax) {
            let hop = new State();
            start.edge(midHiSurFrom, midHiSurMax + 1, hop);
            hop.edge(LOW_SUR, AFTER_SUR, end);
        }
    }
}

function charRange(start: State, end: State, fromChar: string, toChar: string) {
    unicodeRange(start, end, fromChar.codePointAt(0)!, toChar.codePointAt(0)! + 1);
}

function getTokenName(token: Token) {
    return typeof token === "string" ? token : getNodeName(token);
}

function unescape(value: string) {
    return value.replace(/\\(.)/g, (_, ch) => {
        if (ch === 'n') return '\n';
        if (ch === 'r') return '\r';
        if (ch === 't') return '\t';
        return ch;
    });
}