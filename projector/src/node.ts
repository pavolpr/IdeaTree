import { NodeType, IType, TypeKind, typeEquals, getNodeType } from "./type";
import { Atom, AtomValue, isAtomValue, IAtomValue, IAtom } from './mx/atom';
import { globalState, IChangeMap, ensureCanMutate, IHeapContext } from './mx/globalstate';
import { startBatch, endBatch } from "./mx/source";
import * as utils from "./utils";
import { Uid } from "./utils";


export interface INodeRef {
    readonly uid: number;
    readonly hasRecord: boolean;
    readonly read: IReadNode;
    readonly write: IWriteNode;
    // readonly isRecord: boolean;
    readNode(changeMap?: IChangeMap, canUnresolve?: boolean): IReadNode | undefined;
    writeNode(editableHeapContext?: IHeapContext, canUnresolve?: boolean): IWriteNode | undefined;
}

export interface INodeRefInternal extends INodeRef {
    readonly _me: Uid | INodeRefInternal; //Uid when primary Node, the primary node otherwise
    //readonly _type?: NodeType;
    readonly _nextVer?: IWriteNodeInternal; // MVCC for other changeMap-s
    
    findVersion(editableHeapContext: IHeapContext): IWriteNodeInternal | undefined;
    readNode(changeMap?: IChangeMap, canUnresolve?: boolean): IReadNodeInternal | undefined;
    writeNode(editableHeapContext?: IHeapContext, canUnresolve?: boolean): IWriteNodeInternal | undefined;
    makeWrite(readNode: IReadNodeInternal, editableHeapContext: IHeapContext): IWriteNodeInternal;
}
export interface IReadNode {
    readonly me: INodeRef;
    readonly uid: number;
    readonly type: NodeType;
    readonly def: INodeRef;
    readonly parent?: INodeRef;
    readonly role?: INodeRef;
    readonly prev?: INodeRef;
    readonly next?: INodeRef;
    
    getField(field: INodeRef, isChild?: boolean): FieldValue | undefined;
    getFieldAt(index: number): FieldValue;
    getFirstChild(field: INodeRef): INodeRef | undefined;
}

export interface IReadNodeInternal extends IReadNode, IAtom {
    readonly _me: Uid | INodeRefInternal; //Uid when primary Node, the primary node otherwise
    
    readonly _heapContext?: IHeapContext;
    readonly _nextVer?: IWriteNodeInternal; // MVCC for other changeMap-s

    readonly _type?: NodeType;
    
    readonly _parent: ParentNodeInternal;
    readonly _role?: INodeRefInternal;

    readonly _prev?: INodeRefInternal; // TODO: may be in _content, to save space in leafs
    readonly _next?: INodeRefInternal; // TODO: may be in _content, to save space in leafs

    //maybe undefined when no fields, otherwise all slots must have a value (!==undefined)
    readonly _content?: ContentValue[];
}

export interface IWriteNode extends IReadNode {
    setDef(def: INodeRef): boolean;
    
    setField(field: INodeRef, value: FieldValue, fieldType: IType): boolean;
    removeField(field: INodeRef): FieldValue | undefined;
    
    setChild(field: INodeRef, child: INodeRef, fieldType: IType): IWriteNode;
    removeChildren(field: INodeRef): number;
    
    insertLast(field: INodeRef, child: INodeRef, fieldType: IType): void;
    insertFirst(field: INodeRef, child: INodeRef, fieldType: IType): void;
    insertAfter(anchor: INodeRef): void;
    insertBefore(anchor: INodeRef): void;
    
    detach(): boolean;
}

export interface IWriteNodeInternal extends IWriteNode, IAtom {
    _me: Uid | INodeRefInternal; //Uid when primary Node, the primary node otherwise
    
    _heapContext?: IHeapContext;
    _nextVer?: IWriteNodeInternal; // MVCC for other changeMap-s

    _type?: NodeType;
    
    _parent: ParentNodeInternal;
    _role?: INodeRefInternal;

    _prev?: INodeRefInternal; // TODO: may be in _content, to save space in leafs
    _next?: INodeRefInternal; // TODO: may be in _content, to save space in leafs

    //maybe undefined when no fields, otherwise all slots must have a value (!==undefined)
    _content?: ContentValue[];

    ensureEditableHeapContext(): IHeapContext;
    setChild(field: INodeRefInternal, child: INodeRefInternal, fieldType: IType): IWriteNodeInternal;
    insertLast(field: INodeRef, child: INodeRefInternal, fieldType: IType): void;
    insertFirst(field: INodeRef, child: INodeRefInternal, fieldType: IType): void;
    removeFieldInternal(field: INodeRefInternal, mustNotBeChild: boolean, editableHeapContext: IHeapContext): FieldValue | undefined;
    resetFirstChild(field: INodeRefInternal, child: INodeRefInternal): void;
    removeFromFragments(parent: number, heapContext: IHeapContext): void;
}

export function isHeapRoot(node: INodeRef) {
    const uid = node.uid;
    return utils.getSidx(uid) === 0 && nodeSetByUid.get(globalState.heapRoots, uid) !== undefined;
}

export const nodeSetByNodeRef = new utils.ArraySetImplementation<INodeRefInternal, INodeRefInternal>(
    (key: INodeRefInternal, value: INodeRefInternal) => key._me === value._me, //_me should be always number here
    (key: INodeRefInternal) => key._me as number | 0,
    (node: INodeRefInternal) => node._me as number | 0,
    (key: INodeRefInternal) => key
);

export function addHeapRoot(node: INodeRef) {
    nodeSetByNodeRef.add(globalState.heapRoots, node as INodeRefInternal, true);
}

export const nodeSetByUid = new utils.ArraySetImplementation<utils.Uid, INodeRefInternal>(
    (uid: utils.Uid, inode: INodeRefInternal) => uid === inode._me as number, //_me should be always number here
    (uid: utils.Uid) => uid | 0,
    (node: INodeRefInternal) => node._me as number | 0,
    (uid: utils.Uid) => new Node(uid)
);

export function ensureGlobalNode(uid: utils.Uid): INodeRef {
    return nodeSetByUid.add(globalState.nodeMap, uid);
}

export function getGlobalNode(uid: utils.Uid): INodeRef | undefined {
    return nodeSetByUid.get(globalState.nodeMap, uid);
}

// export function addGlobalNode(node: Node): Node {
//     return nodeSet.add(globalState.nodeMap, node);
// }

export interface INodeKey { 
    me: Uid | INodeRefInternal;
    heapContext: IHeapContext;
    nextVer: IWriteNodeInternal | undefined;
    nodeType: NodeType;
    content?: ContentValue[];
    parent: ParentNodeInternal | undefined;
    newNode(): Node; 
}

const _nodeKey: INodeKey = {
    me: 0,
    heapContext: undefined!,
    nextVer: undefined!,
    nodeType: undefined!,
    content: undefined!,
    parent: undefined!,
    newNode() {
        const heapContext = this.heapContext;
        let parent = this.parent;
        let fragments;
        if(parent === undefined || typeof parent === "number") {
            fragments = heapContext.heap.fragments;
            if(parent === undefined) parent = fragments.length;
        }
        //TODO: validate content elements against noteType
        const node = new Node(this.me, heapContext, this.nextVer, this.nodeType, this.content, parent);
        if(heapContext.changeMap.isEditable) {
            heapContext.createdNodes.push(node);
        }
        if(fragments !== undefined) {
            fragments[parent as number] = node;
        }
        return node;
    }
};

export const nodeSet = new utils.ArraySetImplementation<INodeKey, INodeRefInternal>(
    (key: INodeKey, b: INodeRefInternal) => key.me === b._me, //me and _me should be always number here
    (key: INodeKey) => key.me as number | 0, //me should be always number here
    (node: INodeRefInternal) => node._me as number | 0, //_me should be always number here
    (key: INodeKey) => key.newNode()
);

export function newFreeNode(nodeType: NodeType, uid?: utils.Uid, content?: FieldValue[]): IWriteNode {
    //TODO: auto uid, or lazy uid when attached to a heap
    //TODO: uid == 0 meaning a free node
    //TODO: parent will be undefined -> exception here
    return new Node(uid || 0, undefined, undefined, nodeType, content);
}

