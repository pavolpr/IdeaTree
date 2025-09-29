import { expect, it, describe } from "vitest";
import * as utils from "../utils";
import type { IReadNode, IWriteNode, INodeRef, IWriteNodeInternal, INodeRefInternal } from "../node";
import { getGlobalNode, ensureGlobalNode, isHeapRoot } from "../node";
import { globalState, type IChangeMap } from "../mx/globalstate";
import { FieldDef, getNodeType, type IType, TypeKind } from "../type";
import { heapSet, ensureHeap } from "../heap";
import { t0int32Type, t0boolType, t0doubleType, t0stringType, t0uaNodeRefType, t0childNodeType, t0Heap } from "../concept";

describe("heap", () => {
    function field(def: INodeRef, fieldType: IType) {
        return new FieldDef(def.uid, fieldType);
    }
    function defNode(gidx: number, idx: number) {
        const uid = utils.makeUid(gidx, idx);
        expect(getGlobalNode(uid)).toBeUndefined();
        return ensureGlobalNode(uid);
    }
    function checkChildren(childrenRecords: IWriteNode[], childrenNodes: INodeRef[], detachedRecords: IWriteNode[], parent: INodeRef, parentRecord: IWriteNode, parentReadRecord: IReadNode, role: INodeRef) {
        expect(childrenRecords.length).toBe(childrenNodes.length);
        expect(parentRecord.getFirstChild(role)).toBe(childrenNodes[0]);
        expect(parentReadRecord.getFirstChild(role)).toBeUndefined();
        if (childrenNodes.length) {
            expect(parentRecord.type.fields[parentRecord.type.getFieldIndex(role.uid)]?.uid).toBe(role.uid);
        }
        if (childrenRecords.length === 1) {
            expect(childrenRecords[0]?.parent).toBe(parent);
            expect(childrenRecords[0]?.prev).toBeUndefined();
            expect(childrenRecords[0]?.next).toBeUndefined();
            expect(childrenRecords[0]?.role).toBe(role);
        } else {
            for (let i = 0; i < childrenRecords.length; i++) {
                const childRecord = childrenRecords[i]!;
                const isFirst = i === 0;
                const isLast = (i + 1) === childrenRecords.length;
                expect(childRecord.parent).toBe(parent);
                expect(childRecord.prev).toBe(childrenNodes[isFirst ? childrenRecords.length - 1 : i - 1]);
                expect(childRecord.next).toBe(isLast ? undefined : childrenNodes[i + 1]);
                expect(childRecord.role).toBe(role);
            }
        }
        checkChildrenToBeDetached(detachedRecords, parentRecord, role, childrenNodes[0]);
    }
    function checkChildrenToBeDetached(childrenRecords: IWriteNode[], parentRecord: IWriteNode, role: INodeRef, firstChild?: INodeRef) {
        expect(parentRecord.getFirstChild(role)).toBe(firstChild);
        expect(parentRecord.type.getFieldIndex(role.uid) < 0).toBe(firstChild === undefined);
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < childrenRecords.length; i++) {
            const childRecord = childrenRecords[i]!;
            expect(childRecord.parent).toBeUndefined();
            expect(childRecord.prev).toBeUndefined();
            expect(childRecord.next).toBeUndefined();
            expect(childRecord.role).toBeUndefined();
        }
    }
    it("heap and node works", () => {
        expect(t0Heap.gidx).toBe(0);
        expect(heapSet.get(globalState.heapMap, t0Heap.gidx)).toBe(t0Heap);
        expect(getGlobalNode(t0Heap.root.uid)).toBe(t0Heap.root);
        expect(isHeapRoot(t0Heap.root)).toBe(true);

        const guidMap = globalState.guidMap;
        const myHeapGidx = guidMap.gidxFromString("f1f24cca-dfdd-47fb-bd68-579d61cb50d7");
        const myHeap = ensureHeap(myHeapGidx);
        expect(ensureHeap(myHeapGidx)).toBe(myHeap);
        expect(myHeap.root).toBe(getGlobalNode(utils.makeUid(myHeapGidx, 0))!);
        expect(isHeapRoot(myHeap.root)).toBe(true);

        const nodeDefGidx = guidMap.gidxFromString("9747a834-94c1-42d7-b609-f2f5da36666b");
        const nodeDef = defNode(nodeDefGidx, 1);
        const fld32Def = defNode(nodeDefGidx, 2);
        const fldBoolDef = defNode(nodeDefGidx, 3);
        const fldDoubleDef = defNode(nodeDefGidx, 4);
        const fldStringDef = defNode(nodeDefGidx, 5);
        const fldUANodeRefDef = defNode(nodeDefGidx, 6);
        const fldSingleChildDef = defNode(nodeDefGidx, 7);
        const fldMultiChildDef = defNode(nodeDefGidx, 8);
        const nTypeEmpty = getNodeType(nodeDef);
        expect(getNodeType(nodeDef, [])).toBe(nTypeEmpty);
        const fields = [
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
        expect(getNodeType(nodeDef, fields)).toBe(nTypeWithFields);
        expect(nTypeWithFields.kind).toBe(TypeKind.Node);
        expect(nTypeWithFields.fields).toBe(fields);
        //expect(nTypeWithFields.heap).toBe(myHeap);

        const node = defNode(nodeDefGidx, 99);
        expect(() => node.write).toThrowError(/changeMap is not editable/);

        expect(() => myHeap.createNode(nTypeWithFields)).toThrowError(/Given content and recordType has different lengths/);
        expect(() => myHeap.createNode(nTypeWithFields, [1])).toThrowError(/Given content and recordType has different lengths/);
        expect(() => myHeap.createNode(nTypeWithFields, [1, true, undefined!, "ha", node])).toThrowError(/Undefined or atomValue field values are not allowed/);
        let baseNode: IReadNode = myHeap.createNode(nTypeWithFields, [1, true, 2.1, "ha", node], node.uid);
        expect(() => myHeap.createNode(nTypeWithFields, [2, false, 3.1, "ba", node], node.uid)).toThrowError(/Record already exists/);

        expect(() => (baseNode as IWriteNodeInternal).removeChildren(fldMultiChildDef)).toThrowError(/Trying to mutate a record with non-editable change map/);

        expect(node.read).toBe(baseNode);

        expect(baseNode.def).toBe(nodeDef);
        expect(baseNode.getField(fld32Def)).toBe(1);
        expect(baseNode.getField(fldBoolDef)).toBe(true);
        expect(baseNode.getField(fldDoubleDef)).toBe(2.1);
        expect(baseNode.getField(fldStringDef)).toBe("ha");
        expect(baseNode.getField(fldUANodeRefDef)).toBe(node);
        expect(baseNode.getField(fldSingleChildDef)).toBe(undefined);
        expect(baseNode.getField(fldMultiChildDef)).toBe(undefined);
        expect(baseNode.getFirstChild(fldSingleChildDef)).toBe(undefined);
        expect(baseNode.getFirstChild(fldMultiChildDef)).toBe(undefined);

        // editable record
        const eChangeMap: IChangeMap = { isBase: false, isEditable: true, _hashCode: 123 };
        globalState.changeMap = eChangeMap;
        const writeRecord = node.write;
        baseNode = node.readNode(globalState.baseChangeMap)!;
        expect(writeRecord as any).not.toBe(baseNode);
        expect((node as INodeRefInternal)._nextVer as any).toBe(baseNode);
        expect((writeRecord as IWriteNodeInternal)._nextVer as any).toBe(baseNode);
        expect((baseNode as any as INodeRefInternal)._nextVer).toBeUndefined();

        expect(writeRecord.def).toBe(nodeDef);
        expect(writeRecord.getField(fld32Def)).toBe(1);
        expect(writeRecord.getField(fldBoolDef)).toBe(true);
        expect(writeRecord.getField(fldDoubleDef)).toBe(2.1);
        expect(writeRecord.getField(fldStringDef)).toBe("ha");
        expect(writeRecord.getField(fldUANodeRefDef)).toBe(node);

        expect(node.read.def).toBe(nodeDef);
        expect(node.read.getField(fld32Def)).toBe(1);
        expect(node.read.getField(fldBoolDef)).toBe(true);
        expect(node.read.getField(fldDoubleDef)).toBe(2.1);
        expect(node.read.getField(fldStringDef)).toBe("ha");
        expect(node.read.getField(fldUANodeRefDef)).toBe(node);

        expect(writeRecord.setField(fld32Def, 2, t0int32Type)).toBe(true);
        expect(node.read.getField(fld32Def)).toBe(2);
        expect(writeRecord.getField(fld32Def)).toBe(2);
        expect(node.readNode(globalState.baseChangeMap)!.getField(fld32Def)).toBe(1);

        //create the single child
        const childNode1 = defNode(nodeDefGidx, 101);
        expect(() => node.write.setChild(fldSingleChildDef, childNode1, t0childNodeType)).toThrowError(/Unresolved write-to node/);
        expect(() => node.write.setChild(fldSingleChildDef, childNode1, t0int32Type)).toThrowError(/Trying to set a non-child value in setChild/);
        expect(() => node.write.setChild(fldSingleChildDef, myHeap.root, t0childNodeType)).toThrowError(/Trying to make a heap root to be a child/);
        // expect(() => writeRecord.setChild(fldSingleChildDef, fldSingleChildDef, childNode1, t0chilNodeType)).toThrowError(/Inconsistent me and this record/);
        const childRecord1 = myHeap.createNode(nTypeEmpty, undefined, childNode1.uid);
        expect(() => node.write.setField(fldSingleChildDef, childNode1, t0childNodeType)).toThrowError(/Trying to set a child in setField/);
        checkChildren([], [], [childRecord1], node, writeRecord, baseNode, fldSingleChildDef);
        expect(node.write.setChild(fldSingleChildDef, childNode1, t0childNodeType)).toBe(childRecord1);
        checkChildren([childRecord1], [childNode1], [], node, writeRecord, baseNode, fldSingleChildDef);

        //create the multiple children + insert last
        const childNode2 = defNode(nodeDefGidx, 102);
        const childNode3 = defNode(nodeDefGidx, 103);
        const childNode4 = defNode(nodeDefGidx, 104);
        expect(() => writeRecord.insertLast(fldMultiChildDef, childNode2, t0childNodeType)).toThrowError(/Unresolved write-to node/);
        const childRecord2 = myHeap.createNode(nTypeEmpty, undefined, childNode2.uid);
        const childRecord3 = myHeap.createNode(nTypeEmpty, undefined, childNode3.uid);
        const childRecord4 = myHeap.createNode(nTypeEmpty, undefined, childNode4.uid);
        expect(() => myHeap.createNode(nTypeEmpty, undefined, childNode4.uid)).toThrowError(/Record already exists/);
        checkChildren([], [], [childRecord2, childRecord3, childRecord4], node, writeRecord, baseNode, fldMultiChildDef);

        //  child2 - insert last

        expect(() => writeRecord.insertLast(fldMultiChildDef, childNode2, t0childNodeType)).not.toThrow();
        checkChildren([childRecord2], [childNode2], [childRecord3, childRecord4], node, writeRecord, baseNode, fldMultiChildDef);
        expect(() => writeRecord.insertLast(fldMultiChildDef, childNode2, t0childNodeType)).toThrowError(/Cannot insertLast\(\). The child is attached/);
        //  child3 - insert last
        expect(() => writeRecord.insertLast(fldMultiChildDef, childNode3, t0childNodeType)).not.toThrow();
        checkChildren([childRecord2, childRecord3], [childNode2, childNode3], [childRecord4], node, writeRecord, baseNode, fldMultiChildDef);
        //  child4 - insert last
        expect(() => writeRecord.insertLast(fldMultiChildDef, childNode4, t0childNodeType)).not.toThrow();
        checkChildren([childRecord2, childRecord3, childRecord4], [childNode2, childNode3, childNode4], [], node, writeRecord, baseNode, fldMultiChildDef);

        //remove 2,3,4 and insert first them again
        expect(writeRecord.removeChildren(fldMultiChildDef)).toBe(3);
        checkChildren([], [], [childRecord2, childRecord3, childRecord4], node, writeRecord, baseNode, fldMultiChildDef);

        //  child2 - insert first
        expect(() => writeRecord.insertFirst(fldMultiChildDef, childNode2, t0childNodeType)).not.toThrow();
        checkChildren([childRecord2], [childNode2], [childRecord3, childRecord4], node, writeRecord, baseNode, fldMultiChildDef);
        //  child3 - insert first
        expect(() => writeRecord.insertFirst(fldMultiChildDef, childNode3, t0childNodeType)).not.toThrow();
        checkChildren([childRecord3, childRecord2], [childNode3, childNode2], [childRecord4], node, writeRecord, baseNode, fldMultiChildDef);
        //  child4 - insert first
        expect(() => writeRecord.insertFirst(fldMultiChildDef, childNode4, t0childNodeType)).not.toThrow();
        checkChildren([childRecord4, childRecord3, childRecord2], [childNode4, childNode3, childNode2], [], node, writeRecord, baseNode, fldMultiChildDef);

        //insert before
        expect(writeRecord.removeChildren(fldMultiChildDef)).toBe(3);
        checkChildren([], [], [childRecord2, childRecord3, childRecord4], node, writeRecord, baseNode, fldMultiChildDef);

        writeRecord.insertFirst(fldMultiChildDef, childNode2, t0childNodeType);
        checkChildren([childRecord2], [childNode2], [childRecord3, childRecord4], node, writeRecord, baseNode, fldMultiChildDef);

        //expect(() => childRecord3.insertBefore(childNode1, childNode2)).toThrowError(/Inconsistent me and this record/);
        expect(() => childRecord3.insertBefore(childNode4)).toThrowError(/Cannot insert after a detached node./);

        childRecord3.insertBefore(childNode2);
        checkChildren([childRecord3, childRecord2], [childNode3, childNode2], [childRecord4], node, writeRecord, baseNode, fldMultiChildDef);
        childRecord4.insertBefore(childNode3);
        checkChildren([childRecord4, childRecord3, childRecord2], [childNode4, childNode3, childNode2], [], node, writeRecord, baseNode, fldMultiChildDef);
        expect(childRecord4.detach()).toBe(true);
        checkChildren([childRecord3, childRecord2], [childNode3, childNode2], [childRecord4], node, writeRecord, baseNode, fldMultiChildDef);
        childRecord4.insertBefore(childNode2);
        checkChildren([childRecord3, childRecord4, childRecord2], [childNode3, childNode4, childNode2], [], node, writeRecord, baseNode, fldMultiChildDef);
        expect(childRecord4.detach()).toBe(true);
        checkChildren([childRecord3, childRecord2], [childNode3, childNode2], [childRecord4], node, writeRecord, baseNode, fldMultiChildDef);
        childRecord4.insertBefore(childNode3);
        checkChildren([childRecord4, childRecord3, childRecord2], [childNode4, childNode3, childNode2], [], node, writeRecord, baseNode, fldMultiChildDef);
        //detach last and first when two
        expect(childRecord2.detach()).toBe(true);
        checkChildren([childRecord4, childRecord3], [childNode4, childNode3], [childRecord2], node, writeRecord, baseNode, fldMultiChildDef);
        expect(childRecord3.detach()).toBe(true);
        checkChildren([childRecord4], [childNode4], [childRecord2, childRecord3], node, writeRecord, baseNode, fldMultiChildDef);
        //expect(() => childRecord3.insertAfter(childNode4, childNode3)).toThrowError(/Inconsistent me and this record/);
        childRecord3.insertAfter(childNode4);
        checkChildren([childRecord4, childRecord3], [childNode4, childNode3], [childRecord2], node, writeRecord, baseNode, fldMultiChildDef);
        expect(childRecord4.detach()).toBe(true);
        checkChildren([childRecord3], [childNode3], [childRecord2, childRecord4], node, writeRecord, baseNode, fldMultiChildDef);
        expect(childRecord3.detach()).toBe(true);
        checkChildren([], [], [childRecord2, childRecord3, childRecord4], node, writeRecord, baseNode, fldMultiChildDef);
        expect(childRecord3.detach()).toBe(false);
        checkChildren([], [], [childRecord2, childRecord3, childRecord4], node, writeRecord, baseNode, fldMultiChildDef);
        //more insert after
        writeRecord.insertFirst(fldMultiChildDef, childNode2, t0childNodeType);
        checkChildren([childRecord2], [childNode2], [childRecord3, childRecord4], node, writeRecord, baseNode, fldMultiChildDef);
        childRecord4.insertAfter(childNode2);
        checkChildren([childRecord2, childRecord4], [childNode2, childNode4], [childRecord3], node, writeRecord, baseNode, fldMultiChildDef);
        childRecord3.insertAfter(childNode2);
        checkChildren([childRecord2, childRecord3, childRecord4], [childNode2, childNode3, childNode4], [], node, writeRecord, baseNode, fldMultiChildDef);

        //remove fields
        expect(() => writeRecord.removeField(fldMultiChildDef)).toThrowError(/A child cannot be removed by removeField/);
        expect(() => writeRecord.removeChildren(fld32Def)).toThrowError(/A non-child cannot be removed by removeChildren/);
        expect(writeRecord.getFirstChild(fldSingleChildDef)).toBe(childNode1);
        expect(writeRecord.removeChildren(fldSingleChildDef)).toBe(1);
        expect(writeRecord.getFirstChild(fldSingleChildDef)).toBeUndefined();
        //multi remove all again
        expect(() => writeRecord.setChild(fldMultiChildDef, childNode1, t0childNodeType)).toThrowError(/Expected a single child record in setChild/);
        expect(writeRecord.getFirstChild(fldMultiChildDef)).toBe(childNode2);
        expect(writeRecord.removeChildren(fldMultiChildDef)).toBe(3);
        expect(writeRecord.getFirstChild(fldMultiChildDef)).toBeUndefined();
        //re-set 2 times
        writeRecord.setChild(fldSingleChildDef, childNode1, t0childNodeType);
        expect(writeRecord.getFirstChild(fldSingleChildDef)).toBe(childNode1);
        expect(() => writeRecord.setChild(fldSingleChildDef, childNode1, t0childNodeType)).toThrowError(/The child is attached/);
        writeRecord.setChild(fldSingleChildDef, childNode2, t0childNodeType);
        expect(writeRecord.getFirstChild(fldSingleChildDef)).toBe(childNode2);
        expect(childRecord2.parent).toBe(node);
        expect(childRecord1.parent).toBe(undefined);

        expect(writeRecord.getField(fld32Def)).toBe(2);
        expect(writeRecord.removeField(fld32Def)).toBe(2);
        expect(writeRecord.getField(fld32Def)).toBe(undefined);
        expect(writeRecord.removeField(fld32Def)).toBe(undefined);

        expect(writeRecord.type.fields[0]?.uid).toBe(fldBoolDef.uid);
        expect(writeRecord.setField(fld32Def, 5, t0int32Type)).toBe(true);
        expect(writeRecord.getField(fld32Def)).toBe(5);
        expect(writeRecord.type.fields[0]?.uid).toBe(fld32Def.uid);
        expect(writeRecord.type.fields[0]?.type).toBe(t0int32Type);

        expect(writeRecord.setField(fld32Def, 5.5, t0doubleType)).toBe(true);
        expect(writeRecord.setField(fld32Def, 5.5, t0doubleType)).toBe(false);
        expect(writeRecord.getField(fld32Def)).toBe(5.5);
        expect(writeRecord.type.fields[0]?.uid).toBe(fld32Def.uid);
        expect(writeRecord.type.fields[0]?.type).toBe(t0doubleType);

        //add 1 field to an empty record
        expect(childRecord1.type.fields.length).toBe(0);
        expect(childRecord1.setField(fld32Def, 5.5, t0doubleType)).toBe(true);
        expect(childRecord1.setField(fld32Def, 5.5, t0doubleType)).toBe(false);
        expect(childRecord1.getField(fld32Def)).toBe(5.5);
        expect(childRecord1.type.fields[0]?.uid).toBe(fld32Def.uid);
        expect(childRecord1.type.fields[0]?.type).toBe(t0doubleType);

        //set def
        const nodeDef20 = defNode(nodeDefGidx, 20);
        expect(childRecord1.setDef(nodeDef)).toBe(false);
        expect(childRecord1.setDef(nodeDef20)).toBe(true);
        expect(childRecord1.def).toBe(nodeDef20);
        expect(childRecord1.setDef(nodeDef20)).toBe(false);

        //expect()
    });
});