import type { INodeRef, IReadNode } from "../node";
import { Projection, ProjectionTerm, StyleDef } from "../core/grammarLang";
import type { IRenderContext } from "./renderUtils";
import { DeleteCharsTrivia, DeleteCharsTriviaDef, DropSpaceTriviaDef, InsertNodeTrivia, InsertNodeTriviaDef, InsertTextTrivia, InsertTextTriviaDef, SeparatorTrivia, SeparatorTriviaDef, StartNewLineTriviaDef, Trivia, tTriviaAttr } from "../core/grammarTriviaLang";
import { NewLineTE, ProjectedNodeTT, StructuredTokenTT, TokenConst, type ITokenElement, TokenTree, removeTE } from "./tokenElement";
import { DomRenderingProjection, removeLine } from "./DomRenderingProjection";


export class DomRenderContext implements IRenderContext {
    readonly projection: DomRenderingProjection;
    readonly tokenTree: TokenTree | undefined;

    constructor(
        projection: DomRenderingProjection,
        tokenTree: TokenTree | undefined //undefined for the top level context
    ) {
        this.projection = projection;
        this.tokenTree = tokenTree;
        if (tokenTree) {
            this.children = tokenTree.elements!;
            this.isDropSpace = tokenTree.isDropSpace;
            this.isNewLine = tokenTree.isNewLine;
            this.indent = tokenTree.indent;
            this.isTokenMode = tokenTree.isTokenMode;
            this.styles = tokenTree.styles;
        } else {
            this.children = [];
            this.isDropSpace = true;
            this.isNewLine = false;
            this.indent = 0;
            this.isTokenMode = false;
            this.styles = "";
        }

    }

    //state: DomRenderState = undefined!;
    children: ITokenElement[];
    //oldChildren?: (ITokenElement | undefined)[];
    childIndex = 0;
    tokenPosition = 0;
    trivia: INodeRef | undefined = undefined;
    separator: INodeRef | undefined = undefined;

    //lines: HTMLDivElement = null!;
    //currentLine: HTMLDivElement = null!;
    isDropSpace: boolean;
    isNewLine: boolean;
    indent: number;
    isTokenMode: boolean;
    styles: string;

    needsRerender(tt: TokenTree) {
        return (
            this.isDropSpace !== tt.isDropSpace
            || this.isNewLine !== tt.isNewLine
            || this.indent !== tt.indent
            || this.isTokenMode !== tt.isTokenMode
            || this.styles !== tt.styles
        );
    }

    // currentOldChild() {
    //     if(this.oldChildren) {
    //         while(this.oldIndex < this.oldChildren.length) {
    //             const child = this.oldChildren[this.oldIndex];
    //             if(child) return child;
    //             this.oldIndex++;
    //         }
    //     }
    //     return undefined;
    // }

    moveTT(tt: TokenTree) {
        //INVARIANT: tt is rendered and not moved yet        
        if (tt.endSpan) {
            //move the dom first
            this.projection.moveRange(tt.getSpanBefore(), tt.endSpan);
        }

        let lastIndex;
        if (tt.parent === this.tokenTree) {
            lastIndex = tt.index;
            if (this.childIndex >= lastIndex) throw new Error("Unexpected moveTT, panic!");
        } else {
            removeTE(tt.parent!.elements, tt.index);

            tt.parent!.correctEndSpan(); //correct the endSpan for the case tt was the last
            tt.parent = this.tokenTree;
            lastIndex = this.children.length;
        }
        this.insertTE(tt, lastIndex);

        //correct the endSpan for the case tt was the last
        //this.tokenTree!.correctEndSpan();        
    }