export function createNode(
    uid: utils.Uid, nodeType: NodeType, heapContext: IHeapContext, 
    content?: FieldValue[]
): IWriteNode/*Internal*/ {
    //if (changeMap === undefined) changeMap = globalState.changeMap;
    // if(parent !== undefined && isHeapRoot(this)) {
    //     throw new Error(`Trying to set parent to a heap root node:${this}`);
    // }
    //const fragments = nodeType.heap.fragments;
    if (content === undefined ? nodeType.fields.length > 0
        : content.length !== nodeType.fields.length)
        throw new Error("Given content and recordType has different lengths.");
    
    if(content !== undefined) {
        //NOTE: this is a defensive check, we can possibly skip it if we are sure
        for(let i = 0; i < content.length; i++) {
            const value = content[i];
            if(value === undefined || isAtomValue(value))
                throw new Error(`Undefined or atomValue field values are not allowed, at i=${i}.`);
            //TODO: check types and "childreness"  as well
        }
    }
    const key = _nodeKey;
    key.me = uid;
    key.heapContext = heapContext;
    key.nextVer = undefined;
    key.nodeType = nodeType;
    key.content = content;
    key.parent = undefined; //will become fragments.length;
    //new Node(uid, changeMap, undefined, nodeType, content, fragments.length);
    const me = nodeSet.add(globalState.nodeMap, key) as Node;
    if(nodeSet.wasCreated) {
        return me; // fast path for freshly created nodes
    }
    //INVARIANTs: 
    // _nextVer chain has the base (may be preceded by other non-base nodes) or "unresolved" (a sole one) node at the end
    // there can be at most one node of any changeMap
    // "unresolved" node has undefined _heapContext, _type, and _parent
    // "unresolved" node it is the only one in the _nextVer chain
    const changeMap = heapContext.changeMap;
    let node;
    let h = me;
    for (;;) {
        const hHeapCtx = h._heapContext;
        //const hChangeMap = h. _changeMap;
        if(hHeapCtx === undefined || hHeapCtx.changeMap === changeMap || hHeapCtx.changeMap.isBase) {
            if(h._type !== undefined) {
                if(hHeapCtx!.changeMap === changeMap) //hHeapCtx must be defined when _type is defined
                    throw new Error(`Record already exists h:${h}, changeMap:${changeMap}`);
                // h is has base changeMap, it must be at the end of the chain
                // the new changeMap is not the base
                if(h._nextVer !== undefined)
                    throw new Error(`Unexpected next record after a base record (create).`);
                if(h !== me) {
                    //we can append after me - me has another non-base changeMap
                    key.me = me;
                    key.nextVer = me._nextVer;
                    node = key.newNode();
                    me._nextVer = node;
                    return node;
                }
                //me has base changeMap, we must exchange it with the node
                key.me = h; //== me
                // exchange me <-> node

                key.heapContext = hHeapCtx!; //hHeapCtx must be defined when _type is defined
                key.nodeType = h._type;
                key.content = h._content;
                key.parent = h._parent;
                //TODO: check what happens when hHeapCtx is editable - the base h node is pushed to createdNodes
                node = key.newNode();
                // if(typeof key.parent === "number") {
                //     const hFragments = key.nodeType.heap.fragments;
                //     hFragments[key.parent] = node; // exchgange with h
                // }
                node._role = h._role;
                node._prev = h._prev;
                node._next = h._next;
                h._nextVer = node;
                h.replaceWith(node); //THINK more if we need this at all
                //h.changeMap = changeMap;
                //h._type = nodeType;
                //h._content = content;
                //h._parent = fragments.length;
                //fragments.push(h);
                //h._role = undefined;
                //h._prev = undefined;
                //h._next = undefined;
                //h.reportChanged();
                //return h; //me
            } //else -> h is unresolved -> copy to, ... the node is wasted, corner case?
            //h.initFrom(node);
            h._heapContext = heapContext;
            h._type = nodeType;
            h._content = content;
            h._role = undefined;
            h._prev = undefined;
            h._next = undefined;
            const fragments = heapContext.heap.fragments;
            h._parent = fragments.length;//node._parent;
            fragments.push(h); // the fragment has become a record
            (node ? node : h).reportChanged(); //notify that re-read is needed to rebind sources
            // tslint:disable-next-line:no-unused-expression
            //node && node.reportChanged(); //for the case h.replaceWith(node);
            if(changeMap.isEditable) {
                heapContext.createdNodes.push(h); //TODO: chack correctness of createdNodes; key.newNode() does the same
            }
            return h;
        }
        const next = h._nextVer as Node;
        if(next === undefined) {
            //the last h, append after it
            //changeMap of the new node is not present in the chain (it can be base or not)
            //there is no node with base changeMap or "unresolved" node in the chain, only some nodes with other non-base changeMap
            key.me = me;
            node = key.newNode();
            h._nextVer = node;
            return node;
        }
        h = next;
    }
}

// interface IHeaderInternal  {
//     nextHeader?: INodeRecordHeader;
// }

// export interface INodeRecordHeader extends IAtom, IHeaderInternal {
//     readonly isRecord: boolean;
//     //readonly ref: INodeRef;
//     readonly changeMap: IChangeMap;
//     readonly nextHeader?: INodeRecordHeader;
// }

// export interface INodeRecord extends INodeRecordHeader {
//     //*** "node" part
//     //readonly ref: INodeRef;
//     readonly type?: NodeType;
//     readonly def?: INode;
//     readonly parent: ParentNode;
//     readonly role?: INode;

//     //can be null for detached nodes and MemRepo
//     //readonly memUnit: INodeRef;

//     readonly prev?: INode;
//     readonly next?: INode;
// }

export type FieldValue = number | boolean | string | INodeRef;
export type ContentValue = FieldValue | IAtomValue<FieldValue>;

// export class NodeRecordHeader extends Atom implements INodeRecordHeader {
//     isRecord: boolean;
//     //ref: INodeRef;
//     constructor(
//         public changeMap: IChangeMap,
//         public nextHeader?: INodeRecordHeader // MVCC for other changeMap-s
//     ) { 
//         super();
//     }
// }
// NodeRecordHeader.prototype.isRecord = false;

export type ParentNode = INodeRef | number;
type ParentNodeInternal = INodeRefInternal | number;
export class Node extends Atom implements INodeRefInternal, IReadNodeInternal, IWriteNodeInternal {
    ///*readonly*/ isRecord: boolean; //set in prototype
    get hasRecord(): boolean { return this._type !== undefined; }
    get read(): IReadNodeInternal { return this.readNode()!; }
    get write(): IWriteNodeInternal { return this.writeNode()!; }

    //ref: INodeRef;
    //TODO: can be merged with _nextVer; e.g. Uid | { _me, _nextVer } OR  Uid | [Uid, ver2, ver3] | _me
    /*internal*/_me: Uid | INodeRefInternal; //Uid when primary Node, the primary node otherwise
    // hashCode() { 
    //     const me = this._me;
    //     return (typeof me === "number") ? me | 0 : me._me as number | 0; 
    // }

    //TODO: can be merged with _type to { _type, _heap, changeMap } as _context
    /*internal*/_heapContext?: IHeapContext;
    ///*internal*/nextHeader?: INodeRecordHeader; // MVCC for other changeMap-s
    /*internal*/_nextVer?: Node; // MVCC for other changeMap-s

    /*internal*/_type?: NodeType;
    //memUnit: INodeRef; //from nodeType
    
    /*internal*/_parent: ParentNodeInternal;
    /*internal*/_role?: INodeRefInternal; //this could be part of _type or _context

    /*internal*/_prev?: INodeRefInternal; // TODO: may be in _content, to save space in leafs
    /*internal*/_next?: INodeRefInternal; // TODO: may be in _content, to save space in leafs

    //maybe undefined when no fields, otherwise all slots must have a value (!==undefined)
    /*internal*/_content?: ContentValue[];
    
    get me() { const me = this._me; return typeof me === "number" ? this as INodeRefInternal : me; }
    get uid() { const me = this._me; return typeof me === "number" ? me : me._me as number; }
    
    get type() { this.reportRead(); return this._type!; }
    get def()  { this.reportRead(); return this._type!.def; } //(this._type && this._type.def)!; }
    get parent() { 
        this.reportRead(); 
        const parent = this._parent; 
        return typeof parent === "number" ? undefined : parent;
    }
    get role() { this.reportRead(); return this._role; }
    get prev() { this.reportRead(); return this._prev; }
    get next() { this.reportRead(); return this._next; }
    
