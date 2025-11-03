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
        public target: State) { }

    toString() {
        return `${this.from < 0
            ? "𐍈"
            : charFor(this.from) + (this.to > this.from + 1 ? "-" + charFor(this.to - 1) : "")
            } -> ${this.target.id}`;
    }
}

function charFor(n: number) {
    if (n >= ASTRAL) return `!!Astral(${n.toString(16)})`;
    if (n >= HI_SUR && n < AFTER_SUR) return n.toString(16);
    const ch = String.fromCharCode(n);
    if (/^[a-zA-Z0-9]$/.test(ch)) return ch;
    return `'${ch}'${n.toString(16)}`;
}



let stateId = 1;

export type Token = INodeRef | string;

export class State {
    id = stateId++;
    accepts: Set<Token> | undefined;
    edges: Edge[] = [];

    constructor(accepts?: Set<Token> | undefined) {
        this.accepts = accepts?.size ? accepts : undefined;
    }

    edge(from: number, to: number, target: State) {
        this.edges.push(new Edge(from, to, target));
    }

    nullEdge(target: State) { this.edge(-1, -1, target) }

    closure() {
        const result: State[] = [], seen: Set<State> = new Set();
        function close(state: State): void {
            if (seen.has(state)) return;
            seen.add(state);
            result.push(state);
            for (const edge of state.edges) {
                if (edge.from < 0) close(edge.target);
            }
        }
        close(this);
        return result;
    }

    dfa() {
        const now = performance.now();
        const visited: Map<string, State> = new Map();
        const acceptMap: Map<string, Set<Token>> = new Map();
        const startStates = this.closure().sort((a, b) => a.id - b.id);
        const start = visit(startStates);
        console.log("dfa ms:", performance.now() - now);
        console.log("visited #", visited.size);
        console.log("acceptMap #", acceptMap.size);
        const newStart = minimize(Array.from(visited.values()), start);
        console.log("minimize ms:", performance.now() - now);
        return newStart;

        function visit(sortedStates: State[]): State {
            let accepts;
            for (const state of sortedStates)
                if (state.accepts)
                    for (const accept of state.accepts)
                        (accepts ??= new Set<Token>()).add(accept);

            const state = new State(internAccepts(accepts));
            visited.set(ids(sortedStates), state);

            const out: Edge[] = [];
            for (const state of sortedStates)
                for (const edge of state.edges)
                    if (edge.from >= 0) out.push(edge);

            const dfaOut = dfaEdges(out);
            for (const edge of dfaOut) {
                const target = visited.get(ids(edge.targets)) || visit(edge.targets);
                state.edge(edge.from, edge.to, target);
            }
            return state;
        }

        function internAccepts(accepts: Set<Token> | undefined): Set<Token> | undefined {
            if (!accepts?.size) return undefined;

            const id = Array.from(accepts).map(token =>
                typeof token === "string"
                    ? JSON.stringify(token) // need to properly delimit literal strings
                    : token.uid.toString()
            ).sort().join(".");

            const interned = acceptMap.get(id);
            if (interned) return interned;

            acceptMap.set(id, accepts);
            return accepts;
        }
    }
}

function minimize(states: State[], start: State) {
    let partition: Map<State, State[]> = new Map();
    const byAccepting: Map<Set<Token> | undefined, State[]> = new Map();
    for (const state of states) {
        let group = byAccepting.get(state.accepts);
        if (!group) byAccepting.set(state.accepts, group = []);
        group.push(state);
        partition.set(state, group);
    }

    for (; ;) {
        let split = false;
        const newPartition: Map<State, State[]> = new Map();
        for (const state of states) {
            if (newPartition.has(state)) continue;
            const group = partition.get(state)!;
            if (group.length === 1) {
                newPartition.set(state, group!);
                continue;
            }
            let parts = [];
            groups: for (const state of group) {
                for (const p of parts) {
                    if (isEquivalent(state, p[0]!, partition)) {
                        p.push(state);
                        continue groups;
                    }
                }
                parts.push([state]);
            }
            if (parts.length > 1) split = true;
            for (const p of parts)
                for (const s of p)
                    newPartition.set(s, p);
        }
        if (!split) return applyMinimization(states, start, partition);
        partition = newPartition;
    }
}

function isEquivalent(a: State, b: State, partition: Map<State, State[]>): boolean {
    if (a.edges.length !== b.edges.length) return false;
    for (let i = 0; i < a.edges.length; i++) {
        const edgeA = a.edges[i]!, edgeB = b.edges[i]!;
        if (edgeA.from !== edgeB.from || edgeA.to !== edgeB.to || partition.get(edgeA.target) !== partition.get(edgeB.target))
            return false;
    }
    return true;
}

function applyMinimization(states: State[], start: State, partition: Map<State, State[]>): State {
    const newStates: State[] = [];
    const eliminated: State[] = [];
    for (const state of states) {
        if (partition.get(state)![0]! === state) {
            newStates.push(state);
            for (let i = 0; i < state.edges.length; i++) {
                const edge = state.edges[i]!, target = partition.get(edge.target)![0]!;
                if (target !== edge.target) edge.target = target;
            }
        } else {
            eliminated.push(state);
        }

    }
    console.log("newStates #", newStates.length, "eliminated #", eliminated.length);
    return partition.get(start)![0]!;
}




//const EMPTY_TOKEN: Token[] = [];
function ids(states: State[]) {
    return states.map(state => state.id).join(".");
}

class DFAEdge {
    constructor(readonly from: number, readonly to: number, readonly targets: State[]) { }
}

function dfaEdges(edges: Edge[]): DFAEdge[] {
    const points: number[] = [], result: DFAEdge[] = [];
    for (const edge of edges) {
        if (!points.includes(edge.from)) points.push(edge.from);
        if (!points.includes(edge.to)) points.push(edge.to);
    }
    points.sort((a, b) => a - b);
    for (let i = 1; i < points.length; i++) {
        const from = points[i - 1]!, to = points[i]!;
        const found: State[] = [];
        for (const edge of edges)
            if (edge.to > from && edge.from < to)
                for (const target of edge.target.closure())
                    if (!found.includes(target))
                        found.push(target);

        if (found.length)
            result.push(new DFAEdge(from, to, found.sort((a, b) => a.id - b.id)));
    }
    return result;
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
    keywordAccept: State = new State(new Set<Token>().add("")); // empty string to accept the keyword

    makeToken(token: Token) {
        if (this.built.has(token)) return;
        if (typeof token === "string") {
            if (token.length === 0) {
                throw new Error(`Empty literal token`);
            }
            if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
                this.buildKeyword(token);
            } else {
                buildLiteral(token, this.mainStart, new State(new Set<Token>().add(token)));
            }
        } else {
            this.buildToken(token, this.mainStart, new State(new Set<Token>().add(token)));
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
        //const tokenStart = start;
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