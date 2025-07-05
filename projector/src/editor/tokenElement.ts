import { Reaction } from "../mx/reaction";
import type { INodeRef } from "../node";
import { DomRenderContext } from "./DomRenderContext";
import { DomRenderingProjection, removeRange } from "./DomRenderingProjection";

export const TokenElementType = {
    Const: 0, Property: 1, NewLine: 2, Node: 3, StructuredToken: 4
} as const;
export type TokenElementType = typeof TokenElementType[keyof typeof TokenElementType];

export interface ITokenElement {
    //styles?: INodeRef[];
    //hintId?: INodeRef;
    index: number;
    readonly parent: TokenTree | undefined;
    readonly endSpan: ChildNode | null | undefined; //undefined means not rendered yet
    readonly elementType: TokenElementType;
    isTokenTree(): this is TokenTree;
    isStructuredToken(): this is StructuredTokenTT;
    isTokenConst(): this is TokenConst;
    isNewLineTE(): this is NewLineTE;
}

export class TokenConst implements ITokenElement {
    index = 0;
    parent: TokenTree | undefined;
    text: string;
    classNames: string | undefined;
    readonly idRef: INodeRef;
    readonly endSpan: HTMLSpanElement;

    get elementType() { return TokenElementType.Const }
    isTokenTree(): this is TokenTree { return false }
    isStructuredToken(): this is StructuredTokenTT { return false }
    isTokenConst(): this is TokenConst { return true }
    isNewLineTE(): this is NewLineTE { return false }

    constructor(
        parent: TokenTree | undefined,
        text: string,
        classNames: string | undefined,
        idRef: INodeRef,
        endSpan: HTMLSpanElement
    ) {
        this.parent = parent;
        this.text = text;
        this.classNames = classNames;
        this.idRef = idRef;
        this.endSpan = endSpan;
        parent?.projection.span2TE.set(endSpan, this);
    }
    //hasSpace
    //span element
}

// export class TokenProperty implements ITokenElement {
//     get elementType() { return TokenElementType.Property }
//     isTokenTree() { return false }
//     isStructuredToken() { return false }
//     isTokenConst() { return false }
//     isNewLineTE() { return false }
//     constructor(
//         public projectedNode: INodeRef,
//         public property: INodeRef
//     ) {

//     }
//     endSpan: ChildNode | null | undefined = undefined; //undefined means not rendered yet
//     //hasSpace
//     //span element
//     //reaction on the property itself
// }

// export class TokenIndent extends TokenElement {
//     constructor(
//         public indent: number
//     ) {
//         super();
//     }
//     //span element
// }
export class NewLineTE implements ITokenElement {
    index = 0;
    parent: TokenTree | undefined;
    indent: number;

    get endSpan(): ChildNode | null { return null } //never participate with endSpan
    get elementType() { return TokenElementType.NewLine }
    isTokenTree(): this is TokenTree { return false }
    isStructuredToken(): this is StructuredTokenTT { return false }
    isTokenConst(): this is TokenConst { return false }
    isNewLineTE(): this is NewLineTE { return true }

    constructor(
        parent: TokenTree | undefined,
        indent: number,
    ) {
        this.parent = parent;
        this.indent = indent;
    }

    //div element ??
}

export abstract class TokenTree extends Reaction implements ITokenElement {
    index: number = 0;
    parent: TokenTree | undefined;
    endSpan: ChildNode | null | undefined; //undefined means not rendered yet
    abstract get elementType(): TokenElementType;

    elements: ITokenElement[] = [];
    readonly projection: DomRenderingProjection;

    indent!: number;
    styles!: string;

    isDropSpace!: boolean;
    isNewLine!: boolean;
    isTokenMode!: boolean;

    endIsDropSpace: boolean = false;
    endIsNewLine: boolean = false;

    isTokenTree(): this is TokenTree { return true }
    isStructuredToken(): this is StructuredTokenTT { return false }
    isTokenConst(): this is TokenConst { return false }
    isNewLineTE(): this is NewLineTE { return false }

    constructor(
        parentCtx: DomRenderContext
    ) {
        super(undefined);
        this.setParentContext(parentCtx);
        this.projection = parentCtx.projection;
    }

    setParentContext(parentCtx: DomRenderContext) {
        this.parent = parentCtx.tokenTree;

        this.indent = parentCtx.indent;
        this.styles = parentCtx.styles;

        this.isDropSpace = parentCtx.isDropSpace;
        this.isNewLine = parentCtx.isNewLine;
        this.isTokenMode = parentCtx.isTokenMode;
    }

    getSpanBefore() {
        //INVARIANT: only called on rendered tree
        let tt: TokenTree = this;
        for (let parent = tt.parent; parent; tt = parent, parent = tt.parent) {
            for (let idx = tt.index - 1; idx >= 0; idx--) {
                const endSpan = parent.elements[idx]?.endSpan;
                if (endSpan) return endSpan;
            }
        }
        return this.projection.getFirstSpan();
    }

    correctEndSpan() {
        //INVARIANT: only called on rendered tree
        let endSpan = null;
        const elems = this.elements;
        for (let idx = elems.length - 1; idx >= 0; idx--) {
            endSpan = elems[idx].endSpan;
            if (endSpan) break;
        }
        this.setNewEndSpan(endSpan);
    }

    setNewEndSpan(newEndSpan: ChildNode | null | undefined) {
        if (this.endSpan !== newEndSpan) {
            this.endSpan = newEndSpan;
            if (this.parent)
                this.parent.correctEndSpan();
        }
    }

