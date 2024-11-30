import { INodeRef, IReadNode } from "../node";
import { RichText, Line, InLine, Space } from "./editorLang";
import { AtomValue } from "../mx/atom";
import { ComputedValue } from "../mx/computedvalue";
import { startBatch, endBatch } from "../mx/source";
import { Editor } from "../main";

const cursorWidth = 2;
export interface ICursorResult {
    top: number;
    left: number;
    width: number;
    height: number;
    //charW: number;
    //charH: number;
    //isInsert: boolean;
    cursorWidth: number;
    isFromRight: boolean;
    isBlinking: AtomValue<boolean>;
}

export class Cursor {
    constructor(public editor: Editor, tokenRef?: INodeRef) {
        //this._computeResult = new ComputedValue(this, this.computeResult);
        if (!tokenRef) {
            tokenRef = this.findFirstToken();
        }
        this.token = new AtomValue(tokenRef);
    }
    token: AtomValue<INodeRef | undefined>;
    nodeCharOffset = new AtomValue(1);
    originalXOffset: number | undefined = undefined;
    isBlinking?: AtomValue<boolean> = undefined; //; = new AtomValue(false);
    isVisible = new AtomValue(false);
    //row: number = 0;
    //col: number = 0;
    //isVisible = new AtomValue(false);
    cursorResult = new ComputedValue(this, this.computeResult);
    private computeResult(): ICursorResult | undefined {
        console.log("výpočet start");
        const tokenRef = this.token.get();
        let tokenDom = tokenRef && this.editor.node2dom.get(tokenRef);
        let text = tokenDom?.firstChild as globalThis.Text;
        if (!tokenDom || !text)
            return undefined;
        let len = text.length;
        let offset = this.nodeCharOffset.get();
        let isFromRight = offset >= len;
        if (isFromRight)
            offset = len - 1;

        let range = document.createRange();
        range.setStart(text, offset);
        range.setEnd(text, offset + 1);
        let rect = range.getBoundingClientRect();

        let rtDom = this.editor.node2dom.get(this.editor.richText);
        let rtRect = rtDom?.getBoundingClientRect();
        if (!rtDom || !rect || !rtRect)
            return undefined;
        console.log("-->výpočet result", rect, rtRect);
        return {
            top: rect.top - rtRect.top,
            left: rect.left - rtRect.left,
            width: rect.width,
            height: rect.height,
            cursorWidth,
            isFromRight,
            isBlinking: this.isBlinking = new AtomValue(false)
        };
    }
    private findFirstToken(): INodeRef | undefined {
        let rt = this.editor.richText.read;
        let firstLine = RichText.LinesCNA.getFirstChild(rt)?.read;
        //let inLine = undefined;
        if (firstLine) {
            return Line.InLinesCNA.getFirstChild(firstLine);
        }
    }
    private findLastToken(): INodeRef | undefined {
        let rt = this.editor.richText.read;
        let lastLine = RichText.LinesCNA.getLastChild(rt)?.read;
        //let inLine = undefined;
        if (lastLine) {
            return Line.InLinesCNA.getLastChild(lastLine);
        }
    }

    dom?: HTMLElement | null = undefined;
    setDomRef = (dom: HTMLElement | null) => this.dom = dom;

