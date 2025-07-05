import { type IDerivation, TrackingState } from "./derivation";
import { globalState } from "./globalstate";
//import { invariant } from "./utils";
import { runReactions } from "./reaction";
import * as utils from "../utils";



export const derivationSet = new utils.ArraySetImplementation<IDerivation, IDerivation>(
    (a: IDerivation, b: IDerivation) => a === b,
    (derivation: IDerivation) => derivation.derId,
    (derivation: IDerivation) => derivation.derId,
    (derivation: IDerivation) => derivation
);

export interface ISource /*extends IDepTreeNode*/ {
    diffValue: boolean;
    /**
     * Id of the derivation *run* that last accessed this observable.
     * If this id equals the *run* id of the current derivation,
     * the dependency is already established
     */
    lastAccessedBy: number;

    lowestDerivationState: TrackingState; // Used to avoid redundant propagations
    isPendingUntracked: boolean; // Used to push itself to global.pendingUnobservations at most once per batch.

    derivations: utils.ArraySet<IDerivation>; // maintain _observers in raw array for for way faster iterating in propagation.
    //derivationsIndexes: { [__mapId: string]: number }; // map derivation.__mapid to _observers.indexOf(derivation) (see removeObserver)

    onBecomeUtracked(): void;

    //readonly isComputedValue: boolean;
    //evaluateComputedValue(): void;
}

// export function hasObservers(observable: ISource): boolean {
//     return observable.derivations && observable.derivations.length > 0;
// }

// export function getObservers(observable: ISource): IDerivation[] {
//     return observable.derivations;
// }

// function invariantObservers(observable: ISource) {
//     const list = observable.derivations;
//     const map = observable.derivationsIndexes;
//     const l = list.length;
//     for (let i = 0; i < l; i++) {
//         const id = list[i].__mapid;
//         if (i) {
//             invariant(map[id] === i, "INTERNAL ERROR maps derivation.__mapid to index in list"); // for performance
//         } else {
//             invariant(!(id in map), "INTERNAL ERROR observer on index 0 shouldn't be held in map."); // for performance
//         }
//     }
//     invariant(
//         list.length === 0 || Object.keys(map).length === list.length - 1,
//         "INTERNAL ERROR there is no junk in map"
//     );
// }
export function addDerivation(src: ISource, der: IDerivation) {
    // invariant(node.dependenciesState !== -1, "INTERNAL ERROR, can add only dependenciesState !== -1");
    // invariant(observable._observers.indexOf(node) === -1, "INTERNAL ERROR add already added node");
    // invariantObservers(observable);

    derivationSet.add(src.derivations, der);
    // const l = src.derivations.length;
    // if (l) {
    //     // because object assignment is relatively expensive, let's not store data about index 0.
    //     src.derivationsIndexes[der.derId] = l;
    // }
    // src.derivations[l] = der;

    if (src.lowestDerivationState > der.sourcesState)
        src.lowestDerivationState = der.sourcesState;

    // invariantObservers(observable);
    // invariant(observable._observers.indexOf(node) !== -1, "INTERNAL ERROR didn't add node");
}

export function removeDerivation(source: ISource, der: IDerivation) {
    // invariant(globalState.inBatch > 0, "INTERNAL ERROR, remove should be called only inside batch");
    // invariant(observable._observers.indexOf(node) !== -1, "INTERNAL ERROR remove already removed node");
    // invariantObservers(observable);

    if (source.derivations.length === 1) {
        // deleting last observer
        source.derivations.length = 0;

        queueForBecomeUntracked(source);
    } else {
        // deleting from _observersIndexes is straight forward, to delete from _observers, let's swap `node` with last element
        derivationSet.remove(source.derivations, der);
        // const list = source.derivations;
        // const map = source.derivationsIndexes;
        // const filler = list.pop()!; // get last element, which should fill the place of `node`, so the array doesn't have holes
        // if (filler !== der) {
        //     // otherwise node was the last element, which already got removed from array
        //     const index = map[der.derId] || 0; // getting index of `node`. this is the only place we actually use map.
        //     if (index) {
        //         // map store all indexes but 0, see comment in `addObserver`
        //         map[filler.derId] = index;
        //     } else {
        //         delete map[filler.derId];
        //     }
        //     list[index] = filler;
        // }
        // delete map[der.derId];
    }
    // invariantObservers(observable);
    // invariant(observable._observers.indexOf(node) === -1, "INTERNAL ERROR remove already removed node2");
}

export function queueForBecomeUntracked(observable: ISource) {
    if (!observable.isPendingUntracked) {
        // invariant(globalState.inBatch > 0, "INTERNAL ERROR, remove should be called only inside batch");
        // invariant(observable._observers.length === 0, "INTERNAL ERROR, should only queue for unobservation unobserved observables");
        observable.isPendingUntracked = true;
        globalState.pendingUnobservations.push(observable);
    }
}