    isDeleted() {
        //INVARIANT: only called on semi-rendered tree
        let tt: TokenTree = this;
        for (let parent = tt.parent; parent; tt = parent, parent = tt.parent) {
            const delIdx = this.projection.deletedMap.get(parent);
            if (delIdx !== undefined && tt.index >= delIdx)
                return true;
        }
        return false;
    }

    deleteChildren(delIdx: number) {
        //INVARIANT: only called on semi-rendered tree - no undefined elements
        const elements = this.elements;
        //dispose all the deleted sub-trees
        for (let i = delIdx; i < elements.length; i++) {
            const child = elements[i]!;
            if (child.isTokenTree()) child.dispose();
        }
        elements.length = delIdx;

        //re-set endSpan and elements
        const endDelSpan = this.endSpan;
        if (!endDelSpan) return; //can happen when the deleted elems are also empty
        this.correctEndSpan();

        //remove DOM        
        const beforeDelSpan = this.endSpan ?? this.getSpanBefore();
        removeRange(beforeDelSpan, endDelSpan);
    }

    dispose() {
        //INVARIANT: only called on rendered tree
        super.dispose();
        for (const child of this.elements) {
            if (child?.isTokenTree()) child.dispose();
        }
    }

    depth() {
        let d = 0;
        for (let p = this.parent; p; p = p.parent) d++;
        return d;
    }
    computeOffsetPath(path: number[]) {
        if (this.parent) {
            this.parent.computeOffsetPath(path);
            path.push(this.index);
        }
        return path;
    }

    onBecomeStale() {
        //invalidate the main Reaction in projection
        if (!this._isScheduled) {
            this._isScheduled = true;
            this.projection.onInvalidatedTree(this);
        }
    }
    //isNewLine
    //isDropSpace
    //indent
    //??styles
    //parent TT
    //mutable token index, length, so that any token tree can be sorted by position
    //reaction
    //start DOM line, first elem/index
    //end DOM line, last elem/index

    abstract render(): void;
    //abstract reRender() : void;

    renderTracked() {
        this.track(this.render, this);
    }

    onInvalidate() {
        this.projection.setCurrentSpan(this.getSpanBefore());
        const prevEndIsNewLine = this.endIsNewLine;
        const prevEndIdDropSpace = this.endIsDropSpace;
        this.track(this.render, this);
        //correct next token for endIsDropSpace and endIsNewLine
        if (prevEndIsNewLine !== this.endIsNewLine
            || !prevEndIsNewLine && prevEndIdDropSpace !== this.endIsDropSpace) {
            //this.correctEndState();
            this.parent?.onInvalidate();
        }
    }

}

export class ProjectedNodeTT extends TokenTree {
    projectedNode: INodeRef;
    separatorTerm: INodeRef | undefined;

    get elementType() { return TokenElementType.Node }

    constructor(
        parentCtx: DomRenderContext,
        projectedNode: INodeRef,
        separatorTerm: INodeRef | undefined
    ) {
        super(parentCtx);
        this.projectedNode = projectedNode;
        this.separatorTerm = separatorTerm;
    }

    render() {
        console.log("render node:" + this.computeOffsetPath([]));
        const ctx = new DomRenderContext(this.projection, this);
        //const startSpan = this.projection.span!;

        ctx.isTokenMode = false;
        ctx.renderNodeChildren(this.projectedNode, this.separatorTerm?.read);

        this.endIsDropSpace = ctx.isDropSpace;
        this.endIsNewLine = ctx.isNewLine;

        //if(this.endSpan === undefined) this.endSpan = null; //mark rendered; meybe YAGNI
        //const span = this.projection.span
        //this.setNewEndSpan(startSpan !== span ? span : null);
    }

    dispose() {
        //INVARIANT: only called on rendered tree
        super.dispose();
        this.projection.projectedNodeMap.delete(this.projectedNode);
    }
}

export class StructuredTokenTT extends TokenTree {
    token: string;
    trivia: INodeRef;
    tokenPosition: number;
    readonly idRef: INodeRef;

    get elementType() { return TokenElementType.StructuredToken }
    isStructuredToken(): this is StructuredTokenTT { return true }

    constructor(
        parentCtx: DomRenderContext,
        token: string,
        trivia: INodeRef,
        tokenPosition: number,
        idRef: INodeRef
    ) {
        super(parentCtx);
        this.token = token;
        this.trivia = trivia;
        this.tokenPosition = tokenPosition;
        this.idRef = idRef;
    }

    endTrivia: INodeRef | undefined = undefined;

    render() {
        console.log("render token:" + this.computeOffsetPath([]));
        const ctx = new DomRenderContext(this.projection, this);
        //const startSpan = this.projection.span!;

        ctx.isTokenMode = true;
        ctx.addTokenWithTriviaChildren(this.trivia.read, this.token, this.tokenPosition, this.idRef);
        this.endTrivia = ctx.trivia;

        this.endIsDropSpace = this.isTokenMode;
        this.endIsNewLine = ctx.isNewLine;

        //const span = this.projection.span
        //this.setNewEndSpan(startSpan !== span ? span : null);
    }
}

export function removeTE(parentChildren: ITokenElement[], index: number) {
    for (let i = index; i + 1 < parentChildren.length; i++) {
        const te = parentChildren[i + 1];
        parentChildren[i] = te;
        if (te.isTokenTree()) te.index = i;
    }
    parentChildren.length--;
}