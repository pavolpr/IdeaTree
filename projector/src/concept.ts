import { INodeRef, getGlobalNode, ensureGlobalNode, IWriteNode } from "./node";
import { makeUid } from "./utils";
import { globalState, conceptSet } from "./mx/globalstate";
import { Heap, ensureHeap } from "./heap";
import { IType, FieldDef, getNodeType, NodeType, FieldAccessor, ChildrenAccessor, /*EmptyType,*/ Int32Type, BoolType, DoubleType, StringType, UaNodeRefType, ChildNodeType, ChildAccessor } from "./type";
import { ComputedValue } from "./mx/computedvalue";

export const t0langGuid = "36bcda2b-c6ae-4cdc-9eaa-74b4ff839b46";
export const grammarLangGuid = "05c40122-93aa-43f3-82bd-8045e4dc8854";
export const tokenLangGuid = "87be2db1-93be-479a-92b3-39237718c2d6";

const t0gidx = globalState.guidMap.gidxFromString(t0langGuid);
export const t0Heap = ensureHeap(t0gidx);
//const primitiveDef = ensureGlobalNode(makeUid(t0gidx, 1) );
export const baseConceptDef = ensureGlobalNode(makeUid(t0gidx, 1));
const generalPurposeDef = ensureGlobalNode(makeUid(t0gidx, 2));
export const nameFieldDef = ensureGlobalNode(makeUid(t0gidx, 3));
export const conceptStructureMemberDefDef = ensureGlobalNode(makeUid(t0gidx, 4));
export const conceptDefDef = ensureGlobalNode(makeUid(t0gidx, 5));
export const traitDefDef = ensureGlobalNode(makeUid(t0gidx, 6));
export const traitRefDef = ensureGlobalNode(makeUid(t0gidx, 19));
export const traitRefTraitFieldDef = ensureGlobalNode(makeUid(t0gidx, 20));
export const conceptOrTraitDefMembersDef = ensureGlobalNode(makeUid(t0gidx, 7));
export const conceptOrTraitDefTraitsDef = ensureGlobalNode(makeUid(t0gidx, 17));
export const languageModuleRootDef = ensureGlobalNode(makeUid(t0gidx, 8));
export const langDefinitionsMemberDef = ensureGlobalNode(makeUid(t0gidx, 9));

export const structureMemberTypeDef = ensureGlobalNode(makeUid(t0gidx, 14));
export const primitiveTypeDef = ensureGlobalNode(makeUid(t0gidx, 30));
export const stringTypeDef = ensureGlobalNode(makeUid(t0gidx, 23));
export const boolTypeDef = ensureGlobalNode(makeUid(t0gidx, 22));
export const doubleTypeDef = ensureGlobalNode(makeUid(t0gidx, 25));
export const integerTypeDef = ensureGlobalNode(makeUid(t0gidx, 26));
export const ofConceptFieldDef = ensureGlobalNode(makeUid(t0gidx, 39));
export const nodeRefTypeDef = ensureGlobalNode(makeUid(t0gidx, 27));
export const singleChildTypeDef = ensureGlobalNode(makeUid(t0gidx, 29));
//export const zeroOrOneChildTypeDef = ensureGlobalNode(makeUid(t0gidx, 30));
export const childrenTypeDef = ensureGlobalNode(makeUid(t0gidx, 31));
//export const oneOrMoreChildTypeDef = ensureGlobalNode(makeUid(t0gidx, 32));
export const conceptMemberTypeIsOptionalFieldDef = ensureGlobalNode(makeUid(t0gidx, 38));

export const StyleTermArgDef = ensureGlobalNode(makeUid(globalState.guidMap.gidxFromString(grammarLangGuid), 22));
export const TokenDefDef = ensureGlobalNode(makeUid(globalState.guidMap.gidxFromString(tokenLangGuid), 1));

//export const t0emptyType = new EmptyType(primitiveDef);
const int32Def = ensureGlobalNode(makeUid(t0gidx, 34) );
const boolDef = ensureGlobalNode(makeUid(t0gidx, 35) );
const doubleDef = ensureGlobalNode(makeUid(t0gidx, 36) );
const stringDef = ensureGlobalNode(makeUid(t0gidx, 37) );
export const t0int32Type = new Int32Type(int32Def);
export const t0boolType = new BoolType(boolDef);
export const t0doubleType = new DoubleType(doubleDef);
export const t0stringType = new StringType(stringDef);
export const t0uaNodeRefType = new UaNodeRefType(generalPurposeDef);
export const t0childNodeType = new ChildNodeType(generalPurposeDef);

export function getNodeName(node?: INodeRef) {
    const fieldRecord = node && node.readNode(globalState.changeMap, true);
    return fieldRecord && fieldRecord.getField(nameFieldDef) as string | undefined;
}
export function getFieldName(field: FieldDef) {
    return getNodeName(getGlobalNode(field.uid));
}

