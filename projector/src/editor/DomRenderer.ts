import { INodeRef, IReadNode } from "../node";
import { StyleDef, StyleTermArg } from "../core/grammarLang";
import { TokenAddIndentDef, TokenConst, TokenConstDef, TokenDropSpaceDef, TokenProperty, TokenPropertyDef, TokenStartNewLineDef, TokenStructured, TokenStructuredDef, TokenSubIndentDef, TokenTree, TokenTreeDef } from "./tokenTreeLang";


export class DomRenderer {
    constructor(readonly rootTT: INodeRef) {
    }
    lines: HTMLDivElement = null!;
    currentLine: HTMLDivElement = null!;
    isDropSpace = true;
    isNewLine = true;
    indent = 0;
    tokenMode: "start" | "inside" | undefined = undefined;

    render(lines: HTMLDivElement) {
        lines.replaceChildren();

        this.lines = lines; //document.createElement("div");
        this.renderTokenElement(this.rootTT.read);
        //return this.lines;
    }

    newLine() {
        this.currentLine = this.lines.appendChild(document.createElement("div"));
    }

    renderTokenElement(t: IReadNode) {
        if (t.def === TokenConstDef) {
            let text = TokenConst.TextFA.get(t) ?? "";
            this.addToken(text, t);
        } else if (t.def === TokenPropertyDef) {
            let node = TokenProperty.ProjectedNodeFA.get(t)?.read!;
            let member = TokenProperty.PropertyFA.get(t)!;
            let text = node.getField(member!)!.toString();
            this.addToken(text, t);
        } else if (t.def === TokenTreeDef) {
            const wasTokenMode = this.tokenMode;
            this.tokenMode = undefined;
            //NO: NOTE: this should work just because wasTokenMode === "inside" ?
            if (!this.isDropSpace && wasTokenMode === "inside")
                this.isDropSpace = true; //assuming some token will be produced (or the structured will set it to false later)
            TokenTree.ElementsCNA.getFirstChild(t);
            let e = TokenTree.ElementsCNA.getFirstChild(t)?.read;
            for (; e != undefined; e = e.next?.read) {
                this.renderTokenElement(e);
            }
            this.tokenMode = wasTokenMode ? "inside" : undefined;
        } else if (t.def === TokenStructuredDef) {
            const wasTokenMode = this.tokenMode;
            if (!wasTokenMode)
                this.tokenMode = "start";
            TokenStructured.ElementsCNA.getFirstChild(t);
            let e = TokenStructured.ElementsCNA.getFirstChild(t)?.read;
            for (; e != undefined; e = e.next?.read) {
                this.renderTokenElement(e);
            }
            if (!wasTokenMode)
                this.tokenMode = undefined;

        } else if (t.def === TokenDropSpaceDef) {
            this.isDropSpace = true;
        } else if (t.def === TokenStartNewLineDef) {
            this.isNewLine = true;
        } else if (t.def === TokenAddIndentDef) {
            this.indent++;
        } else if (t.def === TokenSubIndentDef) {
            this.indent--;
        }
    }

    addToken(text: string, tte: IReadNode) {
        if (this.isNewLine) {
            this.newLine();
            this.isNewLine = false;
            this.isDropSpace = false;

            let indentText = "";
            for (let i = 0; i < this.indent; i++)
                indentText += "\u00A0\u00A0\u00A0\u00A0"; //&nbsp
            if (indentText)
                this.addSpan(indentText);
        }
        else if (this.isDropSpace) {
            this.isDropSpace = false;
        }
        else if (this.tokenMode !== "inside") {
            this.addSpan("\u00A0"); //&nbsp
        }

        this.addSpan(text, this.getClassName(tte));
        if (this.tokenMode === "start")
            this.tokenMode = "inside";
    }

    addSpan(text: string, className?: string) {
        let spanDom = document.createElement("span");
        if (className)
            spanDom.className = className;
        //TODO: style
        spanDom.appendChild(document.createTextNode(text));
        this.currentLine.appendChild(spanDom);
    }

    getClassName(tte: IReadNode) {
        let className = "";
        let sta = TokenTree.StylesCNA.getFirstChild(tte)?.read;
        for (; sta != undefined; sta = sta.next?.read) {
            let style = StyleTermArg.StyleFA.get(sta)?.read;
            let cn = StyleDef.getClassName(style!);
            if (className)
                className += " ";
            className += cn;
        }
        return className;
    }
}
