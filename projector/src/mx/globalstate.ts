import type { IDerivation } from "./derivation";
import type { Reaction } from "./reaction";
import type { ISource } from "./source";
import { GuidMap } from "../guidmap";
import * as utils from "../utils";
import type { Node, INodeRef } from "../node";
import type { Heap, IHeap } from "../heap";
import type { NodeType } from "../type";
import type { IConcept } from "../concept";

/**
 * These values will persist if global state is reset
 */
//const persistentKeys = ["mobxGuid", "resetId", "spyListeners", "strictMode", "runId"];

export const conceptSet = new utils.ArraySetImplementation<IConcept, IConcept>(
    (key: IConcept, value: IConcept) => key.def === value.def, //def should be always the same def (we register by node-ref identity)
    (key: IConcept) => key.def.uid, // as number | 0,
    (node: IConcept) => node.def.uid, // as number | 0,
    (key: IConcept) => key
);

export const conceptSetByNodeRef = new utils.ArraySetImplementation<INodeRef, IConcept>(
    (key: INodeRef, value: IConcept) => key === value.def, //def should be always the same def (we register by node-ref identity)
    (key: INodeRef) => key.uid, // as number | 0,
    (node: IConcept) => node.def.uid, // as number | 0,
    (key: INodeRef) => { throw new Error(`Trying to create a Concept from node-ref ${key}`) }
);


export interface IChangeMap {
    readonly _hashCode: number;
    readonly isBase: boolean;
    readonly isEditable: boolean;
}

export interface IHeapContext {
    readonly heap: IHeap;
    readonly changeMap: IChangeMap;
    readonly createdNodes: Node[];
}

// only one change map can be base
const baseChangeMap = { isBase: true, isEditable: false, _hashCode: 0 };
const editChangeMap: IChangeMap = { isBase: false, isEditable: true, _hashCode: 1 };

export class MXGlobals {
    guidMap = new GuidMap();

    nodeMap: utils.ArraySet<Node> = [];
    readonly heapMap: utils.ArraySet<Heap> = [];
    readonly heapRoots: utils.ArraySet<Node> = [];
    readonly nodeTypes: utils.ArraySet<NodeType> = [];
    readonly conceptMap: utils.ArraySet<IConcept> = [];
    //readonly nodeFieldInserts: utils.ArraySet<NodeFieldInsert> = [];

    /**
     * MobXGlobals version.
     * MobX compatiblity with other versions loaded in memory as long as this version matches.
     * It indicates that the global state still stores similar information
     */
    //version = 5;
    changeMap: IChangeMap = baseChangeMap;
    readonly baseChangeMap: IChangeMap = baseChangeMap;
    readonly editChangeMap: IChangeMap = editChangeMap;
    setupReadMode() { this.changeMap = baseChangeMap; }
    setupEditMode() { this.changeMap = editChangeMap; }
    /**
     * Currently running derivation
     */
    trackingDerivation?: IDerivation = undefined;

    /**
     * Are we running a computation currently? (not a reaction)
     */
    computationDepth = 0;

    /**
     * Each time a derivation is tracked, it is assigned a unique run-id
     */
    runId = 0;
    derivationRunId = 0;

    /**
     * Are we in a batch block? (and how many of them)
     */
    inBatch: number = 0;

    /**
     * Observables that don't have observers anymore, and are about to be
     * suspended, unless somebody else accesses it in the same batch
     */
    pendingUnobservations: ISource[] = [];

    /**
     * List of scheduled, not yet executed, reactions.
     */
    pendingReactions: Reaction[] = [];

    /**
     * Are we currently processing reactions?
     */
    isRunningReactions = false;

    /**
     * Is it allowed to change observables at this point?
     * In general, MobX doesn't allow that when running computations and React.render.
     * To ensure that those functions stay pure.
     */
    allowStateChanges = true;
    /**
     * If strict mode is enabled, state changes are by default not allowed
     */
    strictMode = false;

    /**
     * Used by createTransformer to detect that the global state has been reset.
     */
    //resetId = 0;

    /**
     * Spy callbacks
     */
    // tslint:disable-next-line:array-type callable-types
    //spyListeners: { (change: any): void }[] = [];

    /**
     * Globally attached error handlers that react specifically to errors in reactions
     */
    // tslint:disable-next-line:array-type
    globalReactionErrorHandlers: ((error: any, derivation: IDerivation) => void)[] = [];
}