    /*internal*/constructor(
        me: number | INodeRefInternal,
        heapContext?: IHeapContext, nextVer?: IWriteNodeInternal, 
        nodeType?: NodeType, content?: ContentValue[],
        parent?: ParentNodeInternal, role?: INodeRefInternal, //memUnit?: INodeRef,
        prev?: INodeRefInternal, next?: INodeRefInternal
    ) {
        super();
        this._me = me;
        this._heapContext = heapContext;
        this._nextVer = nextVer as Node;
        if(nodeType !== undefined) {
            if(parent === undefined)
                throw new Error(`Expected a parent.`);
        } else if(parent !== undefined || role !== undefined || prev !== undefined || next !== undefined) {
            throw new Error(`Expected parent, role, prev and next to be undefined when nodeType is undefined.`);
        }
        this._type = nodeType;
        this._content = content;
        this._parent = parent!;
        this._role = role;
        this._prev = prev;
        this._next = next;
        // all the rest members are undefined ... we have a different hidden class for "headers"
        // TODO: measure if we should set them
    }

    findVersion(editableHeapContext: IHeapContext): IWriteNodeInternal | undefined {
        // the last one must be base change map
        let h: IWriteNodeInternal | undefined = this;
        do {
            if(h._heapContext === editableHeapContext) 
                return h;
            h = h._nextVer;
        } while(h !== undefined);
        return h;
    }
    
    readNode(this: INodeRefInternal, changeMap?: IChangeMap, canUnresolve?: boolean): IReadNodeInternal | undefined {
        if (changeMap === undefined) changeMap = globalState.changeMap;
        
        //const h = this.me.findVersion(changeMap);
        const me = this; //.me;
        let record = me as Node;
        for (;;) {
            const recordChangeMap = record._heapContext?.changeMap;
            if(recordChangeMap === changeMap || recordChangeMap === undefined || recordChangeMap.isBase) {
                // NOTE: we are not reportRead() when a record is acquired
                //  it will be done on the record level ?
                // THINK: can a record "come back" to non-existence ?
                //        specially, when observed ?
                // we will not reportRead() just for record retrieval when it exists
                // the user code can do that if the existence is the only reason why it was read
                if (record._type !== undefined /*isRecord*/) 
                    return record;
                record.reportRead(); //track when the record will start to exist
                break;
            }
            const next = record._nextVer;
            if(next === undefined) { 
                // there is no record with changeMap nor base record
                if(globalState.trackingDerivation !== undefined) {
                    //tracking is on, create an "unresolved" record for tracking of all unresolved reads
                    const unresolvedRecord = new Node(me);
                    record._nextVer = unresolvedRecord;
                    unresolvedRecord.reportRead();
                }
                break;                
            }
            record = next;
        }
        if(canUnresolve)
            return undefined;
        throw new Error(`Unresolved read record. uid:${this.uid}, changeMap:${changeMap}`);
    }

    writeNode(this: INodeRefInternal, editableHeapContext?: IHeapContext, canUnresolve?: boolean): IWriteNodeInternal | undefined {
        //const nr = this.readNodeRecord(changeMap);
        //return nr && this.makeEditable(nr, changeMap);
        ensureCanMutate();
        let changeMap = editableHeapContext?.changeMap ?? globalState.changeMap;
        if(!changeMap.isEditable)
            throw new Error('Cannot change a record when the changeMap is not editable.');
        const me = this; //.me;
        let record = me as Node | undefined;
        do {
            const recordHeapContext = record!._heapContext;
            const recordChangeMap = recordHeapContext?.changeMap;
            if(recordChangeMap === changeMap) {
                if(record!._type === undefined)
                    throw new Error(`Unresolved editable node:${this}, changeMap:${changeMap}`);
                if(recordHeapContext !== editableHeapContext && editableHeapContext !== undefined) //defensive check if we are in the same heap
                    throw new Error(`Bad editable context for write-to node:${this}, changeMap:${changeMap}, record-heapContext:${recordHeapContext}, editable-heapContext:${editableHeapContext}`);
                return record;
                //break; //this should not happen; should we throw?
            }
            const nextVer = record!._nextVer;
            if(recordChangeMap === undefined || recordChangeMap.isBase) {
                if(nextVer !== undefined) //consistency check
                    throw new Error(`Unexpected next record after a base record.`);
                if(record!._type !== undefined) {
                    // is base record - resolved - create an editable copy
                    const heapContext = editableHeapContext ?? recordHeapContext!.heap.getHeapContext(changeMap)
                    return (me as Node).baseToWrite(record!, heapContext);
                    // if(me === record) {
                    //     //record is the only one and it is a base record
                    //     //move me to the nextVer
                    //     //NOTE: in case we allow atom values in the base record, this needs to be a real "move" of me._content
                    //     const meClone = record.clone(me, recordChangeMap /*===me.changeMap*/, undefined);
                    //     // const meClone = new NodeRecord(me, me.changeMap, undefined,
                    //     //     me._type, content, me._parent, me._role, me._prev, me._next);
                    //     me.changeMap = changeMap; //me has become editable (and non-base)
                    //     me._nextVer = meClone;
                    //     me.replaceWith(meClone); //move also the atom state - possibly not needed at all ?
                    //     meClone.reportChanged(); //notify that re-read is needed to rebind sources - can be done in the replaceWith()
                    //     //me.reportChanged(); //report as if the old me - to trigger rebind of sources - is this enough ??
                    //     return me;
                    // } 
                    // // base record was not me, create an editable clone and prepend after me
                    // const editableRecord = record.clone(me, changeMap, me._nextVer);
                    // me._nextVer = editableRecord;                        
                    // record.reportChanged(); //notify that re-read is needed to rebind sources
                    // return editableRecord; 
                } else {
                    // is unresolved base record
                    break;
                }
            }
            record = nextVer;
        } while(record !== undefined);
        if(canUnresolve)
            return undefined;
        throw new Error(`Unresolved write-to node:${this}, changeMap:${changeMap}`);
    }

    private baseToWrite(baseNode: Node, editableHeapContext: IHeapContext): IWriteNodeInternal {
        //INVARIANT: baseNode.changeMap.isBase === true
        //INVARIANT: this === baseNode.me
        //INVARIANT: baseNode._nextVer === undefined
        //INVARIANT: baseNode._type !== undefined
        if(this === baseNode) {
            //baseNode is the only one and it is a base record
            //move me to the nextVer
            //NOTE: in case we allow atom values in the base record, this needs to be a real "move" of me._content
            //heapContext must be defined, because this._type is defined
            const meClone = baseNode.baseClone(this, this._heapContext!, undefined);
            // const meClone = new NodeRecord(me, me.changeMap, undefined,
            //     me._type, content, me._parent, me._role, me._prev, me._next);
            this._heapContext = editableHeapContext; //me has become editable (and non-base)
            this._nextVer = meClone;
            this.replaceWith(meClone); //move also the atom state - possibly not needed at all ?
            meClone.reportChanged(); //notify that re-read is needed to rebind sources - can be done in the replaceWith()
            //this.reportChanged(); //report as if the old me - to trigger rebind of sources - is this enough ??
            editableHeapContext.createdNodes.push(this);
            return this;
        } 
        // base record was not me, create an editable clone and prepend after me
        const editableNode = baseNode.baseClone(this, editableHeapContext, this._nextVer);
        this._nextVer = editableNode;                        
        baseNode.reportChanged(); //notify that re-read is needed to rebind sources
        editableHeapContext.createdNodes.push(editableNode);
        return editableNode;
    }

    private baseClone(me: Node, heapContext: IHeapContext, nextVer: Node | undefined): Node {
        //INVARIANT: for now, only a node with plain content values is allowed to be cloned - checked in ctor
        //INVARIANT: this._type !== undefined
        //INVARIANT: this.changeMap.isBase === true
        const type = this._type!;
        // if(type === undefined)
        //     return new Node(me, changeMap, nextVer);
        let parent = this._parent;
        let fragments;
        if(typeof parent === 'number') {
            // this is a fragment, add the clone to the same fragments, too
            fragments = heapContext.heap.fragments;
            parent = fragments.length;
        }
        //check on atom values - for consistency
        const clonedContent = this._content && this._content.slice();
        if(clonedContent) {
            for(const value in clonedContent) {
                if(isAtomValue(value))
                    throw new Error(`Found an atom value in baseClone()`);
            }
        }
        const node = new Node(
            me, heapContext, nextVer,
            type, clonedContent,
            parent, this._role, this._prev, this._next
        );
        if(fragments) fragments.push(node);
        return node;
    }