    focus() {
        if (this.dom) {
            startBatch(); try {
                this.isVisible.set(true);
                this.isBlinking?.set(false); //to be planned again
            } finally { endBatch(); }
            this.dom.focus();
            // const obs = new ResizeObserver(entries => {
            //     for (const entry of entries) {
            //       console.log("resized:", entry);
            //     }
            //   });
            // let tokenDom = this.token && this.editor.node2dom.get(this.token);
            // obs.observe(tokenDom);
        }
    }
    blur() {
        if (this.dom) {
            this.dom.blur();
            this.isVisible.set(false);
        }
    }
    blinkId = 0;
    setBlink = () => { this.isBlinking?.set(true); }; // console.log("blink set"); }//this.dom?.classList.toggle("blink", on);
    planBlinkStart() {
        clearTimeout(this.blinkId);
        //this.setBlink(false); //a workaround for className not setting only to "cursor" in cursor's render, because the comparison is against the original props
        this.blinkId = setTimeout(this.setBlink, 500 /*, true*/);
    }
    onInput = (e: InputEvent) => {
        console.log("cursor", (e.target as any).value, e);
        //e.preventDefault();
        (e.target as any).value = "";
    };
    onKeyDown = (e: KeyboardEvent) => {
        //e.preventDefault();
        if (!e.repeat)
            console.log("cursor key", e.key, e);
        if (!e.shiftKey && !e.ctrlKey) {
            switch (e.key) {
                case "ArrowRight": this.moveRight(); break;
                case "ArrowLeft": this.moveLeft(); break;
                case "ArrowDown": this.moveDown(); break;
                case "ArrowUp": this.moveUp(); break;
                case "Home": this.moveHome(); break;
                case "End": this.moveEnd(); break;
            }
        }

        if(e.ctrlKey && !e.shiftKey) {
            switch (e.key) {
                case "ArrowRight": this.moveWordRight(); break;
                case "ArrowLeft": this.moveWordLeft(); break;
                case "Home": this.moveDocumentHome(); break;
                case "End": this.moveDocumentEnd(); break;
            }
        }
    };
    onMouseDownOnLine = (e: MouseEvent, lineRef: INodeRef) => {
        console.log("onMouseDown on line", e);
        let line = lineRef.read;
        let token = Line.InLinesCNA.getFirstChild(line)?.read;
        if(!token) return;
        //let rtDom = this.editor.node2dom.get(this.editor.richText);
        //let rtRect = rtDom?.getBoundingClientRect(); //maybe offsetTop ?
        //if(!rtRect) return;

        let curLeft = e.x;// - rtRect.left;
        let curTop = e.y;// - rtRect.top;
        console.log(" x, y:", curLeft, curTop);

        //find the box with x, y inside
        let range = document.createRange();
        let boxes, i, textDom;
        let foundBox: DOMRect;
        let foundToken;
        let foundTextDom: globalThis.Text;
        
        findBox: for (; ;) {
            textDom = this.getTextDom(token);
            if (!textDom)
                return;

            range.setStart(textDom, 0);
            range.setEnd(textDom, textDom.length);

            boxes = range.getClientRects();
            for (i = 0; i < boxes.length; i++) {
                let b = boxes[i];
                if (b.left <= curLeft && curLeft <= b.right 
                    && b.top <= curTop && curTop <= b.bottom) {
                    foundBox = b;
                    foundToken = token;
                    foundTextDom = textDom;
                    break findBox;
                }
            }

            token = findNextToken(token, true);
            if (!token) 
                return; //we are at the end
        }

        if (!foundToken)  return;
        
        e.preventDefault();
        this.originalXOffset = undefined;
        startBatch(); try {
            this.selectOffset(foundToken?.me, foundBox!, foundTextDom!, range, curLeft, 0, foundTextDom!.length);
            this.focus();
        } finally { endBatch(); }
    }
    moveLeft() {
        let token = this.token.get()?.read;
        if (!token) return;
        let offset = this.nodeCharOffset.get();
        if (offset > 0) {
            this.moveTo(token.me, offset - 1);
            return;
        }
        
        let prev = findPrevToken(token, false);
        if (prev) {
            let textLen = (InLine.text(prev) || "").length;
            this.moveTo(prev.me, textLen);
        }
    }
    moveRight() {
        let token = this.token.get()?.read;
        if (!token) return;
        
        let textLen = (InLine.text(token) || "").length;
        let offset = this.nodeCharOffset.get();
        if (offset < textLen) {
            this.moveTo(token.me, offset + 1);
            return;
        }
        let next = findNextToken(token, false)?.me;
        if (next) {
            this.moveTo(next, 0);
        }
    }
    moveDown() {
        let token = this.token.get()?.read;
        if (!token)
            return;

        let curRes = this.cursorResult.get();
        let rtDom = this.editor.node2dom.get(this.editor.richText);
        let rtRect = rtDom?.getBoundingClientRect(); //maybe offsetTop ?
        if (!curRes || !rtRect)
            return;
        let curBottom = curRes.top + curRes.height + rtRect.top;
        let curLeft;
        if (this.originalXOffset !== undefined) {
            curLeft = this.originalXOffset;
        }
        else {
            curLeft = curRes.left + rtRect.left;
            if (curRes.isFromRight)
                curLeft += curRes.width > 1 ? curRes.width - 1 : curRes.width;
            this.originalXOffset = curLeft;
        }

        let offset = this.nodeCharOffset.get();

        //find the box on the next line
        let range = document.createRange();
        let boxes, i, textDom;
        let isOnNextLine = false;
        let foundBox: DOMRect;
        let foundToken;
        let foundOffset: number;
        let foundTextDom: globalThis.Text;
        let lineBottom: number;

        findBoxOnNextLine: for (; ;) {
            textDom = this.getTextDom(token);
            if (!textDom)
                return;

            range.setStart(textDom, offset);
            range.setEnd(textDom, textDom.length);

            boxes = range.getClientRects();
            for (i = 0; i < boxes.length; i++) {
                let b = boxes[i];
                if (isOnNextLine) {
                    if (lineBottom! <= b.top || curLeft < b.left)
                        break findBoxOnNextLine;
                }
                else if (curBottom <= b.top) {
                    isOnNextLine = true;
                    lineBottom = b.bottom;
                    //break findBoxOnNextLine;
                }
                else
                    continue;

                foundBox = b;
                foundToken = token;
                foundOffset = offset;
                foundTextDom = textDom;
                if (isOnNextLine && curLeft < foundBox.right) // || curRes.isFromRight && curLeft === foundBox.right))
                    break findBoxOnNextLine;
            }

            token = findNextToken(token, isOnNextLine);
            if (!token) {
                if (isOnNextLine)
                    break; //we are at the end, we have the best box from this line
                return; //we are at the end
            }
            offset = 0;


            // let next: INodeRef | undefined = token.next;
            // if(!next) {
            //     if(isOnNextLine) break; //we are at the end, we have the best box from this line
            //     //isOnNextLine = true; //TODO: this would be an error when a box was not seen yet
            //     let nextLine = token.parent?.read?.next?.read;
            //     if(nextLine) next = Line.InLinesCNA.getFirstChild(nextLine);
            // }
            // token = next?.read;
            // //token = findNextToken(token);
            // if(!token) 
            //      return; //we are at the end
            // offset = 0;
        }

        //i++;
        // findBestBox: while(foundBox.right < curLeft || !curRes.isFromRight && foundBox.right === curLeft) {
        //     for (; i < boxes.length; i++) {
        //         let b = boxes[i];
        //         if(lineBottom <= b.top || curLeft < b.left) break findBestBox;
        //         foundBox = b;
        //         foundToken = token;
        //         foundOffset = offset;
        //         foundTextDom = textDom;
        //     }
        //     token = token.next?.read; //no findNextToken(token);
        //     if(!token) break; //we are at the end, we have the best box from this line
        //     offset = 0;
        //     textDom = this.getTextDom(token); 
        //     if(!textDom) return;
        //     let textLen = textDom.length;
        //     range.setStart(textDom, offset);
        //     range.setEnd(textDom, textLen);
        //     boxes = range.getClientRects();
        //     i = 0;
        // }
        if (!foundToken)
            return;
        //let offsetL = foundOffset!;
        //let offsetR = foundTextDom!.length;
        this.selectOffset(foundToken?.me, foundBox!, foundTextDom!, range, curLeft, foundOffset!, foundTextDom!.length);
    }

