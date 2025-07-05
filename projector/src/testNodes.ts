import { globalState } from "./mx/globalstate";
import { FieldDef, type IType, getNodeType } from "./type";
import { type INodeRef, getGlobalNode, ensureGlobalNode, createNode, type IWriteNode } from "./node";
import * as utils from "./utils";
import { Heap } from "./heap";
import { t0stringType, t0boolType, t0doubleType, t0uaNodeRefType, t0childNodeType, conceptStructureMemberDefDef, nameFieldDef, conceptDefDef, t0int32Type } from "./concept";
import { RichText, Line, Text, Space, InLine, TextStyle } from "./editor/editorLang";
import { tINamed } from "./core/structureLang";




function field(def: INodeRef, fieldType: IType) {
    return new FieldDef(def.uid, fieldType);
}
function defNode(gidx: number, idx: number) {
    const uid = utils.makeUid(gidx, idx);
    if (getGlobalNode(uid) !== undefined) throw new Error("node exists");
    return ensureGlobalNode(uid);
}
function defNamedNode(gidx: number, idx: number, name: string, heap: Heap, defDef: INodeRef) {
    const nodeDef = defNode(gidx, idx);
    heap.createNode(getNodeType(defDef, [field(nameFieldDef, t0stringType)]), [name], nodeDef.uid);
    return nodeDef;
}
function defField(gidx: number, idx: number, name: string, heap: Heap) {
    return defNamedNode(gidx, idx, name, heap, conceptStructureMemberDefDef);
}
export function createHeap1(): Heap {
    globalState.setupReadMode();

    const guidMap = globalState.guidMap;
    const heapGidx = guidMap.gidxFromString("dada1000-dfdd-47fb-bd68-579d61cb50d7");
    const myHeap = new Heap(heapGidx);
    const nodeDefGidx = guidMap.gidxFromString("dada1000-94c1-42d7-b609-f2f5da36666b");
    const nodeDef = defNamedNode(nodeDefGidx, 1, "testNodeType", myHeap, conceptDefDef);
    const fld32Def = defField(nodeDefGidx, 2, "fldI32", myHeap);
    const fldBoolDef = defField(nodeDefGidx, 3, "fldBool", myHeap);
    const fldDoubleDef = defField(nodeDefGidx, 4, "fldDouble", myHeap);
    const fldStringDef = defField(nodeDefGidx, 5, "fldString", myHeap);
    const fldUANodeRefDef = defField(nodeDefGidx, 6, "fldUaNodeRef", myHeap);
    const fldSingleChildDef = defField(nodeDefGidx, 7, "fldSingleChild", myHeap);
    const fldMultiChildDef = defField(nodeDefGidx, 8, "fldMultiChild", myHeap);
    const nTypeEmpty = getNodeType(nodeDef);
    const fields = [
        field(nameFieldDef, t0stringType),
        field(fld32Def, t0int32Type),
        field(fldBoolDef, t0boolType),
        field(fldDoubleDef, t0doubleType),
        field(fldStringDef, t0stringType),
        field(fldUANodeRefDef, t0uaNodeRefType),
        //children
        //field(fldSingleChildDef, t0chilNodeType),
        //field(fldMultiChildDef, t0chilNodeType),
    ];
    const nTypeWithFields = getNodeType(nodeDef, fields);

    const node = myHeap.root; ///defNode(nodeDefGidx, 99);
    //const record = 
    myHeap.createNode(nTypeWithFields, ["example-node", 1, true, 2, "ha", node], node.uid);

    globalState.setupEditMode();

    const eHeapContext = myHeap.getHeapContext(globalState.changeMap);
    const editableRecord = node.write;

    //create the single child
    const childNode1 = defNode(nodeDefGidx, 101);
    //const childRecord1 = 
    createNode(childNode1.uid, nTypeEmpty, eHeapContext);
    //checkChildren([], [], [childRecord1], node, editableRecord, record, fldSingleChildDef);
    node.write.setChild(fldSingleChildDef, childNode1, t0childNodeType);
    //checkChildren([childRecord1], [childNode1], [], node, editableRecord, record, fldSingleChildDef);

    //create the multiple children + insert last
    const childNode2 = defNode(nodeDefGidx, 102);
    const childNode3 = defNode(nodeDefGidx, 103);
    const childNode4 = defNode(nodeDefGidx, 104);

    //const childRecord2 = 
    createNode(childNode2.uid, nTypeEmpty, eHeapContext);
    //const childRecord3 = 
    createNode(childNode3.uid, nTypeEmpty, eHeapContext);
    //const childRecord4 = 
    createNode(childNode4.uid, nTypeEmpty, eHeapContext);

    //  child2 - insert last
    editableRecord.insertLast(fldMultiChildDef, childNode2, t0childNodeType);
    //checkChildren([childRecord2], [childNode2], [childRecord3, childRecord4], node, editableRecord, record, fldMultiChildDef);
    //  child3 - insert last
    editableRecord.insertLast(fldMultiChildDef, childNode3, t0childNodeType);
    //checkChildren([childRecord2, childRecord3],  [childNode2, childNode3], [childRecord4], node, editableRecord, record, fldMultiChildDef);
    //  child4 - insert last
    editableRecord.insertLast(fldMultiChildDef, childNode4, t0childNodeType);
    //checkChildren([childRecord2, childRecord3, childRecord4],  [childNode2, childNode3, childNode4], [], node, editableRecord, record, fldMultiChildDef);
    return myHeap;
}