    makeWrite(readNode: IReadNodeInternal, editableHeapContext: IHeapContext): IWriteNodeInternal {
        //if (changeMap === undefined) changeMap = globalState.changeMap;
        if(!editableHeapContext.changeMap.isEditable)
            throw new Error(`Cannot make editable when changeMap is not editable. node:${readNode}`);
        const rnHeapContext = readNode._heapContext;
        if(rnHeapContext === editableHeapContext) {
            return readNode as IWriteNodeInternal;
        }
        if(!rnHeapContext?.changeMap.isBase) {
            throw new Error(`Incompatible non-base change map in the node record found. node:${readNode}, rnHeapContext:${rnHeapContext}`);
        }
        //inlined return readNode.editableRecord(changeMap, false);
        ensureCanMutate();
        //me = this
        //NOTE: this is dangerous, we should try to ensure there is no editable record yet!
        if(readNode._nextVer !== undefined) //consistency check
            throw new Error(`Unexpected next record after a base record.`);
        if(readNode._type !== undefined) {
            // is base record - resolved - create an editable copy
            return this.baseToWrite(readNode as Node, editableHeapContext);
        } 
        // is unresolved base record - throw
        throw new Error(`Unresolved (make-)editable node:${this}, for editableHeapContext:${editableHeapContext}`);
    }

    ensureEditableHeapContext(): IHeapContext {
        //this.checkCanMutate();
        ensureCanMutate();
        const heapContext = this._heapContext;
        if(!heapContext?.changeMap.isEditable)
            throw new Error('Trying to mutate a record with non-editable change map.');
        if(this._type === undefined)
            throw new Error('Trying to mutate an unresolved record.');
        return heapContext;   
    }
    //get isEditable() { return this.ref.readOnlyRecord !== this; }

    // /*internal*/initFrom(node: Node) {
    //     this.changeMap = node.changeMap;
    //     this._type = node._type;
    //     this._content = node._content;
    //     this._parent = node._parent;
    //     //this._role = node._role;
    //     //this._prev = node._prev;
    //     //this._next = node._next;
        
    // }

    getFirstChild(field: INodeRefInternal): INodeRefInternal | undefined {
        return this.getField(field, true) as INodeRefInternal | undefined;
        // if(child !== undefined && !isNode(child)) {
        //     throw new Error("Expected a node as the field value.");
        // }
        // return child as Node | undefined; //the as is to make karma compiling happy, a bug?
    }

    getField(field: INodeRef, isChild?: boolean): FieldValue | undefined {
        const type = this._type;
        if(type === undefined)
            throw new Error(`Trying to getField() on an unresolved node:${this}`);
        const i = type.getFieldIndex(field.uid);
        // tslint:disable-next-line:no-conditional-assignment
        if (i >= 0 && (!!isChild === (type.fields[i].type.kind === TypeKind.ChildNode))) {
            return this.getFieldAt(i);
            // const content = this._content!;
            // //return this.getFieldImpl(field, i);
            // const value = content[i];
            // if (isAtomValue(value)) {
            //     return value.get(); //fast happy path
            // }
            // //if (value !== undefined) {
            // if(!this.changeMap.isEditable) {
            //     //non-editable records are tracked by this
            //     this.reportRead();
            // } else if(globalState.trackingDerivation !== undefined) {
            //     //only create AtomValue when defined and tracked
            //     //lazily creates AtomValue<T>
            //     const newAtomValue = new AtomValue(value);
            //     content[i] = newAtomValue;
            //     newAtomValue.reportRead();
            // }
            // return value;
            // //}
        }
        // all undefined values are tracked by this
        this.reportRead();
        return undefined;
    }
    getFieldAt(index: number): FieldValue {
        // tslint:disable-next-line:no-conditional-assignment
        const content = this._content;
        if(content === undefined || index < 0 || index >= content.length)
            throw new Error(`Field index out of range. index:${index}, content length:${content && content.length || 0}`);
        const value = content[index];
        if (isAtomValue(value)) {
            return value.get(); //fast happy path
        }
        //if (value !== undefined) {
        if(this._heapContext!.changeMap.isBase) {
        //if(!this.changeMap.isEditable) { //non-editable records are tracked by this
            //base records are tracked by this
            this.reportRead();
        } else if(globalState.trackingDerivation !== undefined) {
            //only create AtomValue when defined and tracked
            //lazily creates AtomValue<T>
            const newAtomValue = new AtomValue(value);
            content[index] = newAtomValue;
            newAtomValue.reportRead();
        }
        return value;
    }
    
    setDef(def: INodeRef): boolean {
        //INVARIANT: IsEditable == true;
        /*const editableHeapCtx = */
        this.ensureEditableHeapContext();
        const origType = this._type!;
        if(origType.def !== def) {
            this._type = getNodeType(def, origType.fields);
            this.reportChanged();
            return true;
        }
        return false;
    }

    setChild(field: INodeRefInternal, child: INodeRefInternal, fieldType: IType): IWriteNodeInternal {
        const editableHeapCtx = this.ensureEditableHeapContext();
        const me = this.me;
        if(fieldType.kind !== TypeKind.ChildNode)
            throw new Error("Trying to set a non-child value in setChild().");
        if(isHeapRoot(child)) {
            throw new Error(`Trying to make a heap root to be a child, me:${me}, root:${child}`);
        }
        startBatch();
        try {
            if(me.findVersion(editableHeapCtx) !== this) // only for safety - REMOVE
                throw new Error("Inconsistent me and this record");
            const childRecord = child.writeNode(editableHeapCtx, false)!;
            const childParent = childRecord._parent;
            if(typeof childParent !== 'number' || childRecord._prev || childRecord._next /*|| childRecord._heapContext?.heap !== editableHeapCtx.heap*/)
                throw new Error("Cannot setChild(). The child is attached.");
            const currentChild = this.getField(field, true) as INodeRefInternal | undefined;
            if(currentChild !== undefined) {
                const currentChildRecord = currentChild.writeNode(editableHeapCtx, false)!;
                if(currentChildRecord._prev !== undefined)
                    throw new Error("Expected a single child record in setChild().");
                const fragments = editableHeapCtx.heap.fragments;
                currentChildRecord._parent = childParent; // fragments.length; //detach
                //fragments.push(currentChild);
                fragments[childParent] = currentChildRecord; // replace
                currentChildRecord._role = undefined;
                currentChildRecord.reportChanged();
            } else {
                childRecord.removeFromFragments(childParent, editableHeapCtx);
            }
            childRecord._parent = me;
            childRecord._role = field;
            childRecord.reportChanged();
            this.setFieldImpl(field, child, fieldType);
            return childRecord;
        } finally {
            endBatch();
        }
    }

    removeFromFragments(parent: number, heapContext: IHeapContext) {
        // INVARIANT: this._parent === parent
        // INVARIANT: this._type !== undefined
        // POST-INVARIANT: this._parent will be set to some INodeRefInternal
        
        // replace with the last fragment
        const fragments = heapContext.heap.fragments;
        const lastFragment = fragments.pop()!; // remove the last
        if(parent < fragments.length) { 
            // childRecord was not the last one, move the last one at its place
            lastFragment._parent = parent;
            fragments[parent] = lastFragment;
        } 
    }

