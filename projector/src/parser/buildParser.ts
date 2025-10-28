import { structureLangHeap } from "../core/structureLang";
import { grammarLangHeap, ConstantStringTermDef, ConstantStringTerm } from "../core/grammarLang";
import { tokenLangHeap } from "../core/tokenLang";
import "../core/postDefinitions";
import { forAllNodes } from "../editor/renderUtils";
import type { Heap } from "../heap";
import { getNodeName, TokenDefDef } from "../concept";
import type { INodeRef } from "../node";



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
    const constantTokens = new Set(constantStringTokenTerms.map(node => ConstantStringTerm.ValueFA.get(node.read!)));
    return { tokenDefs, tokenDefNames, constantTokens };
}