function field(def: INodeRef, fieldType: IType) {
    return new FieldDef(def.uid, fieldType);
}
// function toField(fieldAccessor: IFieldAccessor) {
//     return field(fieldAccessor.fieldDefNode, fieldAccessor.fieldType);
// }

//TODO: ConceptDef concept
const nameField = [field(nameFieldDef, t0stringType)];
const structureMemberNodeTypeWithName = getNodeType(conceptStructureMemberDefDef, nameField);
const conceptDefNodeTypeWithName = getNodeType(conceptDefDef, nameField);
const traitDefNodeTypeWithName = getNodeType(traitDefDef, nameField);
const languageModuleRooNodeType = getNodeType(languageModuleRootDef);

export class LangBuilder {
    langGidx: number;
    langHeap: Heap;
    root: IWriteNode;
    constructor(readonly langGuid: string, readonly name: string, freeSidx: number) {
        this.langGidx = globalState.guidMap.gidxFromString(langGuid);
        this.langHeap = ensureHeap(this.langGidx);//new Heap(this.langGidx);
        this.langHeap.setLastUid(makeUid(this.langGidx, freeSidx));
        const origChangeMap = globalState.changeMap;
        globalState.setupEditMode();
        this.root = this.langHeap.createNode(languageModuleRooNodeType, undefined, this.langHeap.root.uid);
        globalState.changeMap = origChangeMap;
    }

    private uid(sidx: number) {
        return makeUid(this.langGidx, sidx);
    }
    
    private defNode(idx: number) {
        const uid = this.uid(idx);
        //if(getGlobalNode(uid) !== undefined) throw new Error("node exists");
        return ensureGlobalNode(uid);
    }
    private defNamedNode(idx: number, name: string, defNodeTypeWithName: NodeType) {
        const nodeDef = this.defNode(idx);
        this.langHeap.createNode(defNodeTypeWithName, [name], nodeDef.uid);
        return nodeDef;
    }
    // private createStructureMember(parentDef: INodeRef, idx: number, name: string) {
    //     const origChangeMap = globalState.changeMap;
    //     globalState.setupEditMode();
    //     const member = this.defNamedNode(idx, name, structureMemberNodeTypeWithName);
    //     parentDef.write.insertLast(conceptOrTraitDefMembersDef, member, t0childNodeType);
    //     globalState.changeMap = origChangeMap;
    //     return member;
    // }

    private createNodeLikeTypedMember(parentDef: INodeRef, typeNodeType: NodeType, conceptDef: INodeRef,
          idx: number, name: string) {
        const origChangeMap = globalState.changeMap;
        globalState.setupEditMode();

        const member = this.defNamedNode(idx, name, structureMemberNodeTypeWithName);
        parentDef.write.insertLast(conceptOrTraitDefMembersDef, member, t0childNodeType);
        const type = this.langHeap.createNode(typeNodeType);
        member.write.setChild(structureMemberTypeDef, type.me, t0childNodeType);
        type.setField(ofConceptFieldDef, conceptDef, t0uaNodeRefType);

        globalState.changeMap = origChangeMap;
        return member;
    }
    private createFieldMember(parentDef: INodeRef, typeNodeType: NodeType, idx: number, name: string) {
        const origChangeMap = globalState.changeMap;
        globalState.setupEditMode();

        const member = this.defNamedNode(idx, name, structureMemberNodeTypeWithName);
        parentDef.write.insertLast(conceptOrTraitDefMembersDef, member, t0childNodeType);
        const type = this.langHeap.createNode(typeNodeType);
        member.write.setChild(structureMemberTypeDef, type.me, t0childNodeType);

        globalState.changeMap = origChangeMap;
        return member;
    }