    moveUp() {
        let token = this.token.get()?.read;
        if (!token)
            return;

        let curRes = this.cursorResult.get();
        let rtDom = this.editor.node2dom.get(this.editor.richText);
        let rtRect = rtDom?.getBoundingClientRect(); //maybe offsetTop ?
        if (!curRes || !rtRect)
            return;
        let curTop = curRes.top + /*curRes.height +*/ rtRect.top;
        let curLeft;
        if (this.originalXOffset !== undefined) {
            curLeft = this.originalXOffset;
        }
        else {
            curLeft = curRes.left + rtRect.left;
            if (curRes.isFromRight)
                curLeft += curRes.width > 1 ? curRes.width - 1 : curRes.width;
            this.originalXOffset = curLeft;
        }

        let offset = this.nodeCharOffset.get();

        //find the box on the next line
        let range = document.createRange();
        let boxes, i, textDom;
        let isOnPrevLine = false;
        let foundBox: DOMRect;
        let foundToken;
        let foundEndOffset: number;
        let foundTextDom: globalThis.Text;
        let lineTop: number;

        findBoxOnPrevLine: for (; ;) {
            textDom = this.getTextDom(token);
            if (!textDom)
                return;
            let endOffset = offset >= 0 ? offset : textDom.length;
            offset = -1;

            range.setStart(textDom, 0);
            range.setEnd(textDom, endOffset);

            boxes = range.getClientRects();
            for (i = boxes.length - 1; i >= 0; i--) {
                let b = boxes[i];
                if (isOnPrevLine) {
                    if (b.bottom <= lineTop! || b.right < curLeft)
                        break findBoxOnPrevLine;
                }
                else if (b.bottom < curTop) {
                    isOnPrevLine = true;
                    lineTop = b.top;
                    //break findBoxOnNextLine;
                }
                else
                    continue;

                foundBox = b;
                foundToken = token;
                foundEndOffset = endOffset;
                foundTextDom = textDom;
                if (isOnPrevLine && foundBox.left <= curLeft) // || curRes.isFromRight && curLeft === foundBox.right))
                    break findBoxOnPrevLine;
            }

            token = findPrevToken(token, isOnPrevLine);
            if (!token) {
                if (isOnPrevLine)
                    break; //we are at the start, we have the best box from this line
                return; //we are at the end
            }

            // let prev: IReadNode | undefined = token.prev?.read;
            // if(!prev?.next) { //test if the prev is the last ... token was first
            //     if(isOnPrevLine) break; //we are at the start, we have the best box from this line
            //     //isOnPrevLine = true; //TODO: this would be an error when a box was not seen yet
            //     let prevLine: IReadNode | undefined = token.parent?.read?.prev?.read;
            //     if(!prevLine?.next) return; //at the start line
            //     prev = Line.InLinesCNA.getLastChild(prevLine)?.read;
            // }
            // if(!prev) 
            //     return; //we are at the end
            // token = prev;
            // offset = -1;
        }

        if (!foundToken)
            return;

        this.selectOffset(foundToken.me, foundBox!, foundTextDom!, range, curLeft, 0, foundEndOffset!);
    }