export const globalState: MXGlobals = new MXGlobals();

/**
 * 'guid' for general purpose. Will be persisted amongst resets.
 */
let mxId = 0;
export function getNextId() {
    return ++mxId;
}

export function throwError(message: string, thing?: any): never {
    throw new Error("[mx] Invariant failed: " + message + (thing ? ` in '${thing}'` : ""));
}

export function invariant(check: boolean, message: string, thing?: any) {
    if (!check)
        throwError(message, thing);
}

export function ensureCanMutate() {
    // Should never be possible to change an observed observable from inside computed, see #798
    if (globalState.computationDepth > 0)
        throwError("Computed values are not allowed to cause side effects.");
    // Should not be possible to change observed state outside strict mode, except during initialization, see #563
    if (!globalState.allowStateChanges)
        throwError("Side effects like changing state are not allowed at this point.");

    // if(globalState.trackingDerivation !== undefined)
    //     throw new Error('Changing state is not allowed at this point. A derivation is in progress.');
}

export function runAllowStateChanges<T>(doAllowStateChanges: boolean, func: () => T): T {
    // TODO: deprecate / refactor this function in next major
    // Currently only used by `@observer`
    // Proposed change: remove first param, rename to `forbidStateChanges`,
    // require error callback instead of the hardcoded error message now used
    // Use `inAction` instead of allowStateChanges in derivation.ts to check strictMode
    const prev = allowStateChangesStart(doAllowStateChanges);
    let res;
    try {
        res = func();
    } finally {
        allowStateChangesEnd(prev);
    }
    return res;
}

function allowStateChangesStart(doAllowStateChanges: boolean) {
    const prev = globalState.allowStateChanges;
    globalState.allowStateChanges = doAllowStateChanges;
    return prev;
}

function allowStateChangesEnd(prev: boolean) {
    globalState.allowStateChanges = prev;
}

// let shareGlobalStateCalled = false;
// let runInIsolationCalled = false;
// let warnedAboutMultipleInstances = false;

// {
//     const global = getGlobal();
//     if (!global.__mobxInstanceCount) {
//         global.__mobxInstanceCount = 1;
//     } else {
//         global.__mobxInstanceCount++;
//         setTimeout(() => {
//             if (!shareGlobalStateCalled && !runInIsolationCalled && !warnedAboutMultipleInstances) {
//                 warnedAboutMultipleInstances = true;
//                 if(typeof console !== 'undefined') 
//                     // tslint:disable-next-line:no-console
//                     console.warn(
//                     "[mobx] Warning: there are multiple mobx instances active. This might lead to unexpected results. See https://github.com/mobxjs/mobx/issues/1082 for details."
//                 );
//             }
//         });
//     }
// }

// export function isolateGlobalState() {
//     runInIsolationCalled = true;
//     getGlobal().__mobxInstanceCount--;
// }

// export function shareGlobalState() {
//     // TODO: remove in 4.0; just use peer dependencies instead.
//     deprecated(
//         "Using `shareGlobalState` is not recommended, use peer dependencies instead. See https://github.com/mobxjs/mobx/issues/1082 for details."
//     );
//     shareGlobalStateCalled = true;
//     const global = getGlobal();
//     const ownState = globalState;

//     /**
//      * Backward compatibility check
//      */
//     if (global.__mobservableTrackingStack || global.__mobservableViewStack)
//         throw new Error("[mobx] An incompatible version of mobservable is already loaded.");
//     // if (global.__mobxGlobal && global.__mobxGlobal.version !== ownState.version)
//     //     throw new Error("[mobx] An incompatible version of mobx is already loaded.");
//     if (global.__mobxGlobal) globalState = global.__mobxGlobal;
//     else global.__mobxGlobal = ownState;
// }

// export function getGlobalState(): any {
//     return globalState;
// }

// export function registerGlobals() {
//     // no-op to make explicit why this file is loaded
// }

/**
 * For testing purposes only; this will break the internal state of existing observables,
 * but can be used to get back at a stable state after throwing errors
 */
// export function resetGlobalState() {
//     globalState.resetId++;
//     const defaultGlobals = new MobXGlobals();
//     for (const key in defaultGlobals)
//         if (persistentKeys.indexOf(key) === -1) (globalState as any)[key] = (defaultGlobals as any)[key];
//     globalState.allowStateChanges = !globalState.strictMode;
// }
