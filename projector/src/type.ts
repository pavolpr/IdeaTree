import type { INodeRef, IReadNode, IWriteNode, FieldValue } from "./node";
import * as utils from "./utils";
import { globalState, conceptSetByNodeRef } from "./mx/globalstate";
import type { IConcept } from "./concept";

type Uid = number;

export const TypeKind = {
    Primitive: 0,
    Node: 1,
    Struct: 2,
    Array: 3,
    String: 4,
    Ref: 5,
    ChildNode: 6
} as const;
export type TypeKind = typeof TypeKind[keyof typeof TypeKind];
//export type T0Type = NodeType;

export interface IType {
    readonly kind: TypeKind;
    readonly _hashCode: number;
    equalsSameKindAndHash(other: IType): boolean;
}

export function typeEquals(t1: IType, t2: IType): boolean {
    return t1 === t2
        || (t1._hashCode === t2._hashCode
            && t1.kind === t2.kind
            && t1.equalsSameKindAndHash(t2));
}

export const PrimitiveKind = {
    Empty: 0,
    Bool: 1,
    UInt8: 2,
    Int8: 3,
    UInt16: 4,
    Int16: 5,
    UInt32: 6,
    Int32: 7,
    UInt64: 8,
    Int64: 9,
    //Char16: 10 as PrimitiveKindType,
    Single: 10,
    Double: 11
} as const;
export type PrimitiveKind = typeof PrimitiveKind[keyof typeof PrimitiveKind];

export abstract class PrimitiveType implements IType {
    kind!: TypeKind;
    primitiveKind!: PrimitiveKind;
    _hashCode: number;
    //heap: IHeap;
    def: INodeRef; //ref's concept
    constructor(def: INodeRef) {
        this._hashCode = utils.combineHashCodes(def.uid | 0, this.primitiveKind);
        this.def = def;
    }
    equalsSameKindAndHash(other: PrimitiveType): boolean {
        return this.primitiveKind === other.primitiveKind && this.def === other.def;
    }
}
PrimitiveType.prototype.kind = TypeKind.Primitive;

export class EmptyType extends PrimitiveType {
    declare primitiveKind: PrimitiveKind;
}
EmptyType.prototype.primitiveKind = PrimitiveKind.Empty;

export class BoolType extends PrimitiveType {
    declare primitiveKind: PrimitiveKind;
}
BoolType.prototype.primitiveKind = PrimitiveKind.Bool;

export class Uint8Type extends PrimitiveType {
    declare primitiveKind: PrimitiveKind;
}
Uint8Type.prototype.primitiveKind = PrimitiveKind.UInt8;

export class Uint16Type extends PrimitiveType {
    declare primitiveKind: PrimitiveKind;
}
Uint16Type.prototype.primitiveKind = PrimitiveKind.UInt16;

export class Uint32Type extends PrimitiveType {
    declare primitiveKind: PrimitiveKind;
}
Uint32Type.prototype.primitiveKind = PrimitiveKind.UInt32;

export class Uint64Type extends PrimitiveType {
    declare primitiveKind: PrimitiveKind;
}
Uint64Type.prototype.primitiveKind = PrimitiveKind.UInt64;

export class Int8Type extends PrimitiveType {
    declare primitiveKind: PrimitiveKind;
}
Int8Type.prototype.primitiveKind = PrimitiveKind.Int8;

export class Int16Type extends PrimitiveType {
    declare primitiveKind: PrimitiveKind;
}
Int16Type.prototype.primitiveKind = PrimitiveKind.Int16;

export class Int32Type extends PrimitiveType {
    declare primitiveKind: PrimitiveKind;
}
Int32Type.prototype.primitiveKind = PrimitiveKind.Int32;

export class Int64Type extends PrimitiveType {
    declare primitiveKind: PrimitiveKind;
}
Int64Type.prototype.primitiveKind = PrimitiveKind.Int64;

export class SingleType extends PrimitiveType {
    declare primitiveKind: PrimitiveKind;
}
SingleType.prototype.primitiveKind = PrimitiveKind.Single;

export class DoubleType extends PrimitiveType {
    declare primitiveKind: PrimitiveKind;
}
DoubleType.prototype.primitiveKind = PrimitiveKind.Double;