    //TODO: check sub-type compatibility of the child and the fieldType (existing and the new)
    //maybe at first, we should only check if the fieldType is the same if we are adding a child
    insertLast(field: INodeRefInternal, child: INodeRefInternal, fieldType: IType): void {
        //INVARIANT: try hard to fail BEFORE any exception can occur
        const editableHeapCtx = this.ensureEditableHeapContext();
        const me = this.me;
        if(fieldType.kind !== TypeKind.ChildNode)
            throw new Error("Trying to insert a non-child value in insertLast().");
        if(isHeapRoot(child)) {
            throw new Error(`Trying to insert-last a heap root, me:${me}, root:${child}`);
        }
        startBatch();
        try {
            if(me.findVersion(editableHeapCtx) !== this) // only for safety - REMOVE
                throw new Error("Inconsistent me and this record");
            const childRecord = child.writeNode(editableHeapCtx, false)!;
            //childRecord.reportRead(); //below are low level reads
            const childParent = childRecord._parent;
            if(typeof childParent !== "number" || childRecord._prev || childRecord._next /*|| childRecord._heapContext?.heap !== editableHeapCtx.heap*/)
                throw new Error("Cannot insertLast(). The child is attached.");
            const currentChild = this.getField(field, true) as INodeRefInternal | undefined;
            if(currentChild !== undefined) {
                const currentChildRecord = currentChild.writeNode(editableHeapCtx, false)!;
                const lastChild = currentChildRecord._prev;
                //currentChildRecord.reportRead(); // the low level _prev read
                if(lastChild !== undefined) {
                    // at least two children
                    const lastChildRecord = lastChild.writeNode(editableHeapCtx, false)!;
                    lastChildRecord._next = child;
                    lastChildRecord.reportChanged();
                    childRecord._prev = lastChild;
                } else {
                    // only one child
                    currentChildRecord._next = child;
                    childRecord._prev = currentChild;
                }
                currentChildRecord._prev = child;
                currentChildRecord.reportChanged();
            } else {
                //the single child
                this.setFieldImpl(field, child, fieldType);
            }
            
            childRecord.removeFromFragments(childParent, editableHeapCtx);
            //childRecord._next = undefined;
            childRecord._parent = me;
            childRecord._role = field;
            childRecord.reportChanged();
        } finally {
            endBatch();
        }
    }
    insertFirst(field: INodeRefInternal, child: INodeRefInternal, fieldType: IType): void {
        //INVARIANT: try hard to fail BEFORE any exception can occur
        const editableHeapCtx = this.ensureEditableHeapContext();
        const me = this.me;
        if(fieldType.kind !== TypeKind.ChildNode)
            throw new Error("Trying to insert a non-child value in insertFirst().");
        if(isHeapRoot(child)) {
            throw new Error(`Trying to insert-first a heap root, me:${me}, root:${child}`);
        }
        startBatch();
        try {
            if(me.findVersion(editableHeapCtx) !== this) // only for safety - REMOVE
                throw new Error("Inconsistent me and this record");
            const childRecord = child.writeNode(editableHeapCtx, false)!;
            //childRecord.reportRead(); //below are low level reads
            const childParent = childRecord._parent;
            if(typeof childParent !== "number" || childRecord._prev || childRecord._next /*|| childRecord._type!.heap !== this._type!.heap*/)
                throw new Error("Cannot insertFirst(). The child is attached.");
            const currentChild = this.getField(field, true) as INodeRefInternal | undefined;
            if(currentChild !== undefined) {
                const currentChildRecord = currentChild.writeNode(editableHeapCtx, false)!;
                const lastChild = currentChildRecord._prev;
                //currentChildRecord.reportRead(); // the low level _prev read
                if(lastChild !== undefined) {
                    // at least two children
                    childRecord._prev = lastChild;
                } else {
                    // only one child, it is the last one
                    childRecord._prev = currentChild;
                }
                childRecord._next = currentChild;
                
                currentChildRecord._prev = child;
                currentChildRecord.reportChanged();
            }

            childRecord.removeFromFragments(childParent, editableHeapCtx);
            childRecord._parent = me;
            childRecord._role = field;
            childRecord.reportChanged();
            //the child becomes the first child
            this.setFieldImpl(field, child, fieldType);
        } finally {
            endBatch();
        }
    }
    
    insertAfter(anchor: INodeRefInternal): void {
        //INVARIANT: try hard to fail BEFORE any exception can occur
        const editableHeapCtx = this.ensureEditableHeapContext();
        const me = this.me;
        //this.reportRead(); //below are low level reads
        const thisParent = this._parent;
        if(typeof thisParent !== "number" || this._prev || this._next)
            throw new Error("Cannot insertAfter(). This node is attached.");
        if(isHeapRoot(me)) {
            throw new Error(`Trying to insert-after a heap root, me-root:${me}, anchor:${anchor}`);
        }
        startBatch();
        try {
            if(me.findVersion(editableHeapCtx) !== this) // only for safety - REMOVE
                throw new Error("Inconsistent me and this record");
            const anchorRecord = anchor.writeNode(editableHeapCtx, false)!;
            const parent = anchorRecord._parent; //reportRead()
            const role = anchorRecord._role;
            if(typeof parent === "number" || !role /*|| anchorRecord._type!.heap !== this._type!.heap*/) {
                //anchorRecord.reportRead(); //low level read-s above
                throw new Error("Cannot insert after a detached node.");
            }
            const anchorNext = anchorRecord._next;
            if(anchorNext !== undefined) {
                //anchor has a next node, just insert in between the two
                const anchorNextRecord = anchorNext.writeNode(editableHeapCtx, false)!;
                this._next = anchorNext;
                anchorNextRecord._prev = me;
                anchorNextRecord.reportChanged();
            } else {
                // this will become the last child, adjust it
                const parentRecordRead = parent.readNode(editableHeapCtx.changeMap, false)!;
                const firstChild = parentRecordRead.getField(role, true) as Node;
                const firstChildRecord = firstChild.writeNode(editableHeapCtx, false)!;
                firstChildRecord._prev = me;
                firstChildRecord.reportChanged();
            }
            anchorRecord._next = me;
            anchorRecord.reportChanged(); //this could re-trigger the reaction ?
            //anchorRecord.reportRead(); //low level read-s above, put it after the reportChanged()
            
            this._prev = anchor;
            this.removeFromFragments(thisParent, editableHeapCtx);
            this._parent = parent;
            this._role = role;
            this.reportChanged();
        } finally {
            endBatch();
        }
    }
    insertBefore(anchor: INodeRefInternal): void {
        //INVARIANT: try hard to fail BEFORE any exception can occur
        const editableHeapCtx = this.ensureEditableHeapContext();
        const me = this.me;
        //this.reportRead(); //below are low level reads
        const thisParent = this._parent;
        if(typeof thisParent !== "number" || this._prev || this._next)
            throw new Error("Cannot insertAfter(). This node is attached.");
        if(isHeapRoot(me)) {
            throw new Error(`Trying to insert-before a heap root, me-root:${me}, anchor:${anchor}`);
        }
        startBatch();
        try {
            if(me.findVersion(editableHeapCtx) !== this) // only for safety - REMOVE
                throw new Error("Inconsistent me and this record");
            const anchorRecord = anchor.writeNode(editableHeapCtx, false)!;
            const parent = anchorRecord._parent; //reportRead()
            const role = anchorRecord._role;
            if(typeof parent === "number" || !role /*|| anchorRecord._type!.heap !== this._type!.heap*/) {
                //anchorRecord.reportRead(); //low level read-s above
                throw new Error("Cannot insert after a detached node.");
            }
            const anchorPrev = anchorRecord._prev;
            if(anchorPrev !== undefined) {
                //anchor has a prev node, at least two children already
                const anchorPrevRecordRead = anchorPrev.readNode(editableHeapCtx.changeMap, false)!;
                if(anchorPrevRecordRead._next === anchor) {
                    const anchorPrevRecord = anchorPrev.makeWrite(anchorPrevRecordRead, editableHeapCtx);// editableRecord(changeMap, false)!;
                    //anchor is not the first
                    anchorPrevRecord._next = me;
                    anchorPrevRecord.reportChanged();
                    //anchorPrevRecord.reportRead(); // do we need this ?
                } else {
                    //anchor is the first, this become the first
                    const parentRecord = parent.writeNode(editableHeapCtx, false)!;
                    parentRecord.resetFirstChild(role, me);
                    //anchorPrevRecordRead.reportRead();
                }
                this._prev = anchorPrev;
            } else {
                // anchor is the only child
                const parentRecord = parent.writeNode(editableHeapCtx, false)!;
                parentRecord.resetFirstChild(role, me);
                this._prev = anchor; //anchor becomes the last
            }
            anchorRecord._prev = me;
            anchorRecord.reportChanged(); //this could re-trigger the reaction ?
            //anchorRecord.reportRead(); //low level read-s above, put it after the reportChanged()
            
            this._next = anchor;
            this.removeFromFragments(thisParent, editableHeapCtx);
            this._parent = parent;
            this._role = role;
            this.reportChanged();
        } finally {
            endBatch();
        }
    }

