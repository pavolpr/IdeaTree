import { type ISource, /*IDepTreeNode,*/ addDerivation, removeDerivation } from "./source";
//import { IAtom } from "./atom";
import { globalState } from "./globalstate";
//import { fail } from "./utils";
import { isComputedValue } from "./computedvalue";
//import { getMessage } from "../utils/messages";

export const TrackingState = {
    // before being run or (outside batch and not being observed)
    // at this point derivation is not holding any data about dependency tree
    NotTracking: 0, //-1,
    // no shallow dependency changed since last computation
    // won't recalculate derivation
    // this is what makes mobx fast
    UpToDate: 1, //0,
    // some deep dependency changed, but don't know if shallow dependency changed
    // will require to check first if UP_TO_DATE or POSSIBLY_STALE
    // currently only ComputedValue will propagate POSSIBLY_STALE
    //
    // having this state is second big optimization:
    // don't have to recompute on every dependency change, but only when it's needed
    PossiblyStale: 2, //1,
    // A shallow dependency has changed since last computation and the derivation
    // will need to recompute when it's needed next.
    Stale: 3,//2
} as const;
export type TrackingState = typeof TrackingState[keyof typeof TrackingState];

export const TrackingStateMasks = {
    stateMask: 3, //0b000000_0011, //2 bits
    hiStateMask: 12,//0b000000_1100, //2 bits
    hiStateShift: 2,

    diffValueBit: 1 << 4,//0b000001_0000, //16
    isPendingUntrackedBit: 1 << 5,//0b000010_0000, //32
    isComputingBit: 1 << 6,//0b000100_0000, //64
    isDisposedBit: 1 << 7,//0b001000_0000, //128
    isScheduledBit: 1 << 8,//0b010000_0000, //256
    hasAtomValueBit: 1 << 9,//0b100000_0000, //512
    isTrackPendingBit: 1 << 10,//0b100000_0000, //1024
    //IsTransformedToEditableNodeBit       
    //                     = 1 << 10,//0b1000000_0000, //1024
} as const;
export type TrackingStateMasks = typeof TrackingStateMasks[keyof typeof TrackingStateMasks];

/**
 * A derivation is everything that can be derived from the state (all the atoms) in a pure manner.
 * See https://medium.com/@mweststrate/becoming-fully-reactive-an-in-depth-explanation-of-mobservable-55995262a254#.xvbh6qd74
 */
export interface IDerivation /*extends IDepTreeNode*/ {
    sources: ISource[];
    //newSources: null | ISource[]; // TODO: remove this one entirely
    sourcesState: TrackingState;
    /**
     * Id of the current run of a derivation. Each time the derivation is tracked
     * this number is increased by one. This number is globally unique
     */
    // runId: number;
    /**
     * amount of dependencies used by the derivation in this run, which has not been bound yet.
     */
    unboundSrcsCount: number;
    derId: number;
    onBecomeStale(): void;
    //replaceSource(original: ISource, newSource: ISource): boolean;
}

export class CaughtException {
    cause: any;
    constructor(cause: any) {
        this.cause = cause;
    }
}

export function isCaughtException(e: any): e is CaughtException {
    return e instanceof CaughtException;
}

/**
 * Finds out whether any dependency of the derivation has actually changed.
 * If dependenciesState is 1 then it will recalculate dependencies,
 * if any dependency changed it will propagate it by changing dependenciesState to 2.
 *
 * By iterating over the dependencies in the same order that they were reported and
 * stopping on the first change, all the recalculations are only called for ComputedValues
 * that will be tracked by derivation. That is because we assume that if the first x
 * dependencies of the derivation doesn't change then the derivation should run the same way
 * up until accessing x-th dependency.
 */
export function shouldCompute(derivation: IDerivation): boolean {
    switch (derivation.sourcesState) {
        case TrackingState.UpToDate:
            return false;
        case TrackingState.NotTracking:
        case TrackingState.Stale:
            return true;
        case TrackingState.PossiblyStale: {
            const prevUntracked = untrackedStart(); // no need for those computeds to be reported, they will be picked up in trackDerivedFunction.
            const sources = derivation.sources;
            const l = sources.length;
            for (let i = 0; i < l; i++) {
                const src = sources[i];
                if (isComputedValue(src)) {
                    try {
                        src.get();
                    } catch (e) {
                        // we are not interested in the value *or* exception at this moment, but if there is one, notify all
                        untrackedEnd(prevUntracked);
                        return true;
                    }
                    // if ComputedValue `src` actually changed it will be computed and propagated to its observers.
                    // and `derivation` is an observer of `src`
                    if ((derivation.sourcesState as TrackingState) === TrackingState.Stale) {
                        untrackedEnd(prevUntracked);
                        return true;
                    }
                }
            }
            changeSourcesStateToUpToDate(derivation);
            untrackedEnd(prevUntracked);
            return false;
        }
    }
}

// export function isComputingDerivation() {
//     return globalState.trackingDerivation !== null; // filter out actions inside computations
// }


/**
 * Executes the provided function `f` and tracks which observables are being accessed.
 * The tracking information is stored on the `derivation` object and the derivation is registered
 * as observer of any of the accessed observables.
 */
