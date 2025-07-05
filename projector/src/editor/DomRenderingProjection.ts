import type { INodeRef } from "../node";
import { Heap } from "../heap";
import { ProjectionMap } from "./renderUtils";
import { ProjectedNodeTT, type ITokenElement, TokenTree, TokenConst } from "./tokenElement";
import { Reaction } from "../mx/reaction";
import { changeSourcesStateToUpToDate, TrackingState } from "../mx/derivation";
import { DomRenderContext } from "./DomRenderContext";
import { DomCursor } from "./DomCursor";

export class DomRenderingProjection extends Reaction {
    readonly projectionMap: ProjectionMap;

    constructor(projectionMap: ProjectionMap) {
        super(undefined);
        this.projectionMap = projectionMap;
        this.dom = document.createElement("div");
        this.dom.style.position = "relative";

        const cursor = new DomCursor();
        this.lines = document.createElement("div");
        this.lines.onclick = (e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === "SPAN") {
                const tt = this.span2TE.get(target);
                if (tt) {
                    const viewRect = this.dom.getBoundingClientRect();
                    cursor.click(e, tt, viewRect);
                }
            }
        };
        //this.newLine(0);
        this.currentLine = this.lines.appendChild(document.createElement("div"));
        //always present empty span on the first line to serve as the previous span for the first token
        this.addSpan(""); //maybe we can consider null as the "start" of all spans

        this.dom.appendChild(cursor.dom);
        this.dom.appendChild(this.lines);
    }

    readonly projectedNodeMap = new Map<INodeRef, ProjectedNodeTT>();
    readonly deletedMap = new Map<TokenTree, number/*index from*/>();
    readonly span2TE = new WeakMap<ChildNode, TokenConst>();

    rootTT?: ITokenElement = undefined;
    invalidatedTTs: TokenTree[] = [];

    dom: HTMLElement;
    lines: HTMLDivElement;
    currentLine: ChildNode;
    span: ChildNode | null = null; //never null after a render, because newLine() must be followed by an addSpan()

    onInvalidate() {
        changeSourcesStateToUpToDate(this);

        //re-render
        for (; ;) {
            if (this.invalidatedTTs.length > 1) {
                this.invalidatedTTs.sort(compareTrees);
            }

            let deletedCount = 0;
            for (let i = 0; i < this.invalidatedTTs.length; i++) {
                const tt = this.invalidatedTTs[i];
                if (tt.isDeleted()) {
                    this.invalidatedTTs[deletedCount++] = tt;
                } else {
                    tt.runReaction();
                }
            }
            if (this.invalidatedTTs.length === deletedCount || deletedCount === 0)
                break;
            this.invalidatedTTs.length = deletedCount;
        }
        this.invalidatedTTs.length = 0;

        //dispose and remove DOM
        for (const [tt, delIdx] of this.deletedMap) {
            tt.deleteChildren(delIdx);
        }
        this.deletedMap.clear();
    }

    onInvalidatedTree(tt: TokenTree) {
        this.invalidatedTTs.push(tt);
        this.onBecomeStale();
        this.sourcesState = TrackingState.Stale;
    }

    getFirstSpan() {
        return this.lines.firstChild!.firstChild!;
    }

    newLine(indent: number) {
        this.currentLine = this.lines.insertBefore(document.createElement("div"), this.currentLine!.nextSibling);
        this.span = null;

        if (!indent)
            return null;

        this.addSpan(this.getSpanText(indent), indentClassName);
    }
    getSpanText(indent: number) {
        let indentText = "";
        for (; indent > 0; indent--) {
            indentText += "\u00A0\u00A0\u00A0\u00A0"; //&nbsp
        }
        return indentText;
    }
    addSpan(text: string, className?: string) {
        let spanDom = document.createElement("span");
        if (className) spanDom.className = className;
        spanDom.appendChild(document.createTextNode(text));
        return this.span = this.currentLine!.insertBefore(spanDom, this.span && this.span.nextSibling);
    }
    addSpanDom(spanDom: ChildNode) {
        this.span = this.currentLine!.insertBefore(spanDom, this.span && this.span.nextSibling);
    }
    setCurrentSpan(span: ChildNode) {
        this.span = span;
        this.currentLine = span.parentElement!;
    }

    moveRange(ttBeforeSpan: ChildNode, ttEndSpan: ChildNode) {
        const startSpan = this.span;
        let ttSpan: ChildNode | null = ttBeforeSpan;
        if (ttSpan === startSpan) return; //already in-place; this can happen when only empty tt-s are preceding the moved tt
        ttSpan = nextSpan(ttSpan)!; //move on the start tt span

        let nextSpanOnStartLine = startSpan!.nextSibling;
        let ttLine: ChildNode | null = ttSpan.parentElement;

        //checking of previousSibling should be enough, because if it is get by nextSpan()
        //it is the same as !isFirstToken(ttSpan) here
        if (ttSpan.previousSibling) {
            //ttSpan does not own the line - it is not the first child
            //move spans not belonging to the tt starting line        
            const startLine = this.currentLine!;
            do {
                const toMoveSpan = ttSpan;
                const isLast = ttSpan === ttEndSpan;
                if (!isLast) ttSpan = ttSpan!.nextSibling;
                startLine.insertBefore(toMoveSpan!, nextSpanOnStartLine);
                if (isLast) return; //all tt spans where on the same line (and they did not own the line)
            } while (ttSpan);
            ttLine = ttLine!.nextSibling;
        }

        this.moveLines(ttLine, ttEndSpan, nextSpanOnStartLine);
    }

    moveLines(ttStartLine: ChildNode | null, ttEndSpan: ChildNode, nextSpanOnStartLine: ChildNode | null) {
        let ttEndLine = ttEndSpan.parentElement;
        const insertBeforeLine = this.currentLine.nextSibling;
        if (insertBeforeLine !== ttStartLine) {
            //tt lines are not in place, move them
            //move the tt tail to previous line 
            const ttBeforeLine = ttStartLine!.previousSibling;
            for (let ttSpan = ttEndSpan.nextSibling; ttSpan;) {
                const tsToMove = ttSpan;
                ttSpan = ttSpan.nextSibling;
                ttBeforeLine!.appendChild(tsToMove);
            }
            //move the lines
            let isEndLine;
            do {
                if (!ttStartLine)
                    throw new Error("Dit not found endLine. Panic!");
                let ttLineToMove = ttStartLine!;
                isEndLine = ttStartLine == ttEndLine;
                if (!isEndLine)
                    ttStartLine = ttStartLine!.nextSibling;
                this.lines.insertBefore(ttLineToMove, insertBeforeLine)!;
            } while (!isEndLine);
        }

        //move the current head after tt end span
        let spanBefore = ttEndSpan.nextSibling;
        for (let span = nextSpanOnStartLine; span;) {
            const spanToMove = span;
            span = span.nextSibling;
            ttEndLine!.insertBefore(spanToMove, spanBefore);
        }
    }

    adjustIndent(firstSpan: ChildNode, indent: number) {
        //INVARIANT: firstSpan is the span of a first token on the line
        let indDom = firstSpan.previousSibling as HTMLSpanElement | null;
        if (indent) {
            if (!indDom) {
                indDom = document.createElement("span");
                indDom.className = indentClassName;
                firstSpan.before(indDom);
            }
            indDom.textContent = this.getSpanText(indent);
        } else
            if (indDom) indDom.remove();
    }

    renderHeap(heap: Heap) {
        if (this.rootTT)
            throw "Already projected Projection";

        const ctx = new DomRenderContext(this, undefined);
        ctx.renderNode(heap.root, undefined);

        this.rootTT = ctx.children[0];

        return this.dom;
    }

}