export type RefKindType = 0 | 1 | 2 | 3 | 4 | 5;
export const RefKind = {
    UaNode: 0 as RefKindType,
    LocalNode: 1 as RefKindType,
    UaObject: 2 as RefKindType,
    LocalObject: 3 as RefKindType,
    UaValue: 4 as RefKindType,
    LocalValue: 5 as RefKindType
};

export abstract class RefType implements IType {
    kind!: TypeKind;
    refKind!: RefKindType;
    _hashCode: number;
    def: INodeRef; //ref's concept
    constructor(def: INodeRef) {
        this._hashCode = utils.combineHashCodes(def.uid | 0, this.refKind);
        this.def = def;
    }
    equalsSameKindAndHash(other: RefType): boolean {
        return this.refKind === other.refKind && this.def === other.def;
    }
}
RefType.prototype.kind = TypeKind.Ref;

export class UaNodeRefType extends RefType {
    declare refKind: RefKindType;
}
UaNodeRefType.prototype.refKind = RefKind.UaNode;

export class LocalNodeRefType extends RefType {
    declare refKind: RefKindType;
}
LocalNodeRefType.prototype.refKind = RefKind.LocalNode;

export class UaObjectRefType extends RefType {
    declare refKind: RefKindType;
}
UaObjectRefType.prototype.refKind = RefKind.UaObject;

export class LocalObjectRefType extends RefType {
    declare refKind: RefKindType;
}
LocalObjectRefType.prototype.refKind = RefKind.LocalObject;

type ValueHeapType = ArrayType | StringType;

export class UaValueRefType extends RefType {
    declare refKind: RefKindType;
    valueType: ValueHeapType;
    constructor(def: INodeRef, valueType: ValueHeapType) {
        super(def);
        this.valueType = valueType;
    }
}
UaValueRefType.prototype.refKind = RefKind.UaValue;

export class LocalValueRefType extends RefType {
    declare refKind: RefKindType;
    valueType: ValueHeapType;
    constructor(def: INodeRef, valueType: ValueHeapType) {
        super(def);
        this.valueType = valueType;
    }
}
LocalValueRefType.prototype.refKind = RefKind.LocalValue;

type FixedSizedType = StructType | PrimitiveType | RefType;

export class ArrayType implements IType {
    declare kind: TypeKind;
    _hashCode: number;
    def: INodeRef; //array's concept
    elemType: FixedSizedType;
    constructor(def: INodeRef, elemType: FixedSizedType) {
        this._hashCode = utils.combineHashCodes(def.uid | 0, elemType._hashCode);
        this.def = def;
        this.elemType = elemType;
    }
    equalsSameKindAndHash(other: ArrayType): boolean {
        if (this.def !== other.def)
            return false;
        return typeEquals(this.elemType, other.elemType);
    }
    toString() {
        return `c${this.def} ${this.elemType}[]`;
    }
}
ArrayType.prototype.kind = TypeKind.Array;

export class StringType implements IType {
    declare kind: TypeKind;
    _hashCode: number;
    def: INodeRef; //strings's concept
    constructor(def: INodeRef) {
        this._hashCode = def.uid | 0;
        this.def = def;
        //this.elemType = elemType; //u8
    }
    equalsSameKindAndHash(other: StringType): boolean {
        return this.def === other.def;
    }
    toString() {
        return `c${this.def} string`;
    }
}
StringType.prototype.kind = TypeKind.String;

export class ChildNodeType implements IType {
    declare kind: TypeKind;
    _hashCode: number;
    def: INodeRef; //child-node-type's concept
    constructor(def: INodeRef) {
        this._hashCode = def.uid | 0;
        this.def = def;
    }
    equalsSameKindAndHash(other: ChildNodeType): boolean {
        return this.def === other.def;
    }
    toString() {
        return `c${this.def} child`;
    }
}
ChildNodeType.prototype.kind = TypeKind.ChildNode;

export function normalizeFieldsAndHash(kind: TypeKind, fields: FieldDef[], def: INodeRef) {
    ensureNormalizedStructFieldsOrder(fields);
    let hashCode = utils.combineHashCodes(kind, def.uid /*| 0*/);
    for (const field of fields) {
        hashCode = utils.combineHashCodes(hashCode, field._hashCode);
    }
    return hashCode;
}
abstract class TypeWithFields /*implements IType*/ {
    declare kind: TypeKind;
    readonly _hashCode: number;
    readonly def: INodeRef; //struct concept
    readonly fields: FieldDef[];
    constructor(def: INodeRef, fields: FieldDef[], hashCode?: number) {
        if (hashCode === undefined) {
            hashCode = normalizeFieldsAndHash(this.kind, fields, def);
        }
        this._hashCode = hashCode;
        this.def = def;
        this.fields = fields;
    }