    setField(field: INodeRefInternal, value: FieldValue, fieldType: IType): boolean {
        if(fieldType.kind === TypeKind.ChildNode)
            throw new Error("Trying to set a child in setField().");
        this.ensureEditableHeapContext();
        startBatch();
        try {
            return this.setFieldImpl(field, value, fieldType);
        } finally {
            endBatch();
        } 
    }
    private setFieldImpl(field: INodeRefInternal, value: FieldValue, fieldType: IType): boolean {
        //INVARIANT: ensureCanMutate() is already run:  isEditable == true + cannot fail in Atom.set()
        //INVARIANT: runs in a batch
        //INVARIANT: this should not fail ever, because the above invariants
        const nodeType = this._type!;
        let i = nodeType.getFieldIndex(field.uid);
        if (i >= 0) {
            const oldValue: ContentValue = this._content![i];
            let typeChanged = false;
            if (!typeEquals(nodeType.fields[i].type, fieldType)) {
                this._type = nodeType.updateField(fieldType, i);
                typeChanged = true; //at least the type was changed
                this.reportChanged(); // change of the _type (invalidates type and possinbly change to being a child, see getField() when childOnly === true)
                //NOTE: we do not need to replace, because we are in JavaScript :)
                // if (isAtomValue(oldValue)) {
                //     //replace in place with the atom value of the new type
                //     const newAtomValue = new AtomValue(value);
                //     this._content[i] = newAtomValue;
                //     oldValue.replaceWith(newAtomValue); //this will report change as well
                //     return true;
                // }
            } 
            if (isAtomValue(oldValue)) {
                return oldValue.set(value) || typeChanged;
            }
            //we are seting a new value here directly, no need to make it an Atom
            //it will be converted to an AtomValue when read with tracking
            //TODO: do we need a better value equals semantics ?
            if(value !== oldValue) {
                this._content![i] = value;
                // if(oldValue === undefined)
                //     this.reportChanged(); //undefined is tracked by this
                return true;
            }
            return typeChanged;
        }

        //insert a new field
        i = ~i; // -i - 1;
        //var fieldType = FieldType.FromClrType<T>();
        this._type = nodeType.insertField(field.uid, fieldType, i);
        //we are seting a new value here directly, no need to make it an Atom
        //it will be converted to an AtomValue when read with tracking
        if (this._content !== undefined) {
            this._content.splice(i, 0, value); //TODO: an optimized insert ?
        } else {
            this._content = [value];
            if(this._type.fields.length !== 1)
                throw new Error(`Unexpected fields length=${this._type.fields.length}`);
            //this._content = new Array(this._type.fields.length);
            //this._content[i] = value;
        }
        this.reportChanged(); //_type is tracked by this        
        return true;
    }
    resetFirstChild(field: INodeRefInternal, child: INodeRefInternal): void {
        //INVARIANT: ensureCanMutate() is already run:  isEditable == true + cannot fail in Atom.set()
        //INVARIANT: runs in a batch
        //INVARIANT: there is evidence, the replaced child is there
        //INVARIANT: this should not fail ever, because the above invariants
        const i = this._type!.getFieldIndex(field.uid);
        if (i >= 0) {
            const oldValue = this._content![i];
            if (isAtomValue(oldValue)) {
                oldValue.set(child);
                return;
            }
            this._content![i] = child;
            // if(oldValue === undefined)
            //     this.reportChanged(); //undefined is tracked by this, impossible case here?
            return;
        }
        throw new Error("Expected a child field."); //should not ever happen
    }
    // clearField(field: INodeRef): boolean {
    //     //MAYBE: we do not need this one, only use removeField, and for "clear", set null when nullable type ?
    //     //INVARIANT: IsEditable == true;
    //     this.ensureCanMutateAndEditable();
    //     const i = this._type.getFieldIndex(field.uid);
    //     if (i >= 0 && this._content !== undefined) {
    //         const value = this._content[i];
    //         if (value !== undefined) {
    //             this._content[i] = undefined;
    //             if (isAtomValue(value)) {
    //                 return value.clear();
    //             }
    //             return true;
    //         }
    //     }
    //     return false;
    // }
    
    removeField(field: INodeRefInternal): FieldValue | undefined {
        //INVARIANT: IsEditable == true;
        this.ensureEditableHeapContext();
        return this.removeFieldInternal(field, true);
    }
    removeFieldInternal(field: INodeRefInternal, mustNotBeChild: boolean): FieldValue | undefined {
        //INVARIANT: IsEditable == true;
        //INVARIANT: this.ensureCanMutateAndEditable();
        const type = this._type!;
        const i = type.getFieldIndex(field.uid);
        if (i >= 0) {
            if(mustNotBeChild && type.fields[i].type.kind === TypeKind.ChildNode) {
                throw new Error(`A child cannot be removed by removeField().`);
            }
            this._type = type.removeField(i);
            let value = this._content![i];
            this._content!.splice(i, 1); // TODO: ? use an optimized "remove element"
            if (isAtomValue(value)) {
                const atom = value;
                value = atom.getUntracked();
                atom.reportChanged(); //will disappear after onBecomeUnobserved
            }
            this.reportChanged(); //_type has changed
            return value;
        }
        return undefined;
    }

    removeChildren(this: IWriteNodeInternal, field: INodeRefInternal): number /* Node | undefined*/ {
        const editableHeapContext = this.ensureEditableHeapContext();
        //INVARIANT: IsEditable == true;
        //INVARIANT: try hard to fail BEFORE any exception can occur, or fail only with a consistent tree
        let n = 0;
        const type = this._type!;
        const i = type.getFieldIndex(field.uid);
        if (i >= 0) {
            if(type.fields[i].type.kind !== TypeKind.ChildNode) {
                throw new Error(`A non-child cannot be removed by removeChildren().`);
            }
            let firstChild = this._content![i] as INodeRefInternal | IAtomValue<INodeRefInternal>;
            if (isAtomValue(firstChild)) {
                const atom = firstChild;
                firstChild = atom.getUntracked();
                atom.reportChanged(); //will disappear after onBecomeUnobserved
            }
            startBatch();
            try {
                const fragments = editableHeapContext.heap.fragments;
                const firstChildRecord = firstChild.writeNode(editableHeapContext, false)!;
                let lastChild = firstChildRecord._prev;
                if(lastChild !== undefined) {
                    //more children
                    let lastChildRecord = lastChild.writeNode(editableHeapContext, false)!;
                    let prevLastChild = lastChildRecord._prev!;
                    while(prevLastChild !== firstChild) {
                        //last and prev-last children are different from the first child
                        //materialize the prevLastChildRecord before any tree change for the case of an exception
                        const prevLastChildRecord = prevLastChild.writeNode(editableHeapContext, false)!;
                        //detach last child
                        lastChildRecord._prev = undefined;
                        lastChildRecord._next = undefined; //for sure
                        // tslint:disable-next-line:no-shadowed-variable
                        //const fragments = lastChildRecord._type!.heap.fragments;
                        lastChildRecord._parent = fragments.length; //detach
                        fragments.push(lastChildRecord);
                        lastChildRecord._role = undefined;
                        lastChildRecord.reportChanged();
                        n++;
                        //rebind the last for the case an exception will raise in the next loop
                        lastChild = prevLastChild;
                        firstChildRecord._prev = lastChild;
                        lastChildRecord = prevLastChildRecord;
                        prevLastChild = lastChildRecord._prev!;
                    }
                    //prevLastChild === firstChild
                    //detach last child
                    lastChildRecord._prev = undefined;
                    lastChildRecord._next = undefined; //for sure
                    // tslint:disable-next-line:no-shadowed-variable
                    //const fragments = lastChildRecord._type!.heap.fragments;
                    lastChildRecord._parent = fragments.length; //detach
                    fragments.push(lastChildRecord);
                    lastChildRecord._role = undefined;
                    lastChildRecord.reportChanged();
                    n++;
                }
                //detach first child
                firstChildRecord._prev = undefined;
                firstChildRecord._next = undefined;
                //const fragments = firstChildRecord._type!.heap.fragments;
                firstChildRecord._parent = fragments.length; //detach
                fragments.push(firstChildRecord);
                firstChildRecord._role = undefined;
                firstChildRecord.reportChanged();
                n++;
                //remove the field at last when no exceptions can happen
                this._content!.splice(i, 1); // TODO: ? use an optimized "remove element"
                this._type = type.removeField(i);
                this.reportChanged(); //_type has changed
            } finally {
                endBatch();
            }
            //return true;// firstChild;
        }
        return n; //false; //undefined;
    }
    