// export function compareTrees(a: TokenTree, b: TokenTree) {
//     const pathA = a.computeOffsetPath([]);
//     const pathB = b.computeOffsetPath([]);
//     for (let i = 0; i < pathA.length && i < pathB.length; i++) {
//         const d = pathA[i] - pathB[i];
//         if(d) return d;
//     }
//     return pathA.length - pathB.length;
// }
export function compareTrees(a: TokenTree, b: TokenTree) {
    return a.depth() - b.depth();
}

export const indentClassName = "ind";

// export function isFirstToken(span: ChildNode) {
//     span = span.previousSibling!;
//     return (
//         !span 
//         || !span.previousSibling && (span as HTMLSpanElement).classList.contains(indentClassName)
//     );       
// }

export function nextSpan(span: ChildNode) {
    const next = span.nextSibling;
    if (next) return next;
    return span.parentElement?.nextSibling?.firstChild;
}

export function removeRange(beforeSpan: ChildNode, endSpan: ChildNode) {
    //TODO: consider Range.deleteContents() API
    if (beforeSpan === endSpan) return;
    let span = nextSpan(beforeSpan);
    let line: ChildNode | null = span!.parentElement!;

    //checking of previousSibling should be enough, because if it is get by nextSpan()
    //it is the same as !isFirstToken(ttSpan) here        
    if (span!.previousSibling) {
        //span does not owns line
        //line can be the 1st line
        //remove head from the start line
        do {
            const toDelSpan = span!;
            const isLast = span === endSpan;
            if (!isLast) span = span!.nextSibling;
            line.removeChild(toDelSpan);
            if (isLast) return; //all spans where on the same line (and they did not own the line)
        } while (span);
    } else {
        //span owns the line, it cannot be the 1st line
        line = line.previousSibling!
    }

    removeLines(line, endSpan);
}

export function removeLines(beforeLine: ChildNode, endSpan: ChildNode) {
    //beforeLine must be a line before all lines to be removed
    //move tail of endLine to (start) line
    for (let span = endSpan.nextSibling; span;) {
        const spanToMove = span;
        span = span.nextSibling;
        beforeLine.appendChild(spanToMove);
    }

    //remove all lines after line till endLine (included)
    let endLine = endSpan.parentElement!;
    let line = beforeLine.nextSibling; //beforeLine does not belong to lines to be removed
    for (; ;) {
        if (!line) throw new Error("Did not find endLine");
        const lineToRemove = line;
        const isLast = line === endLine;
        if (!isLast) line = line.nextSibling;
        lineToRemove.remove();
        if (isLast) return;
    }
}

export function removeLine(firstTokenSpan: ChildNode) {
    //INVARIANT: firstTokenSpan is not on the first line (which cannot be removed)
    const line = firstTokenSpan.parentElement!;
    const beforeLine = line.previousSibling!;
    //move all spans of the line
    for (let span: ChildNode | null = firstTokenSpan; span;) {
        const spanToMove = span;
        span = span.nextSibling;
        beforeLine.appendChild(spanToMove);
    }
    line.remove();
}