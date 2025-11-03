import { structureLangHeap } from "../core/structureLang";
import { grammarLangHeap, ConstantStringTermDef, ConstantStringTerm } from "../core/grammarLang";
import { tokenLangHeap } from "../core/tokenLang";
import "../core/postDefinitions";
import { forAllNodes } from "../editor/renderUtils";
import type { Heap } from "../heap";
import { getNodeName, TokenDefDef } from "../concept";
import type { INodeRef } from "../node";
import { State, Tokens, type Token } from "./token";



export function collectTokens(heap: Heap, tokenDefs: INodeRef[], constantStringTokenTerms: INodeRef[]) {
    forAllNodes(heap.root.read, node => {
        if (node.def == TokenDefDef) {
            tokenDefs.push(node.me);
        }
        if (node.def == ConstantStringTermDef) {
            constantStringTokenTerms.push(node.me);
        }
    });
}

export function getAllTokens() {
    const tokenDefs: INodeRef[] = [];
    const constantStringTokenTerms: INodeRef[] = [];
    collectTokens(structureLangHeap, tokenDefs, constantStringTokenTerms);
    collectTokens(grammarLangHeap, tokenDefs, constantStringTokenTerms);
    collectTokens(tokenLangHeap, tokenDefs, constantStringTokenTerms);
    const tokenDefNames = tokenDefs.map(node => getNodeName(node));
    const constantTokens = new Set(constantStringTokenTerms.map(node => ConstantStringTerm.ValueFA.get(node.read!)!));
    return { tokenDefs, tokenDefNames, constantTokens };
}

export function buildTokens(tokenDefs: INodeRef[], constantTokens: Set<string>) {
    const now = performance.now();
    const tokens = new Tokens();
    for (const tokenDef of tokenDefs) {
        tokens.makeToken(tokenDef);
    }
    for (const constantToken of constantTokens) {
        tokens.makeToken(constantToken);
    }
    console.log(`Built tokens in ${performance.now() - now}ms`);
    return tokens;
}

export function tokenStateDiagram(start: State) {
    const visited = new Set<State>();
    const lines: string[] = [];

    function describeAccepts(accepts: Set<Token> | undefined) {
        if (!accepts?.size) return "";
        const labels = [];
        for (const t of accepts) {
            labels.push(typeof t === "string" ? JSON.stringify(t) : getNodeName(t)!);
        }
        return ` [${labels.join(", ")}]`;
    }

    function printState(state: State | undefined, indent: string) {
        if (!state || visited.has(state)) return;
        visited.add(state);
        // const accepts = describeAccepts(state.accepts);
        // if (accepts.length > 0) {
        //     lines.push(`${indent}S${state.id}${accepts}`);
        // }
        const edgeIndent = indent + "  ";
        let lastTarget: State | undefined = undefined;
        for (const edge of state.edges.slice().sort((a, b) => a.target.id - b.target.id || a.from - b.from)) {
            if (lastTarget !== edge.target) {
                printState(lastTarget, edgeIndent + "⁝ ");
            }
            const accepts = describeAccepts(edge.target.accepts);
            lines.push(`${edgeIndent}${edge.toString()}${accepts}${edge.target.edges.length ? ":" : ""}`);
            lastTarget = edge.target;
        }
        printState(lastTarget, edgeIndent + "⁝ ");
    }

    lines.push(`${start.id}${describeAccepts(start.accepts)}`);
    printState(start, "");
    return lines.join("\n");
}