    selectOffset(foundToken: INodeRef, foundBox: DOMRect, foundTextDom: globalThis.Text,
        range: Range, curLeft: number, offsetL: number, offsetR: number) {
        let foundOffset = offsetL;
        while (offsetL < offsetR) {
            let m = (offsetL + offsetR) >> 1;
            range.setStart(foundTextDom!, m);
            range.setEnd(foundTextDom!, m + 1);
            let rect = range.getClientRects()[0];
            if (rect.bottom <= foundBox!.top) {
                foundOffset = offsetL = m + 1;
            }
            else if (rect.top < foundBox!.bottom && rect.left <= curLeft) {
                foundOffset = m;
                if (rect.left === curLeft)
                    break;
                offsetL = m + 1;
                if (rect.left + rect.width * 0.4 <= curLeft
                    && (rect.right < foundBox!.right /*if there is a character inside of the found box */
                        || offsetL === foundTextDom!.length /*we are at the end of token*/
                        || foundTextDom!.nodeValue?.[offsetL] === " " /*when " " has 0 width on its wrapping*/)) {
                    foundOffset = offsetL; //assuming we can go right at max length
                }
            }
            else {
                offsetR = m;
            }
        }

        startBatch(); try {
            this.token.set(foundToken);
            this.nodeCharOffset.set(foundOffset!);
        }
        finally { endBatch(); }
    }
    getTextDom(token: IReadNode) {
        let tokenDom = this.editor.node2dom.get(token.me);
        return tokenDom?.firstChild as globalThis.Text;
    }
// dgdf  dgf d sdgdsgdsf    
    /// sdg sdgs  sdsd sdgsdg   sdgsdg   
    moveWordRight() {
        let token = this.token.get()?.read;
        if (!token) return;
        
        let textLen = (InLine.text(token) || "").length;
        let offset = this.nodeCharOffset.get();
        if(offset < textLen) {
            offset = textLen
        } else {
            token = findNextToken(token, false);
            if (!token) return;
            offset = (InLine.text(token) || "").length;
        }
        
        //while space on the same line, take next, if it is on the same line
        while(token.type.concept instanceof Space) {
            let next = findNextToken(token, true);
            if(!next) break;
            token = next;
            offset = (InLine.text(token) || "").length;
        }
        this.moveTo(token.me, offset);
    }