    insertTE(te: ITokenElement, lastIndex: number) {
        //make room for tt: move this.childIndex .. lastIndex-1 -> +1
        for (let i = lastIndex; this.childIndex < i; i--) {
            const te = this.children[i - 1]!;
            this.children[i] = te;
            if (te.isTokenTree())
                te.index = i;
        }
        this.children[this.childIndex] = te;
        te.index = this.childIndex;
        if (te.endSpan) this.tokenTree!.correctEndSpan(); //correct the endSpan for the case te was the last
        this.childIndex++;
    }

    renderNode(nodeRef: INodeRef, sepTerm?: INodeRef) {
        let tt = this.projection.projectedNodeMap.get(nodeRef);
        if (tt) {
            //TODO: prevent more-than-once rendering
            if (this.children[this.childIndex] === tt) {
                this.childIndex++;
            } else {
                //move here
                this.moveTT(tt);
            }
            if (tt._isScheduled || this.needsRerender(tt) || sepTerm !== tt.separatorTerm) {
                //re-render
                tt.separatorTerm = sepTerm;
                tt.setParentContext(this);
                tt.renderTracked();
            } else {
                //no render needed, adjust projection.span
                if (tt.endSpan) this.projection.setCurrentSpan(tt.endSpan);
            }
        } else {
            //case not yet existing TT for the node
            tt = new ProjectedNodeTT(this, nodeRef, sepTerm);
            this.insertTE(tt, this.children.length);
            this.projection.projectedNodeMap.set(nodeRef, tt);
            tt.renderTracked();
        }


        this.isDropSpace = tt.endIsDropSpace;
        this.isNewLine = tt.endIsNewLine;
    }


    renderNodeChildren(nodeRef: INodeRef, sepTerm?: IReadNode) {
        this.clearSeparator(); //just in case a separator is set, but the sub-tree is not children directly, but this node

        const node = nodeRef.read;
        //const parentState = this.pushChildren(tTriviaAttr.TriviaCNA.getFirstChild(node));

        this.trivia = tTriviaAttr.TriviaCNA.getFirstChild(node);
        //const state = this.state;

        if (sepTerm) {
            let trivia = this.trivia?.read;
            if (trivia?.def === SeparatorTriviaDef) {
                this.trivia = SeparatorTrivia.TriviaCNA.getFirstChild(trivia);
                trivia = trivia.next?.read;
            }
            else if (trivia) {
                this.trivia = undefined;
            }
            ProjectionTerm.render(sepTerm, node, this);
            this.trivia = trivia?.me;
        }

        const proj = this.projection.projectionMap.projection(node);
        if (proj == undefined) {
            this.addToken(`<<no projection, node: ${node}>>`, nodeRef);
        } else {
            let term = Projection.TermsCNA.getFirstChild(proj)?.read;
            for (; term != undefined; term = term.next?.read) {
                ProjectionTerm.render(term, node, this);
            }
        }

        const remainingTrivia = this.trivia?.read;
        if (remainingTrivia) {
            //TODO: maybe we should dropSpace ? - the remaining trivia will stand as an extra last token
            this.addTokenWithTrivia(remainingTrivia, "", Infinity, nodeRef);
        }

        this.deleteRemaining();
    }

    deleteRemaining() {
        if (this.childIndex >= this.children.length) return;
        this.projection.deletedMap.set(this.tokenTree!, this.childIndex);
    }

    renderChildren(firstChild: INodeRef | undefined) {
        //var parentChildren = this.pushChildren();
        //this.addToken("[*", undefined!);
        const sepTerm = this.clearSeparator();

        let isNext = false;
        let node = firstChild?.read;
        for (; node != undefined; node = node.next?.read) {
            this.renderNode(node.me, isNext ? sepTerm : undefined);
            isNext = true;
        }
        //this.addToken("*]", undefined!);
        //this.popChildren(parentChildren);
    }

    addToken(token: string, idRef: INodeRef) {
        //const state = this.state;
        let trivia = this.trivia?.read;
        const tokenPosition = this.tokenPosition++;

        //this is just an optimization by unrolling one while for the fast path
        //- to avoid structured token
        if (trivia && (Trivia.TokenPositionFA.get(trivia) ?? 0) <= tokenPosition) {
            this.addTokenWithTrivia(trivia, token, tokenPosition, idRef);
        } else {
            this.addTokenNoTrivia(token, idRef);
        }
    }

