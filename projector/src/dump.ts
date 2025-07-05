import { type IHeap } from "./heap";
import { type IChangeMap, globalState } from "./mx/globalstate";
import { ArraySetImplementation, type ArraySet, getGidx, getSidx, type Uid } from "./utils";
import { NodeType, typeEquals, TypeKind, RefType, RefKind, PrimitiveType, PrimitiveKind } from "./type";
import { type INodeRefInternal, type INodeRef, type IReadNodeInternal, type ContentValue } from "./node";
import { isAtomValue } from "./mx/atom";

const dumpNodeTypeSet = new ArraySetImplementation<NodeType, NodeType>(
    (key: NodeType, value: NodeType) => typeEquals(key, value),
    (key: NodeType) => key._hashCode,
    (value: NodeType) => value._hashCode,
    (key: NodeType) => key
);

export const DumpTypeKind = {
    Unsupported: 0, Bool: 1, Int32: 2, Double: 3, String: 4, UaNodeRef: 5, ChildNode: 6
} as const;
export type DumpTypeKind = typeof DumpTypeKind[keyof typeof DumpTypeKind];

export class HeapDump {
    readonly nodeTypes: ArraySet<NodeType> = [];
    readonly types: any[] = [];
    readonly nodeRefs: ArraySet<INodeRefInternal> = [];
    //readonly guidMap: GuidMap = new GuidMap();
    readonly guidIndexes: { [gidx: number]: number } = {};
    readonly guids: string[] = [];
    readonly result: any[] = [];
    readonly heap: IHeap;
    readonly changeMap: IChangeMap;

    constructor(heap: IHeap, changeMap: IChangeMap) {
        this.heap = heap;
        this.changeMap = changeMap;
    }

    dump(): any[] {
        // "v1", [guids], [types], heap.gidx
        const result = this.result;
        result.push("v1");
        result.push(this.guids);
        result.push(this.types);
        this.rememberGuid(this.heap.gidx); // 0. guid is the heap's guid
        //fragments
        //const root = (this.heap.root as INodeRefInternal).readNode(this.changeMap, true);
        //root && this.dumpNode(root); //there can be no root
        const fragments = this.heap.fragments;
        const changeMap = this.changeMap;
        const fragmentLenIdx = result.length;
        result.push(0);
        for (const fragment of fragments) {
            //const readFragment = fragment.me.readNode(changeMap, true);
            if (fragment._heapContext!.changeMap === changeMap || fragment.me.readNode(changeMap, true) === fragment) {
                this.dumpNode(fragment);
                result[fragmentLenIdx]++;
            }
        }
        return this.result;
    }
    private dumpNode(node: IReadNodeInternal) {
        //0. type
        //const node = nodeRef.readNode(this.changeMap, true);
        //if(node === undefined) return undefined;
        const type = node._type!;
        dumpNodeTypeSet.add(this.nodeTypes, type);
        if (dumpNodeTypeSet.wasCreated) {
            this.dumpNodeType(type);
        }
        const typeIndex = dumpNodeTypeSet.lastIndex;
        const result = this.result;
        result.push(typeIndex);

        //1. values
        const content = node._content!;
        const fields = type.fields;
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            switch (field.type.kind) {
                //case TypeKind.ChildNode: continue;
                case TypeKind.Ref:
                    this.dumpUid((rawValue(content[i]) as INodeRef).uid, result);
                    break;
                case TypeKind.Primitive:
                case TypeKind.String:
                    result.push(rawValue(content[i]));
            }
        }

        //2. children: (children.length, child*)
        const changeMap = this.changeMap;
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            if (field.type.kind !== TypeKind.ChildNode) continue;
            // children.length
            const childLenIdx = result.length;
            result.push(0);
            let childRef = rawValue(content[i]) as INodeRefInternal | undefined;
            do {
                //child
                // if(!childRef?.readNode) {
                //     console.warn("ha");
                // }
                const child = childRef!.readNode(changeMap, false)!;
                this.dumpNode(child);
                result[childLenIdx]++;
                childRef = child._next;
            } while (childRef !== undefined);
        }
        return node._next;
    }
    private dumpNodeType(type: NodeType) {
        //0. uid
        const def = type.def;
        const types = this.types;
        this.dumpUid(def.uid, types);
        //1. fields.length
        const fields = type.fields;
        this.types.push(fields.length);
        //2. fields: (fieldUid, field-dump-kind) * length
        for (const field of fields) {
            //field.uid
            this.dumpUid(field.uid, types);
            //field dump kind
            const fieldType = field.type;
            let dumpKind: DumpTypeKind | undefined;
            switch (fieldType.kind) {
                case TypeKind.Primitive:
                    switch ((fieldType as PrimitiveType).primitiveKind) {
                        case PrimitiveKind.Bool:
                            dumpKind = DumpTypeKind.Bool;
                            break;
                        case PrimitiveKind.Int32:
                            dumpKind = DumpTypeKind.Int32;
                            break;
                        case PrimitiveKind.Double:
                            dumpKind = DumpTypeKind.Double;
                            break;
                    }
                    break;
                case TypeKind.String:
                    dumpKind = DumpTypeKind.String;
                    break;
                case TypeKind.Ref:
                    if ((fieldType as RefType).refKind === RefKind.UaNode) {
                        dumpKind = DumpTypeKind.UaNodeRef;
                    }
                    break;
                case TypeKind.ChildNode:
                    dumpKind = DumpTypeKind.ChildNode;
                    break;
            }
            if (dumpKind === undefined) {
                throw new Error(`Unsupported field type:${fieldType}`);
            }
            types.push(dumpKind);
        }
    }
    private dumpUid(uid: Uid, dumpArray: any[]) {
        //(gifx, sidx)
        this.dumpGidx(getGidx(uid), dumpArray);
        dumpArray.push(getSidx(uid));
    }

    private dumpGidx(gidx: number, dumpArray: any[]) {
        const dumpGidx = this.rememberGuid(gidx);
        dumpArray.push(dumpGidx);
    }

    private rememberGuid(gidx: number) {
        let dumpGidx = this.guidIndexes[gidx];
        if (dumpGidx === undefined) {
            dumpGidx = this.guids.length;
            this.guidIndexes[gidx] = dumpGidx;
            this.guids.push(globalState.guidMap.gidxToString(gidx));
        }
        return dumpGidx;
    }
}

export function dumpHeap(heap: IHeap, changeMap: IChangeMap) {
    const dump = new HeapDump(heap, changeMap);
    return dump.dump();
}

function rawValue(v: ContentValue) {
    return isAtomValue(v) ? v.getUntracked() : v;
}