    newConceptDefNode(idx: number, name: string) {
        const origChangeMap = globalState.changeMap;
        globalState.setupEditMode();
        const newConcept = this.defNamedNode(idx, name, conceptDefNodeTypeWithName)
        this.root.insertLast(langDefinitionsMemberDef, newConcept, t0childNodeType);
        globalState.changeMap = origChangeMap;
        return newConcept;
    }
    newTraitDefNode(idx: number, name: string) {
        const origChangeMap = globalState.changeMap;
        globalState.setupEditMode();
        const newTrait = this.defNamedNode(idx, name, traitDefNodeTypeWithName)
        this.root.insertLast(langDefinitionsMemberDef, newTrait, t0childNodeType);
        globalState.changeMap = origChangeMap;
        return newTrait;
    }
    intFieldAccessor(parentDef: INodeRef, idx: number, name: string, isOptional: boolean = false) {
        const member = this.createFieldMember(parentDef, getNodeType(integerTypeDef), idx, name);
        this.setIsOptional(isOptional, member);
        return new FieldAccessor<number>(member, t0int32Type)
    }
    doubleFieldAccessor(parentDef: INodeRef, idx: number, name: string, isOptional: boolean = false) {
        const member = this.createFieldMember(parentDef, getNodeType(doubleTypeDef), idx, name);
        this.setIsOptional(isOptional, member);
        return new FieldAccessor<number>(member, t0doubleType)
    }
    stringFieldAccessor<S extends string>(parentDef: INodeRef, idx: number, name: string, isOptional: boolean = false) {
        const member = this.createFieldMember(parentDef, getNodeType(stringTypeDef), idx, name);
        this.setIsOptional(isOptional, member);
        return new FieldAccessor<S>(member, t0stringType)
    }
    boolFieldAccessor(parentDef: INodeRef, idx: number, name: string, isOptional: boolean = false) {
        const member = this.createFieldMember(parentDef, getNodeType(boolTypeDef), idx, name);
        this.setIsOptional(isOptional, member);
        return new FieldAccessor<boolean>(member, t0boolType)
    }
    refFieldAccessor(parentDef: INodeRef, ofConceptDef: INodeRef, idx: number, name: string, isOptional: boolean = false) {
        const nodeType = getNodeType(nodeRefTypeDef);
        const member = this.createNodeLikeTypedMember(parentDef, nodeType, ofConceptDef, idx, name);
        this.setIsOptional(isOptional, member);
        return new FieldAccessor<INodeRef>(member, t0uaNodeRefType)
    }
    private setIsOptional(isOptional: boolean, member: INodeRef) {
        if (isOptional) {
            const origChangeMap = globalState.changeMap;
            globalState.setupEditMode();
            member.read.getFirstChild(structureMemberTypeDef)!
                .write.setField(conceptMemberTypeIsOptionalFieldDef, true, t0boolType);
            globalState.changeMap = origChangeMap;
        }
    }

    childAccessor(parentDef: INodeRef, ofConceptDef: INodeRef, idx: number, name: string, isOptional: boolean = false) {
        const nodeType = getNodeType(singleChildTypeDef);
        const member = this.createNodeLikeTypedMember(parentDef, nodeType, ofConceptDef, idx, name);
        this.setIsOptional(isOptional, member);
        return new ChildAccessor(member, t0childNodeType)
    }
    childrenAccessor(parentDef: INodeRef, ofConceptDef: INodeRef, idx: number, name: string, atLeastOne: boolean = false) {
        const nodeType = getNodeType(childrenTypeDef);
        const member = this.createNodeLikeTypedMember(parentDef, nodeType, ofConceptDef, idx, name);
        this.setIsOptional(!atLeastOne, member);
        return new ChildrenAccessor(member, t0childNodeType)
        //return new ChildrenAccessor(this.createStructureMember(parentDef, idx, name), t0childNodeType)
    }

    subTypeAsMember(parentDef: INodeRef, childDef: INodeRef) {
        const origChangeMap = globalState.changeMap;
        globalState.setupEditMode();
        childDef.write.detach();
        parentDef.write.insertLast(conceptOrTraitDefMembersDef, childDef, t0childNodeType);
        globalState.changeMap = origChangeMap;
    }

    hasTrait(parentDef: INodeRef, traitDef: INodeRef) {
        const origChangeMap = globalState.changeMap;
        globalState.setupEditMode();
        const traitRef = this.langHeap.createNode(getNodeType(traitRefDef));
        traitRef.setField(traitRefTraitFieldDef, traitDef, t0uaNodeRefType);
        parentDef.write.insertLast(conceptOrTraitDefTraitsDef, traitRef.me, t0childNodeType);
        globalState.changeMap = origChangeMap;
    }
}


export interface IConcept {
    readonly def: INodeRef
    //nodeType: NodeType;
}

export class BaseConcept implements IConcept {
    nodeType: NodeType;
    constructor(readonly def: INodeRef) {
        this.nodeType = getNodeType(def);
        //register concept
        conceptSet.add(globalState.conceptMap, this);
    }
    static new(heap: Heap): IWriteNode {
        return heap.createNode(this.Def.nodeType);
    }
    static Def = new BaseConcept(baseConceptDef);
}


//TODO: - out-of heap nodes, without IDs


export function nodeComputedValue<T>(compute: (this: INodeRef) => T) {
    let nodeMap = new Map<INodeRef, NodeComputedValue>();

    class NodeComputedValue extends ComputedValue<T, INodeRef> {
        onBecomeUtracked() {
            super.onBecomeUtracked();
            nodeMap.delete(this.scope);
        }
    }
    NodeComputedValue.prototype.derivation = compute;

    return function get(node: INodeRef) {
        let cv = nodeMap.get(node);
        if(!cv) {
            if(!globalState.trackingDerivation) return compute.call(node);
            nodeMap.set(node, cv = new NodeComputedValue(node));
        }
        return cv.get();
    };
}