export function trackDerivedFunction<T>(derivation: IDerivation, f: (this: any) => T, thisArg: any) {
    // pre allocate array allocation + room for variation in deps
    // array will be trimmed by bindDependencies
    changeSourcesStateToUpToDate(derivation);
    const prevSources = derivation.sources;
    derivation.sources = new Array(prevSources.length + 100);
    derivation.unboundSrcsCount = 0;
    const prevDerivationRunId = globalState.derivationRunId;
    globalState.derivationRunId = ++globalState.runId;
    const prevTracking = globalState.trackingDerivation;
    globalState.trackingDerivation = derivation;
    let result;
    try {
        result = f.call(thisArg);
    } catch (e) {
        result = new CaughtException(e);
    }
    globalState.derivationRunId = prevDerivationRunId;
    globalState.trackingDerivation = prevTracking;
    bindDependencies(derivation, prevSources);
    return result;
}

/**
 * diffs newObserving with observing.
 * update observing to be newObserving with unique observables
 * notify observers that become observed/unobserved
 */
function bindDependencies(derivation: IDerivation, prevSources: ISource[]) {
    // invariant(derivation.dependenciesState !== IDerivationState.NOT_TRACKING, "INTERNAL ERROR bindDependencies expects derivation.dependenciesState !== -1");

    //const prevSources = derivation.sources;
    const sources = derivation.sources; // = derivation.newSources!);
    let lowestNewObservingDerivationState: TrackingState = TrackingState.UpToDate;


    // Go through all new sources and check diffValue: (this list can contain duplicates):
    //   0: first occurrence, change to 1 and keep it
    //   1: extra occurrence, drop it
    let i0 = 0;
    let l = derivation.unboundSrcsCount;
    for (let i = 0; i < l; i++) {
        const src = sources[i];
        if (!src.diffValue) {
            src.diffValue = true;
            if (i0 !== i) sources[i0] = src;
            i0++;
        }

        // Upcast is 'safe' here, because if dep is IObservable, `sourcesState` will be undefined,
        // not hitting the condition
        if ((src as any as IDerivation).sourcesState > lowestNewObservingDerivationState) {
            lowestNewObservingDerivationState = (src as any as IDerivation).sourcesState;
        }
    }
    sources.length = i0;

    //derivation.newSources = null; // newObserving shouldn't be needed outside tracking (statement moved down to work around FF bug, see #614)

    // Go through all old observables and check diffValue: (it is unique after last bindDependencies)
    //   0: it's not in new observables, unobserve it
    //   1: it keeps being observed, don't want to notify it. change to 0
    l = prevSources.length;
    while (l--) {
        const src = prevSources[l];
        if (!src.diffValue) {
            removeDerivation(src, derivation);
        }
        src.diffValue = false;
    }

    // Go through all new observables and check diffValue: (now it should be unique)
    //   0: it was set to 0 in last loop. don't need to do anything.
    //   1: it wasn't observed, let's observe it. set back to 0
    while (i0--) {
        const src = sources[i0];
        if (src.diffValue) {
            src.diffValue = false;
            addDerivation(src, derivation);
        }
    }

    // Some new observed derivations may become stale during this derivation computation
    // so they have had no chance to propagate staleness (#916)
    if (lowestNewObservingDerivationState !== TrackingState.UpToDate) {
        derivation.sourcesState = lowestNewObservingDerivationState;
        derivation.onBecomeStale();
    }
}

export function clearSources(derivation: IDerivation) {
    // invariant(globalState.inBatch > 0, "INTERNAL ERROR clearObserving should be called only inside batch");
    const sources = derivation.sources;
    derivation.sources = [];
    let i = sources.length;
    while (i--) removeDerivation(sources[i], derivation);

    derivation.sourcesState = TrackingState.NotTracking;
}

export function replaceSource(derivation: IDerivation, original: ISource, newSource: ISource): boolean {
    const sources = derivation.sources;
    for (let i = 0; i < sources.length; i++) {
        if (sources[i] === original) {
            sources[i] = newSource;
            //NOTE: we are replacing only the first one ... make sure we are not calling this when computing sources for s derivation
            return true;
        }
    }
    return false;
}

export function untracked<T>(action: () => T): T {
    const prev = untrackedStart();
    const res = action();
    untrackedEnd(prev);
    return res;
}

export function untrackedStart(): IDerivation | undefined {
    const prev = globalState.trackingDerivation;
    globalState.trackingDerivation = undefined;
    return prev;
}

export function untrackedEnd(prev: IDerivation | undefined) {
    globalState.trackingDerivation = prev;
}

/**
 * needed to keep `lowestObserverState` correct. when changing from (2 or 1) to 0
 *
 */
export function changeSourcesStateToUpToDate(derivation: IDerivation) {
    if (derivation.sourcesState === TrackingState.UpToDate) return;
    derivation.sourcesState = TrackingState.UpToDate;

    const sources = derivation.sources;
    let i = sources.length;
    while (i--) sources[i].lowestDerivationState = TrackingState.UpToDate;
}