    addTokenWithTrivia(startingTrivia: IReadNode, token: string, tokenPosition: number, idRef: INodeRef) {
        let st: StructuredTokenTT | undefined = undefined;
        let i = this.childIndex;
        for (; i < this.children.length; i++) {
            let te = this.children[i]!;
            if (te.isStructuredToken() && te.idRef === idRef) {
                st = te;
                break;
            }
        }
        if (st) {
            if (i === this.childIndex) {
                this.childIndex++;
            } else {
                //move here
                this.moveTT(st);
            }
            if (st._isScheduled || this.needsRerender(st)
                || st.token !== token
                || st.trivia !== startingTrivia.me
                || st.tokenPosition !== tokenPosition
            ) {
                st.token = token;
                st.trivia = startingTrivia.me;
                st.tokenPosition = tokenPosition;
                st.setParentContext(this);
                st.renderTracked();
            } else {
                //no render needed, adjust projection.span
                if (st.endSpan) this.projection.setCurrentSpan(st.endSpan);
            }
        } else {
            //case not yet existing ST for the node
            st = new StructuredTokenTT(this, token, startingTrivia.me, tokenPosition, idRef);
            this.insertTE(st, this.children.length);
            st.renderTracked();
        }


        //we won't need to chek for this to be changed;
        //if there is some trivia left, the trivia.next will trigger the change for this tree as well
        this.trivia = st.endTrivia;

        this.isDropSpace = st.endIsDropSpace;
        this.isNewLine = st.endIsNewLine;
        //this.indent = ctx.indent; //maybe not needed
        //this.styles = ctx.styles; //maybe not needed

    }
    addTokenWithTriviaChildren(startingTrivia: IReadNode, token: string, tokenPosition: number, idRef: INodeRef) {
        let trivia: IReadNode | undefined = startingTrivia;
        let charPos = 0;
        do {
            const triviaCharPos = Trivia.CharPositionFA.get(trivia) ?? 0;
            if (token && charPos < triviaCharPos) {
                this.addTokenNoTrivia(token.substring(charPos, Math.min(triviaCharPos, token.length)), idRef);
                charPos = triviaCharPos;
            }

            if (trivia!.def === DeleteCharsTriviaDef) {
                charPos += DeleteCharsTrivia.DeletedLengthFA.get(trivia) ?? 0;
            } else if (trivia!.def === StartNewLineTriviaDef) {
                this.startNewLine();
            } else if (trivia!.def === DropSpaceTriviaDef) {
                this.dropSpace();
            } else if (trivia!.def === InsertNodeTriviaDef) {
                const insertedNode = InsertNodeTrivia.NodeCA.getChild(trivia);
                const prevStyles = this.styles;
                this.styles = "";
                this.renderNode(insertedNode!);
                this.styles = prevStyles;
            } else if (trivia!.def === InsertTextTriviaDef) {
                const insertedText = InsertTextTrivia.TextFA.get(trivia)!;
                this.addTokenNoTrivia(insertedText, idRef, /*setStyles:*/ false);
            }

            trivia = trivia?.next?.read;
        } while (trivia
            && (Trivia.TokenPositionFA.get(trivia) ?? 0) <= tokenPosition);

        this.trivia = trivia?.me;

        if (charPos <= token.length)
            this.addTokenNoTrivia(token.substring(charPos), idRef);

        this.deleteRemaining();
    }