    equalsSameKindAndHash(other: TypeWithFields): boolean {
        return this.equalsDefAndFields(other.def, other.fields);
    }
    equalsDefAndFields(def: INodeRef, otherFields: FieldDef[]): boolean {
        if (this.def !== def)
            return false;
        const fields = this.fields;
        if (fields.length !== otherFields.length)
            return false;
        for (let i = 0; i < fields.length; i++) {
            if (!fieldEquals(fields[i]!, otherFields[i]!))
                return false;
        }
        return true;
    }
    getFieldIndex(fieldUid: Uid) {
        //return getIndex(this.fields, fieldUid, 0, this.fields.length-1);
        const fields = this.fields;
        let low = 0;
        let hi = fields.length - 1;
        while (low <= hi) {
            const mid = (low + hi) >> 1;
            //var mid = low + (hi - low)/2; //the same as (low + hi) >> 1
            const midField = fields[mid]!.uid;
            if (midField === fieldUid)
                return mid;
            if (midField < fieldUid) {
                low = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        return ~low;//-(low+1); //must be <0, the low is the insert position for the missing field

        //low + (hi - low)/2
        //low = 2x + a, hi = 2y + b 
        //... 2x + a + (2y+b -2x -a)/2
        //... 2x + a + (2y + -2x + b-a) / 2

        //--- (low + hi)/2
        //--- (2x + a + 2y + b)/2
        //--- (2x + 2y + a + b)/2
        //--- x + y + 1 when a=1, b=1  or  x + y otherwise
    }
}

export class StructType extends TypeWithFields implements IType {
    declare kind: TypeKind;

    constructor(def: INodeRef, fields: FieldDef[]) {
        super(def, fields);
    }

    insertField(field: FieldDef, index: number): StructType {
        if (field.type.kind === TypeKind.ChildNode) {
            throw new Error("Trying to insert a child field into a StructType.");
        }
        const newFields = insertField(this.fields, field, index);
        return new StructType(this.def, newFields);
    }
    updateField(fieldType: IType, index: number): StructType {
        const fields = this.fields;
        const newFields = updateField(fields, fieldType, index);
        return new StructType(this.def, newFields);
    }
    removeField(index: number): StructType {
        const fields = this.fields;
        const newFields = removeField(fields, index);
        return new StructType(this.def, newFields);
    }
    toString() {
        return `StructType{def:${this.def}, flds=${this.fields.length}}`;
    }
}
StructType.prototype.kind = TypeKind.Struct;

const deleteFieldSentinel: IType = {
    kind: TypeKind.Primitive,
    _hashCode: 12345,
    equalsSameKindAndHash(other: IType) {
        return other == deleteFieldSentinel;
    }
}

//TODO: mem unit where this type belongs
export class NodeType extends TypeWithFields implements IType {
    declare kind: TypeKind;
    readonly fieldInserts: utils.ArraySet<NodeFieldInsert> = [];

    constructor(def: INodeRef, fields: FieldDef[], hashCode?: number) {
        super(def, fields, hashCode);
    }

    //TODO: implement IConcept subtyping
    get concept(): IConcept | undefined {
        return conceptSetByNodeRef.get(globalState.conceptMap, this.def);
    }

    insertField(fieldUid: utils.Uid, fieldType: IType, index: number): NodeType {
        const key = fieldInsertKey(fieldUid, fieldType);
        const resInsert = nodeFieldInsertSet.add(this.fieldInserts, key);
        let toNodeType = resInsert.toNodeType;
        if (toNodeType === undefined /* nodeFieldInsertSet.wasCreated*/) {
            const newFields = insertField(this.fields, resInsert.field, index);
            resInsert.toNodeType = toNodeType = getNodeType(this.def, newFields);//nodeType.insertField(resInsert.field, index);
        }
        return toNodeType;
    }

    updateField(newFieldType: IType, index: number): NodeType {
        const fields = this.fields;
        const key = fieldInsertKey(fields[index]!.uid, newFieldType);
        const resInsert = nodeFieldInsertSet.add(this.fieldInserts, key);
        let toNodeType = resInsert.toNodeType;
        if (toNodeType === undefined /* nodeFieldInsertSet.wasCreated*/) {
            const newFields = updateField(fields, newFieldType, index);
            resInsert.toNodeType = toNodeType = getNodeType(this.def, newFields);//nodeType.updateField(newFieldType, index);
        }
        return toNodeType;
    }

    removeField(index: number): NodeType {
        const fields = this.fields;
        const key = fieldInsertKey(fields[index]!.uid, deleteFieldSentinel);
        const resInsert = nodeFieldInsertSet.add(this.fieldInserts, key);
        let toNodeType = resInsert.toNodeType;
        if (toNodeType === undefined /* nodeFieldInsertSet.wasCreated*/) {
            const newFields = removeField(fields, index);
            resInsert.toNodeType = toNodeType = getNodeType(this.def, newFields); //nodeType.removeField(index);
        }
        return toNodeType;
    }

    // _insertField(field: FieldDef, index: number): NodeType {
    //     const newFields = insertField(this.fields, field, index);
    //     return getNodeType(this.def, newFields);
    // }
    // _updateField(fieldType: IType, index: number): NodeType {
    //     const newFields = updateField(this.fields, fieldType, index);
    //     return getNodeType(this.def, newFields);
    // }
    // _removeField(index: number): NodeType {
    //     const newFields = removeField(this.fields, index);
    //     return getNodeType(this.def, newFields);
    // }

    toString() {
        return `NodeType{def=${this.def},flds=${this.fields.length}}`;
    }
}
NodeType.prototype.kind = TypeKind.Node;

// function getIndex(fields: FieldDef[], fieldUid: Uid, low: number, hi: number) {
//     while (low <= hi) {
//         const mid = (low + hi) >> 1;
//         //var mid = low + (hi - low)/2; //the same as (low + hi) >> 1
//         const midField = fields[mid].uid;
//         if (midField === fieldUid)
//             return mid;
//         if (midField < fieldUid) {
//             low = mid + 1;
//         } else {
//             hi = mid - 1;
//         }
//     }
//     return ~low;//-(low+1); //must be <0, the low is the insert position for the missing field

//     //low + (hi - low)/2
//     //low = 2x + a, hi = 2y + b 
//     //... 2x + a + (2y+b -2x -a)/2
//     //... 2x + a + (2y + -2x + b-a) / 2

//     //--- (low + hi)/2
//     //--- (2x + a + 2y + b)/2
//     //--- (2x + 2y + a + b)/2
//     //--- x + y + 1 when a=1, b=1  or  x + y otherwise
// }

//TODO: inline these 
function insertField(fields: FieldDef[], field: FieldDef, index: number): FieldDef[] {
    const uid = field.uid;
    if (index < fields.length && uid >= fields[index]!.uid
        || index - 1 >= 0 && fields[index - 1]!.uid >= uid) {
        throw new Error("Invalid try to insert a field.");
    }
    const newFields = fields.slice();
    newFields.splice(index, 0, field);
    return newFields;
}

function updateField(fields: FieldDef[], fieldType: IType, index: number): FieldDef[] {
    const newFields = fields.slice();
    newFields[index] = new FieldDef(newFields[index]!.uid, fieldType);
    return newFields;
}

function removeField(fields: FieldDef[], index: number): FieldDef[] {
    const newFields = fields.slice();
    newFields.splice(index, 1);
    return newFields;
}

export function hashField(fieldUid: utils.Uid, fieldType: IType) {
    return utils.combineHashCodes(fieldUid, fieldType._hashCode);
}
export class FieldDef { //: IEquatable<FieldDef>
    readonly _hashCode: number;
    readonly uid: Uid;
    readonly type: IType;
    constructor(fieldUid: Uid, fieldType: IType, hashCode?: number) {
        this._hashCode = hashCode === undefined ? hashField(fieldUid, fieldType) : hashCode;
        this.uid = fieldUid;
        this.type = fieldType;
    }

    toString() {
        return `f${utils.getGidx(this.uid)},${utils.getSidx(this.uid)}:${this.type}`;
    }
}

export function fieldEquals(fld1: FieldDef, fld2: FieldDef): boolean {
    if (fld1._hashCode !== fld2._hashCode || fld1.uid !== fld2.uid)
        return false;
    return typeEquals(fld1.type, fld2.type);
}

export interface IFieldAccessor {
    readonly fieldDefNode: INodeRef,
    readonly fieldType: IType
}

export class FieldAccessor<V extends FieldValue> implements IFieldAccessor {
    readonly fieldDefNode: INodeRef;
    readonly fieldType: IType;

    constructor(fieldDefNode: INodeRef, fieldType: IType) {
        this.fieldDefNode = fieldDefNode;
        this.fieldType = fieldType;
    }

    get(node: IReadNode): V | undefined {
        const value = node.getField(this.fieldDefNode, false);
        return value as V | undefined;
    }

    set(node: IWriteNode, value: V): boolean {
        return node.setField(this.fieldDefNode, value, this.fieldType);
    }

    remove(node: IWriteNode): V | undefined {
        return node.removeField(this.fieldDefNode) as V | undefined;
    }
}

export class ChildAccessor implements IFieldAccessor {
    readonly fieldDefNode: INodeRef;
    readonly fieldType: IType;

    constructor(fieldDefNode: INodeRef, fieldType: IType) {
        this.fieldDefNode = fieldDefNode;
        this.fieldType = fieldType;
        if (fieldType.kind !== TypeKind.ChildNode)
            throw "Expected ChildNode type.";
    }

    getChild(node: IReadNode): INodeRef | undefined {
        const value = node.getField(this.fieldDefNode, true);
        return value as INodeRef | undefined;
    }

    setChild(node: IWriteNode, child: INodeRef): IWriteNode {
        return node.setChild(this.fieldDefNode, child, this.fieldType);
    }

    removeChild(node: IWriteNode): number {
        return node.removeChildren(this.fieldDefNode);
    }
}

//TODO: implement children's type checking against the fieldType
export class ChildrenAccessor implements IFieldAccessor {
    readonly fieldDefNode: INodeRef;
    readonly fieldType: IType;

    constructor(fieldDefNode: INodeRef, fieldType: IType) {
        this.fieldDefNode = fieldDefNode;
        this.fieldType = fieldType;
        if (fieldType.kind !== TypeKind.ChildNode)
            throw "Expected ChildNode type.";
    }

    getFirstChild(node: IReadNode): INodeRef | undefined {
        const value = node.getFirstChild(this.fieldDefNode);
        return value as INodeRef | undefined;
    }
    getLastChild(node: IReadNode): INodeRef | undefined {
        const first = node.getFirstChild(this.fieldDefNode);
        const prev = first?.read?.prev;
        return (prev || first) as INodeRef | undefined;
    }

    insertFirst(parent: IWriteNode, child: INodeRef): void {
        return parent.insertFirst(this.fieldDefNode, child, this.fieldType);
    }
    insertLast(parent: IWriteNode, child: INodeRef): void {
        return parent.insertLast(this.fieldDefNode, child, this.fieldType);
    }
    insertBefore(node: IWriteNode, anchor: INodeRef): void {
        return node.insertBefore(anchor);
    }
    insertAfter(node: IWriteNode, anchor: INodeRef): void {
        return node.insertAfter(anchor);
    }

    removeChildren(node: IWriteNode): number {
        return node.removeChildren(this.fieldDefNode);
    }
}

/*
export const fieldDefComparer: utils.IDictComparer<FieldDef> = {
    hashCode(key: FieldDef): number {
        return key._hashCode;
    },
    equals: fieldEquals
};
*/

function ensureNormalizedStructFieldsOrder(fields: FieldDef[]) {
    let prev: FieldDef | undefined;
    for (const field of fields) {
        if (prev !== undefined && structFieldDefSortCompare(prev, field) > 0) {
            fields.sort(structFieldDefSortCompare);
            break;
        }
        prev = field;
    }
}
function structFieldDefSortCompare(x: FieldDef, y: FieldDef): number {
    const xField = x.uid;
    const yField = y.uid;
    if (xField < yField) return -1;
    if (xField > yField) return 1;
    return 0;
}

export class NodeFieldInsert {
    //readonly _hashCode: number;
    //readonly nodeType: NodeType;
    readonly field: FieldDef;
    toNodeType: NodeType | undefined;
    constructor(/*nodeType: NodeType,*/ field: FieldDef/*, hashCode: number*/) {
        //this.nodeType = nodeType;
        this.field = field;
        //this._hashCode = hashCode;
        this.toNodeType = undefined;
    }
}

const _fieldInsertKey: IFieldInsertKey = {
    //nodeType: undefined!,
    fieldUid: 0,
    fieldType: undefined!,
    fieldHashCode: 0,
    //hashCode: 0,
};

function fieldInsertKey(/*nodeType: NodeType,*/ fieldUid: utils.Uid, fieldType: IType) {
    const key = _fieldInsertKey;
    //key.nodeType = nodeType;
    key.fieldUid = fieldUid;
    key.fieldType = fieldType;
    const fieldHashCode = hashField(fieldUid, fieldType);
    key.fieldHashCode = fieldHashCode;
    //key.hashCode = utils.combineHashCodes(nodeType._hashCode, fieldHashCode);
    return key;
}
export interface IFieldInsertKey {
    //hashCode: number;
    //nodeType: NodeType;
    //field: FieldDef;
    fieldHashCode: number;
    fieldUid: utils.Uid;
    fieldType: IType; //undefined for "empty"
}

const nodeFieldInsertSet = new utils.ArraySetImplementation<IFieldInsertKey, NodeFieldInsert>(
    (key: IFieldInsertKey, b: NodeFieldInsert) =>
        //key.hashCode === b._hashCode && 
        key.fieldHashCode === b.field._hashCode
        && key.fieldUid === b.field.uid
        //&& typeEquals(key.nodeType, b.nodeType)
        && typeEquals(key.fieldType, b.field.type),
    (key: IFieldInsertKey) => key.fieldHashCode,
    (value: NodeFieldInsert) => value.field._hashCode,
    (key: IFieldInsertKey) => new NodeFieldInsert(/*key.nodeType,*/ new FieldDef(key.fieldUid, key.fieldType, key.fieldHashCode)/*, key.hashCode*/)
);

export interface INodeTypeKey {
    //heap: IHeap;
    _hashCode: number;
    def: INodeRef;
    fields: FieldDef[];
}

const nodeTypeSet = new utils.ArraySetImplementation<INodeTypeKey, NodeType>(
    (key: INodeTypeKey, value: NodeType) => value._hashCode === key._hashCode && value.equalsDefAndFields(key.def, key.fields),
    (key: INodeTypeKey) => key._hashCode,
    (value: NodeType) => value._hashCode,
    (key: INodeTypeKey) => new NodeType(key.def, key.fields, key._hashCode),
);

let nodeTypeKey: INodeTypeKey = {
    _hashCode: 0,
    def: undefined!,
    fields: undefined!
};

const emptyFreezedArray: any[] = [];
if (Object.freeze) Object.freeze(emptyFreezedArray);

export function getNodeType(def: INodeRef, fields: FieldDef[] = emptyFreezedArray): NodeType {
    const key = nodeTypeKey;
    key._hashCode = normalizeFieldsAndHash(TypeKind.Node, fields, def);
    key.def = def;
    key.fields = fields;
    return nodeTypeSet.add(globalState.nodeTypes, key);
}

// function ensureNormalizedNodeFieldsOrder(fields: FieldDef[], valuesLen?: number): number {
//     let prev: FieldDef | undefined;
//     for(const field of fields) {
//         if (prev !== undefined && nodeFieldDefSortCompare(prev, field) > 0) {
//             fields.sort(nodeFieldDefSortCompare);
//             break;
//         }
//         prev = field;
//     }
//     if (valuesLen !== undefined) {
//         const lastValueIdx = valuesLen - 1;
//         const isValue = lastValueIdx < 0 || fields[lastValueIdx].type.kind !== TypeKind.ChildNode;
//         const isChild = valuesLen >= fields.length || fields[valuesLen].type.kind === TypeKind.ChildNode;
//         if(isValue && isChild)
//             return valuesLen;
//     }
//     valuesLen = 0;
//     for(const field of fields) {
//         if(field.type.kind === TypeKind.ChildNode)
//             break;
//         valuesLen++;
//     }
//     return valuesLen;
// }
//
// //export const childNode: IType = undefined!;
// function nodeFieldDefSortCompare(x: FieldDef, y: FieldDef): number {
//     const xIsChild = x.type.kind === TypeKind.ChildNode;
//     const yIsChild = y.type.kind === TypeKind.ChildNode;
//     if(xIsChild !== yIsChild) {
//         return yIsChild ? -1 : 1;
//     }
//     const xField = x.uid;
//     const yField = y.uid;
//     if (xField < yField) return -1;
//     if (xField > yField) return 1;
//     return 0;
// }


