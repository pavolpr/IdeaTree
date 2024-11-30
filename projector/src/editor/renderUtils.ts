import { conceptDefDef } from "../concept";
import { Projection, ProjectionDef } from "../core/grammarLang";
import { Heap } from "../heap";
import { INodeRef, IReadNode } from "../node";
import { TypeKind } from "../type";


export interface IRenderContext {
    //addToProjectionMap(langHeap: Heap): void;
    //renderHeap(heap: Heap): ??
    renderNode(nodeRef: INodeRef, sepTerm?: INodeRef): void;
    renderChildren(firstChild: INodeRef | undefined): void;
    addToken(token: string, idRef: INodeRef): void;
    renderField(node: IReadNode, member: INodeRef, idRef: INodeRef): void;
    dropSpace(): void;
    startNewLine(): void;
    addIndent(): void;
    subIndent(): void;
    readonly styles: string;
    pushStyle(style: INodeRef): void;
    popStyle(prevStyles: string): void;
    setSeparator(term: INodeRef): void;
    clearSeparator(): INodeRef | undefined;
}

export class ProjectionMap {
    readonly map = new Map<INodeRef, INodeRef>();

    addToProjectionMap(langHeap: Heap) {
        const map = this.map;
        forAllNodes(langHeap.root.read, node => {
            if(node.def == ProjectionDef) {
                let conceptDef = node.parent?.read;
                if(conceptDef?.def != conceptDefDef) {
                    conceptDef = Projection.ConceptFA.get(node)?.read;
                }
                if(conceptDef == undefined) {
                    throw new Error(`no owner of the projection, node:${node}`);
                }
                map.set(conceptDef.me, node.me);
            }
        }, true);
    }

    projection(node: IReadNode): IReadNode | undefined {
        return this.map.get(node.def)?.read;
    }
}

export function forAllNodes(node: IReadNode, run: (node: IReadNode) => void, excludeTop = false) {
    if(!excludeTop)
        run(node);
    
    const fields = node.type.fields;
    for(let i = 0; i < fields.length; i++) {
        const field = fields[i];
        if(field.type.kind == TypeKind.ChildNode) {
            let child = (node.getFieldAt(i) as INodeRef | undefined)?.read;
            for(; child != undefined; child = child.next?.read) {
                forAllNodes(child, run, false);
            }
        }
    }
}