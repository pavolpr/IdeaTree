import { BaseConcept, LangBuilder, nodeComputedValue } from "../concept";
import { mix } from "../mixins";
import { INodeRef, IReadNode } from "../node";
import { setStyle } from "../mx/styles";
import { tINamed } from "../core/structureLang";


/* rich text lang

concept Line
    Indent: int
    InLines: children InLine*

abstract concept InLine
    Style: TextStyle?

    concept Text
        Text: string //no new lines

    concept Space

    concept Indent
        Indent: int

concept RichText
    Lines: children Line*
    DefaultStyle: TextStyle

concept TextStyle with INamed
    fontFamily: string
    fontStyle: normal | italic | oblique
    fontWeight: normal | bold
    fontSize: double [px] //| string
    color: string
    decoration: none | overline | line-through | underline

 */

 //


export const langGuid = "5cbade80-d456-4096-8bf0-e517326ddf2d"; 
//export function defineLang() {
const lb = new LangBuilder(langGuid, "RichText", 30);

const lineDef = lb.newConceptDefNode(1, "Line");
const inLineDef = lb.newConceptDefNode(4, "InLine");
const textDef = lb.newConceptDefNode(6, "Text");
const richTextDef = lb.newConceptDefNode(10, "RichText");
const textStyleDef = lb.newConceptDefNode(13, "TextStyle");

export class Line extends BaseConcept {
    static Def = new Line(lineDef);
    static IndentFA = lb.intFieldAccessor(lineDef, 2, "Indent");
    static InLinesCNA = lb.childrenAccessor(lineDef, inLineDef, 3, "InLines");

    //constructor(readonly heap: Heap) { }
    
    // newLine(inLines?: INodeRef[]): IWriteNode {
    //     let line = this.heap.createNode(LineNT);
    //     if(inLines && inLines.length > 0) {
    //         for(let inLine of inLines) {
    //             InLinesCNA.insertLast(line, inLine);s
    //         }
    //     }
    //     return line;
    // }
    // addInLine(line: IWriteNode, inLine: INodeRef) {
    //     InLinesCNA.insertLast(line, inLine);
    // }

    // static ha = 10;
    // static TextStyleDef = nodeTypeDef(13, "TextStyle");
}
export /*abstract*/ class InLine extends BaseConcept {
    static Def = new InLine(inLineDef);
    static StyleFA = lb.refFieldAccessor(inLineDef, textStyleDef, 5, "Style", true);
    
    static text(node: IReadNode) { return (node.type.concept as InLine).textVirt(node); }
    textVirt(_node: IReadNode): string | undefined { throw "abstract"; }
}
export class Text extends InLine {
    static Def = new Text(textDef);
    static TextFA = lb.stringFieldAccessor(textDef, 7,"Text");
    
    textVirt(node: IReadNode) { return Text.TextFA.get(node); }
    // newText(text: string): IWriteNode {
    //     return this.heap.createNode(TextNT, [text]);
    // }

    // getText(textNode: IReadNode): string | undefined {
    //     return TextFA.get(textNode);
    // }
    
}
export class Space extends InLine {
    static Def = new Space(lb.newConceptDefNode(8, "Space"));
    
    textVirt(_node: IReadNode) { return " "; }
}
export class Indent extends InLine {
    static Def = new Indent(lb.newConceptDefNode(9, "Indent"));
    
    textVirt(_node: IReadNode): string { throw "not impemented"; }
}

export class RichText extends BaseConcept {
    static Def = new RichText(richTextDef);
    static LinesCNA = lb.childrenAccessor(richTextDef, lineDef, 11, "Lines");
    static DefaultStyleFA = lb.refFieldAccessor(richTextDef, textStyleDef, 12,"DefaultStyle");
}

export class TextStyle extends mix(BaseConcept, tINamed.M) {
    static Def = new TextStyle(textStyleDef);
    static FontFamilyFA = lb.stringFieldAccessor(textStyleDef, 14,"FontFamily");
    static FontStyleFA = lb.stringFieldAccessor<"normal" | "italic" | "oblique">(textStyleDef, 15,"FontStyle");
    static FontWeightFA = lb.stringFieldAccessor<"normal" | "bold">(textStyleDef, 16,"FontWeight");
    static FontSizeFA = lb.doubleFieldAccessor(textStyleDef, 17,"FontSize");
    static ColorFA = lb.stringFieldAccessor(textStyleDef, 18,"Color");
    static DecorationFA = lb.stringFieldAccessor<"none" | "overline" | "line-through" | "underline">(textStyleDef, 19,"Decoration");

    static getClassName: (node: INodeRef) => string = nodeComputedValue(getClassName);
}

function getClassName(this: INodeRef): string {
    let node = this.read;
    let key = "_" + this.uid + "_" + tINamed.NameFA.get(node);
    let style = {
        fontFamily: TextStyle.FontFamilyFA.get(node),
        fontStyle: TextStyle.FontStyleFA.get(node),
        fontWeight: TextStyle.FontWeightFA.get(node),
        fontSize: TextStyle.FontSizeFA.get(node),
        color: TextStyle.ColorFA.get(node),
        decoration: TextStyle.DecorationFA.get(node),
    }
    setStyle(key, style);
    return key;
}

export const editorLangHeap = lb.langHeap;


    // return {
    //     language: lb,
    //     Line: new Line(lb.nodeTypeDef(1, "Line")),
    //     InLine: new InLine(lb.nodeTypeDef(4, "InLine")),
    //     Text: new Text(lb.nodeTypeDef(6, "Text")),
    //     Space: new Space(lb.nodeTypeDef(8, "Space")),
    //     Indent: new Indent(lb.nodeTypeDef(9, "Indent")),
    //     RichText: new RichText(lb.nodeTypeDef(10, "RichText")),
    //     TextStyle: new TextStyle(lb.nodeTypeDef(13, "TextStyle"))
    // }

 //}