    addTokenNoTrivia(token: string, idRef: INodeRef, setStyle = true) {
        const isNewLine = this.isNewLine;
        if (isNewLine) {
            this.isNewLine = false;
        } else if (!this.isDropSpace) {
            token = " " + token;
        }
        this.isDropSpace = this.isTokenMode;
        const classNames = setStyle ? this.styles : undefined;

        //try find tc if we can reuse it
        let tc: TokenConst | undefined = undefined;
        let i = this.childIndex
        for (; i < this.children.length; i++) {
            let te = this.children[i]!;
            if (te.isTokenConst() && te.idRef === idRef) {
                tc = te;
                break;
            }
        }
        if (tc) {
            //diff
            if (i === this.childIndex) {
                //is found directly at the spot
                if (isNewLine) this.addNewLine(); //new line was missing - insert
                this.childIndex++;
            } else {
                //needs to move
                const beforeTE = this.children[i - 1]!;
                if (beforeTE.isNewLineTE()) {
                    //tc owns the line
                    //const beforeSpan = tc.endSpan.parentElement!.previousSibling!.lastChild!;
                    if (isNewLine) {
                        //move nl + tc
                        if (i - 1 > this.childIndex) {
                            //not in-place, move
                            this.projection.moveLines(tc.endSpan.parentElement!, tc.endSpan, this.projection.span!.nextSibling);
                            this.insertTE(beforeTE, i - 1);
                            this.insertTE(tc, i);
                        } else {
                            //both are in place
                            this.childIndex += 2;
                        }

                        if (beforeTE.indent !== this.indent) {
                            //adjust indent, if needed
                            this.projection.adjustIndent(tc.endSpan, this.indent);
                        }
                    } else {
                        //NOTE: i > this.childIndex ... tc is not in place
                        //delete nl + move tc.endSpan
                        removeLine(tc.endSpan);
                        this.projection.addSpanDom(tc.endSpan); //move tc.endSpan
                        //remove beforeTE
                        i--;
                        removeTE(this.children, i);
                        //move tc 
                        this.insertTE(tc, i);
                    }
                } else {
                    //tc does not own the line
                    if (isNewLine) {
                        this.addNewLine();
                        i++;
                    }
                    this.projection.addSpanDom(tc.endSpan);
                    //move tc
                    this.insertTE(tc, i); //move from i to this.childIndex
                }
            }
            //diff text and classNames
            if (tc.text !== token) {
                (tc.endSpan.firstChild as Text).data = token;
                //tc.endSpan.textContent = token; //is this the same fast?
                tc.text = token;
            }
            if (tc.classNames !== classNames) {
                tc.classNames = classNames;
                tc.endSpan.className = classNames ?? "";
            }
            this.projection.setCurrentSpan(tc.endSpan);
        } else {
            //create and inserts this token anew
            if (isNewLine) this.addNewLine();
            tc = new TokenConst(this.tokenTree, token, classNames, idRef, this.projection.addSpan(token, classNames));
            this.insertTE(tc, this.children.length);
        }
    }

    addNewLine() {
        this.projection.newLine(this.indent)
        const nl = new NewLineTE(this.tokenTree, this.indent);
        this.insertTE(nl, this.children.length);
    }

    renderField(node: IReadNode, member: INodeRef, idRef: INodeRef) {
        //TODO: token lang re-parsing and rendering for token based fields

        const text = node.getField(member!)!.toString();
        this.addToken(text, idRef);
    }

    dropSpace() {
        this.isDropSpace = true;
    }

    startNewLine() {
        this.isNewLine = true;
    }

    addIndent() {
        this.indent++;
    }
    subIndent() {
        this.indent--;
    }

    pushStyle(style: INodeRef) {
        //TODO: reactive ?
        let className = StyleDef.getClassName(style.read);
        const prevStyles = this.styles;
        this.styles = prevStyles
            ? prevStyles + " " + className
            : className;
    }
    popStyle(prevStyles: string) {
        this.styles = prevStyles;
    }

    setSeparator(term: INodeRef) {
        this.separator = term;
    }
    clearSeparator() {
        const sep = this.separator;
        this.separator = undefined;
        return sep;
    }
}