    detach(this: IWriteNodeInternal): boolean {
        //INVARIANT: this is IWriteNodeInternal
        const editableHeapContext = this.ensureEditableHeapContext();
        const me = this.me;
        if(isHeapRoot(me))
            throw new Error(`Cannot detach a heap root:${this}`);
        const parent = this._parent;
        //this.reportRead(); //do we need this?
        if(typeof parent !== "number") {
            startBatch();
            try {
                const prev = this._prev;
                if(prev !== undefined) {
                    //we are in children, at least two children
                    const next = this._next;
                    const prevRecordRead = prev.readNode(editableHeapContext.changeMap, false)!;
                    if(prevRecordRead._next !== undefined) { //should be me
                        //me is not the first
                        const prevRecord = prev.makeWrite(prevRecordRead, editableHeapContext);// editableRecord(changeMap, false)!;
                        if(next !== undefined) {
                            //me is not the last one
                            const nextRecord = next.writeNode(editableHeapContext, false)!;
                            nextRecord._prev = prev;
                            nextRecord.reportChanged();
                        } else {
                            //me is the last child
                            const parentRecordRead = parent.readNode(editableHeapContext.changeMap, false)!;
                            const firstChild = parentRecordRead.getField(this._role!, true) as INodeRefInternal;
                            if(firstChild === prev) {
                                //me was the second and the last child - make the first standalone
                                prevRecord._prev = undefined;
                            } else {
                                //me was after the second child - rebind last child to prev
                                const firstChildRecord = firstChild.writeNode(editableHeapContext, false!)!;
                                firstChildRecord._prev = prev;
                                firstChildRecord.reportChanged();
                            }
                        }
                        prevRecord._next = next;
                        prevRecord.reportChanged();
                        //prevRecord.reportRead(); // do we need this ?
                    } else {
                        //me is the first child within children - next must be defined
                        const parentRecord = parent.writeNode(editableHeapContext, false)!;
                        const nextRecord = next!.writeNode(editableHeapContext, false)!;
                        if(prev === next) {
                            //there are only two children - next will become a single child
                            nextRecord._prev = undefined;
                            //nextRecord._next = undefined; //must hold
                        } else {
                            //next is the first of more children
                            nextRecord._prev = prev;
                        }
                        nextRecord.reportChanged();
                        parentRecord.resetFirstChild(this._role!, next!);
                    }
                    this._prev = undefined;
                    this._next = undefined;
                } else {
                    //a single child - remove
                    const parentRecord = parent.writeNode(editableHeapContext, false)!;
                    parentRecord.removeFieldInternal(this._role!, false, editableHeapContext);
                }
                const fragments = editableHeapContext.heap.fragments;
                this._parent = fragments.length; //detach
                fragments.push(this);
                this._role = undefined;
                this.reportChanged();
            } finally {
                endBatch();
            }
            return true;
        }
        return false;
    }

    toString() {
        const uid = this.uid;
        const n = typeof this._me === "number" ? "nme" : "nv";
        return `${n}${utils.getGidx(uid)},${utils.getSidx(uid)}`;
    }
    // getField(field: INodeRef): FieldValue {
    //     if(this.changeMap.isEditable) {
    //         if(globalState.trackingDerivation !== undefined)
    //             return this.getTracked(field);
    //         return this.getUntracked(field);
    //     }
    //     this.reportRead();
    //     return this.getNoAtoms(field);
        
    // }
    // private getNoAtoms(field: INodeRef): FieldValue {
    //     //INVARIANT: IsEditable == false;
    //     const i = this._type.getFieldIndex(field.uid);
    //     if (i >= 0 && this._content !== undefined) {
    //         //should we check type compatibility at all?
    //         return this._content[i];
    //     }
    //     return undefined;
    // }
    
    // private getUntracked(field: INodeRef): FieldValue {
    //     //INVARIANT: changeMap.IsTracking == false
    //     //Debug.Assert(changeMap.IsTracking);
    //     //INVARIANT: IsEditable == true;

    //     const i = this._type.getFieldIndex(field.uid);
    //     if (i >= 0 && this._content !== undefined) {
    //         const value = this._content[i];
    //         if (isAtomValue(value)) {
    //             return value.getUntracked();
    //         }
    //         return value;
    //     }
    //     return undefined;
    // }
    
    // private getTracked(field: INodeRef): FieldValue {
    //     //INVARIANT: changeMap.IsTracking == true
    //     //TODO: Debug.Assert(changeMap.IsTracking);
    //     //INVARIANT: IsEditable == true;

    //     const i = this._type.getFieldIndex(field.uid);
    //     if (i >= 0 && this._content !== undefined) {
    //         const value = this._content[i];
    //         if (isAtomValue(value)) {
    //             return value.get(); //fast happy path
    //         }
    //         if (value !== undefined) {
    //             //a null is a non-value/default value
    //             //should we check type compatibility at all?
    //             //if(RecordType.Fields[i].FieldType.ClrType != typeof(T)) {
    //             //    throw new InvalidOperationException($"Expected field type is different than the value's type. Expected:{typeof(T)}, value's type:{RecordType.Fields[i].FieldType.ClrType}");
    //             //}
    //             //perhaps we can rely on this type check only
    //             //an AtomValue of a different type should be catched here as well
    //             //value = (T)objValue;
    //             //if (changeMap.IsTracking)
    //             //lazily creates AtomValue<T>
    //             const newAtomValue = new AtomValue(value);
    //             this._content[i] = newAtomValue;
    //             newAtomValue.reportRead();
    //             return value;
    //         }
    //     }
    //     // all undefined read values are reported via node-wise atom
    //     // which prevents unnecessary mutations of content and type
    //     this.reportRead();
    //     return undefined;
    // }

    // getTrackedWithInsert(field: INodeRef, defaultType: IType): FieldValue {
    //     //INVARIANT: changeMap.IsTracking == true
    //     //TODO: Debug.Assert(changeMap.IsTracking);
    //     //INVARIANT: IsEditable == true;

    //     let i = this.nodeType.getFieldIndex(field.uid);
    //     if (i >= 0) {
    //         if (this._content !== undefined) {
    //             const value = this._content[i];
    //             if (isAtomValue(value)) {
    //                 return value.get(); //fast happy path
    //             }
    //             if (value !== undefined) {
    //                 //a null is a non-value/default value
    //                 //should we check type compatibility at all?
    //                 //if(RecordType.Fields[i].FieldType.ClrType != typeof(T)) {
    //                 //    throw new InvalidOperationException($"Expected field type is different than the value's type. Expected:{typeof(T)}, value's type:{RecordType.Fields[i].FieldType.ClrType}");
    //                 //}
    //                 //perhaps we can rely on this type check only
    //                 //an AtomValue of a different type should be catched here as well
    //                 //value = (T)objValue;
    //                 //if (changeMap.IsTracking)
    //                 //lazily creates AtomValue<T>
    //                 const newAtomValue = new AtomValue(value);
    //                 this._content[i] = newAtomValue;
    //                 newAtomValue.reportRead();
    //                 return value;
    //             }
    //         } else {
    //             this._content = new Array(this.nodeType.fields.length);
    //         }
    //     } else {
    //         i = ~i; //-i - 1;
    //         // var fieldType = FieldType.FromClrType<T>();
    //         this.nodeType = this.nodeType.heap.getNodeTypeWithInsert(this.nodeType, new FieldDef(field.uid, defaultType), i);
    //         //var newContent = new object[RecordType.Fields.Length];
    //         if (this._content !== undefined) {
    //             this._content.splice(i, 0, undefined);
    //         } else {
    //             this._content = new Array(this.nodeType.fields.length);
    //         }
    //     }
    //     //initialize and track an atom value without a value
    //     const newAtomWithoutValue = new AtomValue(undefined);
    //     this._content[i] = newAtomWithoutValue;
    //     //inlined: return newAtomValue.TryGet(changeMap, out value);
    //     newAtomWithoutValue.reportRead();
    //     return undefined;
    // }
}
//Node.prototype.isRecord = true;

// export function isRecord(h: INodeRecordHeader): h is Node {
//     return h.isRecord;
// }


// export class NodeOld implements INode {
//     /*internal*/isNode: boolean; //se via prototype
//     readonly uid: number;
//     /*internal*/ header?: INodeRecordHeader;
//     constructor(uid: number, header?: INodeRecordHeader) {
//         this.uid = uid;
//         this.header = header;
//     }

//     hashCode() { return this.uid | 0; }

//     get read(): Node | undefined { return this.readRecord(); }
//     get edit(): Node | undefined { return this.editableRecord(); }

//     create(
//         nodeType: NodeType, content?: FieldValue[],
//         //parent?: Node, role?: Node, //memUnit?: INodeRef,
//         //prev?: Node, next?: Node,
//         changeMap?: IChangeMap 
//     ): Node {
//         if (changeMap === undefined) changeMap = globalState.changeMap;
//         // if(parent !== undefined && isHeapRoot(this)) {
//         //     throw new Error(`Trying to set parent to a heap root node:${this}`);
//         // }
//         for (let h = this.header, prevH = undefined; h !== undefined; prevH = h, h = h.nextHeader) {
//             const hChangeMap = h.changeMap;
//             if(hChangeMap === changeMap) {
//                 if(h.isRecord)
//                     throw new Error(`Record already exists uid:${this.uid}, changeMap:${changeMap}`);
//                 //h is header only -> replace
//                 //, parent, role, prev, next are all undefined to prevent problems with heap compatibility
//                 const fragments = nodeType.heap.fragments; // tslint:disable-line:no-shadowed-variable
//                 const record = new Node(changeMap, h.nextHeader, nodeType, content, fragments.length); // tslint:disable-line:no-shadowed-variable
//                 fragments.push(this);
//                 if(prevH !== undefined) (prevH as IHeaderInternal).nextHeader = record;
//                 else this.header = record;
//                 h.reportChanged(); //notify that re-read is needed to rebind sources
//                 return record;
//             }
//             if(hChangeMap.base === changeMap) {
//                 throw new Error(`A derived record already exists uid:${this.uid}, h.changeMap.base:${hChangeMap.base}, changeMap:${changeMap}`);
//             }
//             // if(hChangeMap === changeMap.base) {
//             //    we could break here, but the comparison is probably more expensive ?
//             // }
//         }
//         //put new record to the header (there is no header with changeMap, or only of the base change map)
//         //, parent, role, prev, next are all undefined to prevent problems with heap compatibility
//         const fragments = nodeType.heap.fragments;
//         const record = new Node(changeMap, this.header, nodeType, content, fragments.length);
//         fragments.push(this);
//         this.header = record;
//         return record;
//     }