    moveWordLeft() {
        let token = this.token.get()?.read;
        if (!token) return;
        
        let offset = this.nodeCharOffset.get();
        if(offset === 0) {
            token = findPrevToken(token, false);
            if (!token) return;
        }

        //while space on the same line, take prev, if it is on the same line
        while(token.type.concept instanceof Space) {
            let prev = findPrevToken(token, true);
            if(!prev) break;
            token = prev;
        }
        this.moveTo(token.me, 0);
    }

    moveHome() {
        let token = this.token.get()?.read;
        if (!token) return;
        let firstToken = findFirstToken(token);
        if(!firstToken) return;
        this.moveTo(firstToken.me, 0);
    }
    moveEnd() {
        let token = this.token.get()?.read;
        if (!token) return;
        let lastToken = findLastToken(token);
        if(!lastToken) return;
        let textLen = (InLine.text(lastToken) || "").length;
        this.moveTo(lastToken.me, textLen);
    }
    moveDocumentHome() {
        let firstToken = this.findFirstToken()?.read;
        if (!firstToken) return;
        this.moveTo(firstToken.me, 0);
    }
    moveDocumentEnd() {
        let lastToken = this.findLastToken()?.read;
        if (!lastToken) return;
        let offset = (InLine.text(lastToken) || "").length;
        this.moveTo(lastToken.me, offset);
    }
    moveTo(tokenRef: INodeRef, offset: number) {
        this.originalXOffset = undefined;
        startBatch();
        try {
            this.token.set(tokenRef);
            this.nodeCharOffset.set(offset);
        }
        finally { endBatch(); }
    }
}

export function findNextToken(token: IReadNode, mustBeOnSameLine: boolean): IReadNode | undefined {
    let next = token.next;
    if(!next) {
        if(mustBeOnSameLine) return undefined;
        let nextLine = token.parent?.read?.next?.read;
        if(nextLine) next = Line.InLinesCNA.getFirstChild(nextLine);
    }
    return next?.read;
}
export function findPrevToken(token: IReadNode, mustBeOnSameLine: boolean): IReadNode | undefined {
    let prev = token.prev?.read;
    if(!prev?.next) { //test if the prev is the last ... token was first
        if(mustBeOnSameLine) return undefined;
        let prevLine = token.parent?.read?.prev?.read;
        if(!prevLine?.next) return undefined;
        prev = Line.InLinesCNA.getLastChild(prevLine)?.read;
    }
    return prev;
}
export function findLastToken(token: IReadNode): IReadNode | undefined {
    let parent = token.parent?.read;
    if(parent) 
        return Line.InLinesCNA.getLastChild(parent)?.read;
    return undefined;
}
export function findFirstToken(token: IReadNode): IReadNode | undefined {
    let parent = token.parent?.read;
    if(parent) 
        return Line.InLinesCNA.getFirstChild(parent)?.read;
    return undefined;
}