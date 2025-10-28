import { getNodeName } from "../concept";
import { CharRangeTokenTerm, CharRangeTokenTermDef, ConstantCharTokenTerm, ConstantCharTokenTermDef, ConstantStringTokenTerm, ConstantStringTokenTermDef, TokenDef, TokenDefRefTokenTerm, TokenDefRefTokenTermDef } from "../core/tokenLang";
import type { INodeRef } from "../node";


export const MAX_CHAR_CODE = 0xffff

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
    return n > MAX_CHAR_CODE ? "TooLargeCharCode"
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
    constructor(readonly token: Token, readonly start: State, readonly to: State) { }
}

export class Tokens {
    startState: State = new State();
    built: Set<Token> = new Set();
    building: BuildingToken[] = [];

    makeToken(token: Token) {
        if (this.built.has(token)) return;
        this.buildToken(token, this.startState, new State([token]));
        this.built.add(token);
    }

    buildToken(token: Token, from: State, to: State) {
        let building = this.building.find(b => b.token === token);
        if (building) {
            if (building.to === to) {
                from.nullEdge(building.start);
                return;
            }
            const lastIndex = this.building.findIndex(b => b.token === token);
            throw new Error(`Invalid (non-tail) recursion in token definitions: ${this.building.slice(lastIndex).map(b => getTokenName(b.token)).join(" -> ")}`);
        }
        const start = new State();
        from.nullEdge(start);
        this.building.push(new BuildingToken(token, start, to));
        this.build(token, start, to);
        this.building.pop();
    }

    build(token: Token, from: State, to: State) {
        if (typeof token === "string") {
            //TODO: build literal or keyword
        } else {
            //TODO: build token
            const tokenDef = token.read!;
            const term = TokenDef.TermCA.getChild(tokenDef)?.read!;
            if (term.def === TokenDefRefTokenTermDef) {
                const tokenDefRef = TokenDefRefTokenTerm.TokenFA.get(term)!;
                this.buildToken(tokenDefRef, from, to);
            } else if (term.def === ConstantCharTokenTermDef) {
                const value = ConstantCharTokenTerm.ValueFA.get(term)!;
                this.buildLiteral(value, from, to);
            } else if (term.def === ConstantStringTokenTermDef) {
                const value = ConstantStringTokenTerm.ValueFA.get(term)!;
                this.buildLiteral(value, from, to);
            } else if (term.def === CharRangeTokenTermDef) {
                const fromChar = ConstantStringTokenTerm.ValueFA.get(CharRangeTokenTerm.FromCA.getChild(term)?.read!)!;
                const toChar = ConstantStringTokenTerm.ValueFA.get(CharRangeTokenTerm.ToCA.getChild(term)?.read!)!;
                from.edge(fromChar.charCodeAt(0), toChar.charCodeAt(0), to);
            }
        }

    }

function getTokenName(token: Token) {
    return typeof token === "string" ? token : getNodeName(token);
}