/**
 * Batch starts a transaction, at least for purposes of memoizing ComputedValues when nothing else does.
 * During a batch `onBecomeUnobserved` will be called at most once per observable.
 * Avoids unnecessary recalculations.
 */
export function startBatch() {
    globalState.inBatch++;
}

export function endBatch() {
    if (--globalState.inBatch === 0) {
        runReactions();
        // the batch is actually about to finish, all unobserving should happen here.
        const sources = globalState.pendingUnobservations;
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < sources.length; i++) {
            const source = sources[i];
            source.isPendingUntracked = false;
            if (source.derivations.length === 0) {
                source.onBecomeUtracked();
                // NOTE: onBecomeUnobserved might push to `pendingUnobservations`
            }
        }
        globalState.pendingUnobservations = [];
    }
}

export function reportRead(source: ISource) {
    const derivation = globalState.trackingDerivation;
    if (derivation !== undefined) {
        /**
         * Simple optimization, give each derivation run an unique id (runId)
         * Check if last time this observable was accessed the same runId is used
         * if this is the case, the relation is already known
         */
        if (globalState.derivationRunId !== source.lastAccessedBy) {
            source.lastAccessedBy = globalState.derivationRunId;
            derivation.sources[derivation.unboundSrcsCount++] = source;
        }
    } else if (source.derivations.length === 0) {
        queueForBecomeUntracked(source);
    }
}


// function invariantLOS(observable: ISource, msg) {
//     // it's expensive so better not run it in produciton. but temporarily helpful for testing
//     const min = observable.derivations.reduce((a, b) => Math.min(a, b.sourcesState), 2);
//     if (min >= observable.lowestDerivationState) return; // <- the only assumption about `lowestObserverState`
//     throw new Error(
//         "lowestObserverState is wrong for " +
//             msg +
//             " because " +
//             min +
//             " < " +
//             observable.lowestDerivationState
//     );
// }

/**
 * NOTE: current propagation mechanism will in case of self reruning autoruns behave unexpectedly
 * It will propagate changes to observers from previous run
 * It's hard or maybe impossible (with reasonable perf) to get it right with current approach
 * Hopefully self reruning autoruns aren't a feature people should depend on
 * Also most basic use cases should be ok
 */

// Called by Atom when its value changes
export function propagateChanged(source: ISource) {
    // invariantLOS(observable, "changed start");
    if (source.lowestDerivationState === TrackingState.Stale) return;
    source.lowestDerivationState = TrackingState.Stale;

    const derivations = source.derivations;
    const step = derivationSet.step(derivations);
    //TODO: think if we shoud iterate rather normally
    //for(let i = derivations.length - step; i >= 0; i -= step) {
    for (let i = step - 1, len = derivations.length; i < len; i += step) {
        const d = derivations[i];
        if (d.sourcesState === TrackingState.UpToDate) d.onBecomeStale();
        d.sourcesState = TrackingState.Stale;
    }
    // invariantLOS(observable, "changed end");
}

// Called by ComputedValue when it recalculate and its value changed
export function propagateChangeConfirmed(source: ISource) {
    // invariantLOS(observable, "confirmed start");
    if (source.lowestDerivationState === TrackingState.Stale) return;
    source.lowestDerivationState = TrackingState.Stale;

    const derivations = source.derivations;
    const step = derivationSet.step(derivations);
    //TODO: think if we shoud iterate rather normally
    //for(let i = derivations.length - step; i >= 0; i -= step) {
    for (let i = step - 1, len = derivations.length; i < len; i += step) {
        const d = derivations[i];
        if (d.sourcesState === TrackingState.PossiblyStale)
            d.sourcesState = TrackingState.Stale;
        else if (
            d.sourcesState === TrackingState.UpToDate // this happens during computing of `d`, just keep lowestObserverState up to date.
        )
            source.lowestDerivationState = TrackingState.UpToDate;
    }
    // invariantLOS(observable, "confirmed end");
}

// Used by computed when its dependency changed, but we don't wan't to immediately recompute.
export function propagateMaybeChanged(source: ISource) {
    // invariantLOS(observable, "maybe start");
    if (source.lowestDerivationState !== TrackingState.UpToDate) return;
    source.lowestDerivationState = TrackingState.PossiblyStale;

    const derivations = source.derivations;
    const step = derivationSet.step(derivations);
    //TODO: think if we shoud iterate rather normally
    //for(let i = derivations.length - step; i >= 0; i -= step) {
    for (let i = step - 1, len = derivations.length; i < len; i += step) {
        const d = derivations[i];
        if (d.sourcesState === TrackingState.UpToDate) {
            d.sourcesState = TrackingState.PossiblyStale;
            d.onBecomeStale();
        }
    }
    // invariantLOS(observable, "maybe end");
}
