import { type NodeType } from "./type";
import {
    Node, type INodeRef, ensureGlobalNode,
    addHeapRoot, type IWriteNodeInternal, type IWriteNode, createNode, type FieldValue
} from "./node";
import * as utils from "./utils";
import { globalState, type IChangeMap, type IHeapContext } from "./mx/globalstate";

export const heapSet = new utils.ArraySetImplementation<number, Heap>(
    (gidx: number, b: Heap) => gidx === b.gidx,
    (gidx: number) => gidx | 0,
    (heap: Heap) => heap.gidx | 0,
    (gidx: number) => new Heap(gidx)
);

interface IHeapContextKey {
    heap: IHeap;
    changeMap: IChangeMap;
}

const heapContextSet = new utils.ArraySetImplementation<IHeapContextKey, HeapContext>(
    (key: IHeapContextKey, value: HeapContext) => key.changeMap === value.changeMap,
    (key: IHeapContextKey) => key.changeMap._hashCode,
    (value: HeapContext) => value.changeMap._hashCode,
    (key: IHeapContextKey) => new HeapContext(key.heap, key.changeMap)
);

export function ensureHeap(gidx: number) {
    return heapSet.add(globalState.heapMap, gidx);
}

export interface IHeap {
    getHeapContext(changeMap: IChangeMap): IHeapContext;
    readonly gidx: number;
    readonly root: INodeRef;
    // readonly nodeTypes: utils.ArraySet<NodeType>;        
    readonly fragments: IWriteNodeInternal[];
    // getNodeType(def: INodeRef, fields: FieldDef[]): NodeType;
    // getNodeTypeWithInsert(nodeType: NodeType, fieldUid: utils.Uid, fieldType: IType, index: number): NodeType;
    // getNodeTypeWithUpdate(nodeType: NodeType, newFieldType: IType, index: number): NodeType;
    // getNodeTypeWithRemove(nodeType: NodeType, index: number): NodeType;
}

// Heap and MemUnit are merged for now
export class Heap implements IHeap {
    readonly gidx: number;
    readonly root: INodeRef;
    // NOTE: a Node can be a fragment of more Heap-s (even more times) but, a NodeRecord can be fragment of precicely one heap
    readonly fragments: Node[] = [];
    //readonly nodeTypes: utils.ArraySet<NodeType> = [];    
    //readonly nodeFieldInserts: utils.ArraySet<NodeFieldInsert> = [];

    //private nodeTypeKey: INodeTypeKey;
    private heapContexts: utils.ArraySet<HeapContext> = [];
    private heapContextKey: IHeapContextKey;
    private lastUid: utils.Uid;
    private lastHeapContext: HeapContext;


    /*internal*/constructor(gidx: number) {
        //TODO: maybe disentangle creation from globalState ?
        this.gidx = gidx;
        //heapSet.add(globalState.heapMap, this, true);
        const root = ensureGlobalNode(utils.makeUid(gidx, 0));
        if (root.hasRecord) {
            //TODO: a better guarantee of not re-using a heap's root
            throw new Error("New heap's root already has some content.");
        }
        addHeapRoot(root);
        this.root = root;
        this.heapContextKey = {
            heap: this,
            changeMap: undefined!
        }
        this.lastHeapContext = this.getHeapContext(globalState.baseChangeMap);
        this.lastUid = root.uid;
    }
    setLastUid(lastUid: utils.Uid) {
        this.lastUid = lastUid;
    }
    getNextUid(): utils.Uid {
        let uid = this.lastUid + 1;
        this.lastUid = utils.getSidx(uid) <= utils.maxSidx
            ? uid
            : utils.makeUid(globalState.guidMap.newGidx(), 0);
        return uid;
    }

    getHeapContext(changeMap: IChangeMap): IHeapContext {
        const key = this.heapContextKey;
        key.changeMap = changeMap;
        return heapContextSet.add(this.heapContexts, key);
    }

    createNode(
        nodeType: NodeType,
        content?: FieldValue[],
        uid: utils.Uid = this.getNextUid(),
        changeMap: IChangeMap = globalState.changeMap
    ): IWriteNode {
        let heapContext = this.lastHeapContext;
        if (heapContext.changeMap !== changeMap) {
            this.lastHeapContext = heapContext = this.getHeapContext(changeMap);
        }
        return createNode(uid, nodeType, heapContext, content);
    }

}

class HeapContext implements IHeapContext {
    //_hashCode: number;
    readonly createdNodes: Node[] = [];
    readonly heap: IHeap;
    readonly changeMap: IChangeMap;

    constructor(heap: IHeap, changeMap: IChangeMap) {
        this.heap = heap;
        this.changeMap = changeMap;
        //this._hashCode = utils.combineHashCodes(heap.gidx, changeMap._hashCode);
    }

    toString() {
        return `(changeMap:${this.changeMap}, heap:${this.heap})`;
    }
}