export function createHeap2() {
    const guidMap = globalState.guidMap;
    const heapGidx = guidMap.gidxFromString("dada1001-dfdd-47fb-bd68-579d61cb50d7");
    const heap = new Heap(heapGidx);
    //const nodeDefGidx = guidMap.gidxFromString("dada1000-94c1-42d7-b609-f2f5da36666b");

    globalState.setupEditMode();

    //const eHeapContext = heap.getHeapContext(eChangeMap);

    let root = heap.createNode(RichText.Def.nodeType, undefined, heap.root.uid);
    ///root.setDef(RichText.Def.def);

    let style1 = heap.createNode(TextStyle.Def.nodeType);
    TextStyle.FontFamilyFA.set(style1, "Verdana");
    tINamed.NameFA.set(style1, "style1");

    let style2 = heap.createNode(TextStyle.Def.nodeType);
    TextStyle.FontFamilyFA.set(style2, "Consolas");
    TextStyle.FontWeightFA.set(style2, "bold");
    tINamed.NameFA.set(style2, "style2");

    RichText.DefaultStyleFA.set(root, style1.me);

    ahojLine();
    ahojLine(1, 1);
    ahojLine(2, 2, 1);
    ahojLine(3, 3, 3);
    ahojLine(3);
    ahojLine();
    ahojLine(4);
    ahojLine();

    return { heap, style1, style2 };


    function ahojLine(indent = 0, endSpaces = 0, startSpaces = 0) {
        let line = heap.createNode(Line.Def.nodeType);
        RichText.LinesCNA.insertLast(root, line.me);
        Line.IndentFA.set(line, indent);

        for (; startSpaces > 0; startSpaces--) sp();
        text("ahojÔ", style1); sp(); text("hej", style2); sp(); text("hoj", style2); sp(); text("heja hoja mojo koj", style1);
        for (; endSpaces > 0; endSpaces--) sp();

        function text(str: string, style: IWriteNode) {
            const text = heap.createNode(Text.Def.nodeType);
            Line.InLinesCNA.insertLast(line, text.me);
            Text.TextFA.set(text, str);
            InLine.StyleFA.set(text, style.me);
        }
        function sp() {
            const space = heap.createNode(Space.Def.nodeType);
            Line.InLinesCNA.insertLast(line, space.me);
        }
    }
} 