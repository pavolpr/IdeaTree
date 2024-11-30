// - dom
// - cursor functions
//   - find position on click
//   - move to position
//   - typing

import { TokenConst } from "./tokenElement";

const cursorWidth = 2;
const cursorRightWidth = 3;

export class DomCursor {
    dom: HTMLTextAreaElement;

    constructor() {
        this.dom = document.createElement('textarea');
        //set attributes to:
        // <textarea   wrap="off" 
        //             autocomplete="off"
        //             //spellCheck={false}
        //             className="cursor"
        //             onKeyDown={this.onKeyDown}
        //             onInput={this.onInput}
        //             onFocus={this.onFocus}
        //             onBlur={this.onBlur}
        //             onMouseDown={this.onMouseDown}
        //         />
        this.dom.setAttribute('wrap', 'off');
        this.dom.setAttribute('autocomplete', 'off');
        
        this.dom.addEventListener('keydown', this.onKeyDown);
        this.dom.addEventListener('input', this.onInput);
        this.dom.addEventListener('focus', this.onFocus);
        this.dom.addEventListener('blur', this.onBlur);
        
        this.dom.style.pointerEvents = 'none';
        this.dom.style.width = '0';
        this.dom.style.height = '0';
        this.dom.classList.add('cursor');
    }

    click(e: MouseEvent, tt: TokenConst, viewRect: DOMRect) {
        try {
            const { offset, charRect, isAtEnd } = findPosition(e.clientX, e.clientY, tt.endSpan.firstChild as Text, tt.text);
            this.clicked(tt, offset, isAtEnd, charRect, viewRect);
            //this.moveToPoint(e.clientX - viewRect.left, e.clientY - viewRect.top);
            const path = tt.parent?.computeOffsetPath([]) ?? [];
            path.push(tt.index);
            console.log(`${path.join(",")} tc "${tt.text}" x:${e.x}, y:${e.y}`, e);
            //tt.onMouseClick(e);
        } catch (e) {
            console.error(e);
        }
    }

    clicked(tt: TokenConst, offset: number, isAtEnd: boolean, charRect: DOMRect | undefined, viewRect: DOMRect) {
        if (charRect) {
            this.moveToCharRect(charRect, isAtEnd, viewRect);
            this.focus();
        }
    }

    focus() {
        this.dom.focus();
        //show the cursor
        this.startBlink();
    }

    blinkId?: number = undefined;
    startBlink() {
        this.dom.style.opacity = '1';
        this.dom.classList.remove('blink');        
        clearTimeout(this.blinkId);
        this.blinkId = setTimeout(this.setBlink, 500);
    }

    setBlink = () => {
        this.dom.classList.add('blink');
    }

    moveToCharRect(charRect: DOMRect, isFromRight: boolean, viewRect: DOMRect) {
        const style = this.dom.style;
        if(isFromRight) {
            style.left = charRect.width - cursorRightWidth + charRect.left - viewRect.left + 'px';
            style.top = charRect.top - viewRect.top - 1 + 'px';
            style.width = cursorRightWidth + 'px';
            style.height = charRect.height + 'px';
            style.borderWidth = `1px ${cursorWidth}px 1px 0`;
        } else {
            style.left = charRect.left - viewRect.left + 'px';
            style.top = charRect.top - viewRect.top + 'px';
            style.width = '0';
            style.height = charRect.height + 'px';
            style.borderWidth = `0 0 0 ${cursorWidth}px`;
        }
    }    

    onKeyDown = (e: KeyboardEvent) => {
        console.log('keydown', e);
    }

    onInput = (e: Event) => {
        console.log('input', e);
        this.dom.value = '';
    }

    onFocus = (e: Event) => {
        console.log('focus', e);
        this.startBlink();
    }

    onBlur = (e: Event) => {
        console.log('blur', e);
        this.dom.style.opacity = '0.001';
    }
    
}

//find position on click
//use binary search to find the clicked character
//consider the text can span multiple lines, so the tested bounding box of a character can be above or below the clicked character
//return the offset of the clicked character, and the bounding box of the character
function findPosition(curX: number, curY: number, textNode: Text, text: string) {
    const range = document.createRange();
    let left = 0;
    let right = text.length;
    let offset = 0;
    let charRect = undefined;
    while (left < right) {
        offset = (left + right) >> 1;
        range.setStart(textNode, offset);
        range.setEnd(textNode, offset + 1);
        charRect = range.getBoundingClientRect();
        if (curY < charRect.top || curX < charRect.left && curY <= charRect.bottom) {
            right = offset;
        } else if(charRect.bottom < curY || charRect.right < curX && charRect.top <= curY) {
            left = offset + 1;
        } else {
            break;
        }
    }
    
    if(charRect) {
        if (curX > charRect.left + charRect.width * 0.4) {
            offset++;
            if(offset < text.length) {
                range.setStart(textNode, offset);
                range.setEnd(textNode, offset + 1);
                charRect = range.getBoundingClientRect();
            }
        }
    }
    return { offset, charRect, isAtEnd: offset === text.length};
}