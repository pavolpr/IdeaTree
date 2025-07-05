import type { INodeRef, IReadNode } from "../node";
import { Projection, ProjectionTerm } from "../core/grammarLang";
import type { Heap } from "../heap";
import type { IRenderContext, ProjectionMap } from "./renderUtils";

export class StringRenderContext implements IRenderContext {
    readonly projectionMap: ProjectionMap;

    constructor(projectionMap: ProjectionMap) {
        this.projectionMap = projectionMap;
    }

    renderHeap(heap: Heap) {
        this.string = "";
        this.renderNode(heap.root);
        return this.string;
    }

    renderNode(nodeRef: INodeRef, sepTerm?: INodeRef) {
        this.clearSeparator(); //just in case?

        const node = nodeRef.read;

        if (sepTerm) {
            ProjectionTerm.render(sepTerm.read, node, this); //TODO: ? node should be the parent
        }

        const proj = this.projectionMap.projection(node);
        if (proj == undefined) {
            this.addToken(`<<no projection, node: ${node}>>`, nodeRef);
            return;
        }

        let term = Projection.TermsCNA.getFirstChild(proj)?.read;
        for (; term != undefined; term = term.next?.read) {
            ProjectionTerm.render(term, node, this);
        }
    }

    renderChildren(firstChild: INodeRef | undefined) {
        const sepTerm = this.clearSeparator();

        let isNext = false;
        let node = firstChild?.read;
        for (; node != undefined; node = node.next?.read) {

            this.renderNode(node.me, isNext ? sepTerm : undefined);
            isNext = true;
        }
    }

    string = ""
    addToken(token: string, _idRef: INodeRef) {
        //TODO
        if (this.isNewLine) {
            this.string += "\n";
            for (let i = 0; i < this.indent; i++) this.string += "    ";
            this.isNewLine = false;
            this.isDropSpace = false;
        }
        else if (this.isDropSpace) {
            this.isDropSpace = false;
        }
        else this.string += " ";
        this.string += token;
    }

    renderField(node: IReadNode, member: INodeRef, idRef: INodeRef) {
        this.addToken(node.getField(member!)!.toString(), idRef);
    }

    isDropSpace = true;
    dropSpace() {
        this.isDropSpace = true;
    }

    isNewLine = true;
    startNewLine() {
        this.isNewLine = true;
        //this.isDropSpace = true;
    }

    indent = 0;
    addIndent() {
        this.indent++;
    }
    subIndent() {
        this.indent--;
    }

    styles: string = "";
    pushStyle(_style: INodeRef) {
        //this.styles.push(style);
    }
    popStyle() {
        //this.styles.pop();
    }

    separator: INodeRef | undefined = undefined;
    setSeparator(term: INodeRef) {
        this.separator = term;
    }
    clearSeparator() {
        const sep = this.separator;
        this.separator = undefined;
        return sep;
    }
}