//     readRecord(changeMap?: IChangeMap, canUnresolve?: boolean): Node | undefined {
//         if (changeMap === undefined) changeMap = globalState.changeMap;
//         const h = findHeader(changeMap, this.header);
//         if(h !== undefined) {
//             // NOTE: we are not reportRead() when a record is acquired
//             //  it will be done on the record level ?
//             // THINK: can a record "came back" to non-existence ?
//             //        specially, when observed ?
//             // we will not reportRead() just for record retrieval when it exists
//             // the user code can do that if the existence is the only reason why it was read
//             if (h.isRecord) 
//                 return h as Node;
//             h.reportRead(); //track when the record will start to exist
//         } else if(globalState.trackingDerivation !== undefined) {
//             if(changeMap.base !== undefined) changeMap = changeMap.base;
//             const header = new NodeRecordHeader(changeMap, this.header);
//             this.header = header;
//             header.reportRead();
//         }
//         if(canUnresolve)
//             return undefined;
//         throw new Error(`Unresolved read record. uid:${this.uid}, changeMap:${globalState.changeMap}`);
//     }
//     makeEditable(readRecord: Node, changeMap?: IChangeMap): Node {
//         ensureCanMutate();
//         if (changeMap === undefined) changeMap = globalState.changeMap;
//         if(!changeMap.isEditable)
//             throw new Error('Cannot set a field when changeMap is not editable.');
//         const rrChangeMap = readRecord.changeMap;
//         if(rrChangeMap === changeMap) {
//             return readRecord;
//         }
//         if(rrChangeMap !== changeMap.base) {
//             throw new Error('Incompatible non-base change map in the node record found.');
//         }
//         //NOTE: this is dangerous, we should try to ensure there is no editable record yet!
//         const editableRecord = readRecord.clone(this, changeMap, this.header);
//         //editableRecord.checkCanMutate(); --> always true
//         this.header = editableRecord;
//         readRecord.reportChanged(); //notify that re-read is needed to rebind sources
//         return editableRecord;
//     }

//     editableRecord(changeMap?: IChangeMap, canUnresolve?: boolean): Node | undefined {
//         //const nr = this.readNodeRecord(changeMap);
//         //return nr && this.makeEditable(nr, changeMap);
//         ensureCanMutate();
//         if (changeMap === undefined) changeMap = globalState.changeMap;
//         if(!changeMap.isEditable)
//             throw new Error('Cannot change a record when the changeMap is not editable.');
//         for (let h = this.header; h !== undefined; h = h.nextHeader) {
//             if(h.changeMap === changeMap) {
//                 if(h.isRecord)
//                     return h as Node;
//                 break;
//             }
//             if(h.changeMap === changeMap.base) {
//                 if(h.isRecord) {
//                     const editableRecord = (h as Node).clone(this, changeMap, this.header);
//                     //editableRecord.checkCanMutate(); --> always true
//                     this.header = editableRecord;
//                     h.reportChanged(); //notify that re-read is needed to rebind sources
//                     return editableRecord;
//                 } else {
//                     break;
//                 }
//             }
//         }
//         if(canUnresolve)
//             return undefined;
//         throw new Error(`Unresolved editable record uid:${this.uid}, changeMap:${globalState.changeMap}`);
//     }

//     //NOTE: these are only for convenience
    
//     getDef(changeMap?: IChangeMap, canUnresolve?: boolean): INode | undefined {
//         const nr = this.readRecord(changeMap, canUnresolve);
//         return nr && nr.def;
//     }
//     getField(field: INode, changeMap?: IChangeMap, canUnresolve?: boolean) {
//         const nr = this.readRecord(changeMap, canUnresolve);
//         return nr && nr.getField(field);
//         // if (changeMap === undefined) changeMap = globalState.changeMap;
//         // const h = findHeader(changeMap, this.header);
//         // const isTracked = globalState.trackingDerivation !== undefined;
//         // if(h !== undefined) {
//         //     const hChangeMap = h.changeMap;
//         //     if (isTracked) {
//         //         if(hChangeMap === changeMap && h.isRecord && hChangeMap.isEditable) {
//         //             return (h as NodeRecord).getTracked(field);
//         //         }
//         //         h.reportRead();
//         //     }
//         //     if(h.isRecord) {
//         //         if(hChangeMap.isEditable) return (h as NodeRecord).getUntracked(field);
//         //         return (h as NodeRecord).getNoAtoms(field);
//         //     }
//         //     // no need to search on, because we track unchanged base directly there
//         //     // and an header for changeMap means there is no data -> undefined
//         //     // if(hChangeMap === changeMap) {
//         //     //     const hChangeMapBase = hChangeMap.base;
//         //     //     if (hChangeMapBase !== undefined) {
//         //     //         const bh = findHeader(hChangeMapBase, h.nextHeader);
//         //     //         if (bh !== undefined && bh.isRecord) {
//         //     //             if(hChangeMapBase.isEditable) // == false always ???
//         //     //                 return (bh as NodeRecord).getUntracked(field);
//         //     //             return (bh as NodeRecord).getNoAtoms(field);
//         //     //         }
//         //     //     }
//         //     // } 
//         // } else if(isTracked) {
//         //     // create a no-data "base" header for tracking of eventual resolution
//         //     if(changeMap.base !== undefined) changeMap = changeMap.base;
//         //     const header = new NodeRecordHeader(changeMap, this.header);
//         //     this.header = header;
//         //     header.reportRead();
//         // }
//         // return undefined;
//     }
//     getFieldAt(index: number, changeMap?: IChangeMap, canUnresolve?: boolean) {
//         const nr = this.readRecord(changeMap, canUnresolve);
//         return nr && nr.getFieldAt(index);
//     }
//     setDef(def: INode, changeMap?: IChangeMap, canUnresolve?: boolean): boolean | undefined {
//         const record = this.editableRecord(changeMap, canUnresolve);
//         ///if(record === undefined) return undefined;
//         return record && record.setDef(def);
//         //return true;
//     }

//     setField(field: INode, fieldType: IType, value: any, changeMap?: IChangeMap, canUnresolve?: boolean): boolean | undefined {
//         const record = this.editableRecord(changeMap, canUnresolve);
//         return record && record.setField(field, value, fieldType);
//     }
//     setChild(field: INode, fieldType: IType, value: Node, changeMap?: IChangeMap, canUnresolve?: boolean): true | undefined {
//         const record = this.editableRecord(changeMap, canUnresolve);
//         if(record) {
//             record.setChild(this, field as Node, value, fieldType);
//             return true;
//         }
//         return undefined;
//     }
//     // clearField(field: INodeRef, changeMap?: IChangeMap, canUnresolve?: boolean): boolean | undefined {
//     //     const record = this.editableRecord(changeMap, canUnresolve);
//     //     return record && record.clearField(field);
//     // }
//     removeField(field: INode, changeMap?: IChangeMap, canUnresolve?: boolean): FieldValue | undefined {
//         const record = this.editableRecord(changeMap, canUnresolve);
//         return record && record.removeField(field);
//     }
//     toString() {
//         return `n${utils.getGidx(this.uid)},${utils.getSidx(this.uid)}`;
//     }
// }
// //Node.prototype.isNode = true;
// export function isNode(x: any): x is Node {
//     return x && x.isNode;
// }

// function findHeader(changeMap: IChangeMap, header?: INodeRecordHeader): INodeRecordHeader | undefined {
//     // 
//     for (let h = header; h !== undefined; h = h.nextHeader) {
//         const hChangeMap = h.changeMap;
//         if(hChangeMap === changeMap || hChangeMap === changeMap.base) 
//             return h;
//     }
//     return undefined;
// }

