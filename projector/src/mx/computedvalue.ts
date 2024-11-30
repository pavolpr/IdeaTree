import {
    ISource,
    reportRead,
    propagateMaybeChanged,
    propagateChangeConfirmed,
    startBatch,
    endBatch,
    //getObservers
} from "./source";
import {
    IDerivation,
    TrackingState, TrackingStateMasks,
    trackDerivedFunction,
    clearSources,
    //untrackedStart,
    //untrackedEnd,
    shouldCompute,
    CaughtException,
    isCaughtException,
    //replaceSource
} from "./derivation";
import { globalState, getNextId, invariant } from "./globalstate";
//import { createAction } from "./action";
// import {
//     //createInstanceofPredicate,
//     getNextId,
//     invariant,
//     //Lambda,
//     //unique,
//     //joinStrings,
//     //primitiveSymbol,
//     //toPrimitive
// } from "./utils";
//import { isSpyEnabled, spyReport } from "./spy";
// import { autorun } from "../api/autorun";
//import { IEqualsComparer } from "./comparer";
// import { IValueDidChange } from "../types/observablevalue";
//import { getMessage } from "../utils/messages";

export interface IComputedValue<T> {
    get(): T;
    // set(value: T): void;
    //observe(listener: (change: IValueDidChange<T>) => void, fireImmediately?: boolean): Lambda;
}

/**
 * A node in the state dependency root that observes other nodes, and can be observed itself.
 *
 * ComputedValue will remember the result of the computation for the duration of the batch, or
 * while being observed.
 *
 * During this time it will recompute only when one of its direct dependencies changed,
 * but only when it is being accessed with `ComputedValue.get()`.
 *
 * Implementation description:
 * 1. First time it's being accessed it will compute and remember result
 *    give back remembered result until 2. happens
 * 2. First time any deep dependency change, propagate POSSIBLY_STALE to all observers, wait for 3.
 * 3. When it's being accessed, recompute if any shallow dependency changed.
 *    if result changed: propagate STALE to all observers, that were POSSIBLY_STALE from the last step.
 *    go to step 2. either way
 *
 * If at any point it's outside batch and it isn't observed: reset everything and go to 1.
 */

export interface ComputedValue<T> {
    isComputedValue: boolean; //ComputedValue.prototype.isComputedValue = true;
}
export class ComputedValue<T, S = object | undefined> implements ISource, IComputedValue<T>, IDerivation {
    protected _state: TrackingState = TrackingState.UpToDate; //1
    
    get lowestDerivationState(): TrackingState { return this._state & TrackingStateMasks.stateMask; }
    set lowestDerivationState(value: TrackingState) { this._state = (value & TrackingStateMasks.stateMask) | (this._state & ~TrackingStateMasks.stateMask); }
    //lowestDerivationState = TrackingState.UpToDate;

    get isPendingUntracked(): boolean { return (this._state & TrackingStateMasks.isPendingUntrackedBit) !== 0; }
    set isPendingUntracked(value: boolean) {  this._state = value ? (this._state | TrackingStateMasks.isPendingUntrackedBit) : (this._state & ~TrackingStateMasks.isPendingUntrackedBit); }
    //isPendingUntracked: boolean = false;
    
    get diffValue(): boolean { return (this._state & TrackingStateMasks.diffValueBit) !== 0; }
    set diffValue(value: boolean) { this._state = value ? (this._state | TrackingStateMasks.diffValueBit) : (this._state & ~TrackingStateMasks.diffValueBit); }
    //diffValue = false;
    
    get sourcesState(): TrackingState { return (this._state >> TrackingStateMasks.hiStateShift) & TrackingStateMasks.stateMask; }
    set sourcesState(value: TrackingState) { 
        this._state = ((value << TrackingStateMasks.hiStateShift) & TrackingStateMasks.hiStateMask) | (this._state & ~TrackingStateMasks.hiStateMask); 
    }
    //sourcesState = TrackingState.NotTracking; //0
    
    get isComputing(): boolean { return (this._state & TrackingStateMasks.isComputingBit) !== 0; }
    set isComputing(value: boolean) { this._state = value ? (this._state | TrackingStateMasks.isComputingBit) : (this._state & ~TrackingStateMasks.isComputingBit); }
    //isComputing: boolean = false; // to check for cycles
    
    sources = []; // nodes we are looking at. Our value depends on these nodes
    //newSources = null; // during tracking it's an array with new observed observers
    unboundSrcsCount = 0;

    derivations = [];
    // runId = 0;
    lastAccessedBy = 0;
    derId = getNextId();
    protected value: T | undefined | CaughtException = new CaughtException(null);
    
    derivation!: (this: S) => T //must be defined in a derived class or given by the constructor
    /**
     * Create a new computed value based on a function expression.
     *
     * The `name` property is for debug purposes only.
     *
     * The `equals` property specifies the comparer function to use to determine if a newly produced
     * value differs from the previous value. Two comparers are provided in the library; `defaultComparer`
     * compares based on identity comparison (===), and `structualComparer` deeply compares the structure.
     * Structural comparison can be convenient if you always produce an new aggregated object and
     * don't want to notify observers if it is structurally the same.
     * This is useful for working with vectors, mouse coordinates etc.
     */
    constructor(
        public scope: S,
        derivation?: (this: S) => T,
        //private equals: IEqualsComparer<any>,
        //name: string,
        //setter?: (v: T) => void
    ) {
        if(derivation) this.derivation = derivation;
        //this.name = name || "ComputedValue@" + getNextId();
        //if (setter) this.setter = createAction(name + "-setter", setter) as any;
    }

    onBecomeStale() {
        propagateMaybeChanged(this);
    }

    onBecomeUtracked() {
        clearSources(this);
        this.value = undefined;
    }

    /**
     * Returns the current value of this computed value.
     * Will evaluate its computation first if needed.
     */
    public get(): T {
        invariant(!this.isComputing, `Cycle detected in computation ${this.derId}`, this.derivation);
        if (globalState.inBatch === 0) {
            // This is an minor optimization which could be omitted to simplify the code
            // The computedValue is accessed outside of any mobx stuff. Batch observing should be enough and don't need
            // tracking as it will never be called again inside this batch.
            startBatch();
            if (shouldCompute(this)) this.value = this.computeValue(false);
            endBatch();
        } else {
            reportRead(this);
            if (shouldCompute(this))
                if (this.trackAndCompute())
                    propagateChangeConfirmed(this);
        }
        const result = this.value!;

        if (isCaughtException(result)) throw result.cause;
        return result;
    }

    public peek(): T {
        const res = this.computeValue(false);
        if (isCaughtException(res)) throw res.cause;
        return res;
    }

    // public set(value: T) {
    //     if (this.setter) {
    //         invariant(
    //             !this.isRunningSetter,
    //             `The setter of computed value '${this
    //                 .name}' is trying to update itself. Did you intend to update an _observable_ value, instead of the computed property?`
    //         );
    //         this.isRunningSetter = true;
    //         try {
    //             this.setter.call(this.scope, value);
    //         } finally {
    //             this.isRunningSetter = false;
    //         }
    //     } else
    //         invariant(
    //             false,
    //             `[ComputedValue '${this
    //                 .name}'] It is not possible to assign a new value to a computed value.`
    //         );
    // }

    private trackAndCompute(): boolean {
        // if (isSpyEnabled()) {
        //     spyReport({
        //         object: this.scope,
        //         type: "compute",
        //         fn: this.derivation
        //     });
        // }
        const oldValue = this.value;
        const wasSuspended = /* see #1208 */ this.sourcesState === TrackingState.NotTracking;
        const newValue = (this.value = this.computeValue(true));
        return (
            wasSuspended ||
            isCaughtException(oldValue) ||
            isCaughtException(newValue) ||
            oldValue !== newValue //!this.equals(oldValue, newValue)
        );
    }

    // evaluateComputedValue(): void {
    //     this.get();
    // }

    computeValue(track: boolean) {
        this.isComputing = true;
        globalState.computationDepth++;
        let res: T | CaughtException;
        if (track) {
            res = trackDerivedFunction(this, this.derivation, this.scope);
        } else {
            try {
                res = this.derivation.call(this.scope);
            } catch (e) {
                res = new CaughtException(e);
            }
        }
        globalState.computationDepth--;
        this.isComputing = false;
        return res;
    }

    // replaceSource(original: ISource, newSource: ISource): boolean {
    //     return replaceSource(this, original, newSource);
    // }

    // observe(listener: (change: IValueDidChange<T>) => void, fireImmediately?: boolean): Lambda {
    //     let firstTime = true;
    //     let prevValue: T | undefined; // = undefined;
    //     return autorun(() => {
    //         const newValue = this.get();
    //         if (!firstTime || fireImmediately) {
    //             const prevU = untrackedStart();
    //             listener({
    //                 type: "update",
    //                 object: this,
    //                 newValue,
    //                 oldValue: prevValue
    //             });
    //             untrackedEnd(prevU);
    //         }
    //         firstTime = false;
    //         prevValue = newValue;
    //     });
    // }

    toJSON() {
        return this.get();
    }

    toString() {
        return `${this.derId}[${this.derivation.toString()}]`;
    }

    // valueOf(): T {
    //     return toPrimitive(this.get());
    // }

//     whyRun() {
//         const isTracking = Boolean(globalState.trackingDerivation);
//         const observing = unique(this.isComputing ? this.newObserving! : this.observing).map(
//             (dep: any) => dep.name
//         );
//         const observers = unique(getObservers(this).map(dep => dep.name));
//         return (
//             `
// WhyRun? computation '${this.name}':
//  * Running because: ${isTracking
//      ? "[active] the value of this computation is needed by a reaction"
//      : this.isComputing
//        ? "[get] The value of this computed was requested outside a reaction"
//        : "[idle] not running at the moment"}
// ` +
//             (this.dependenciesState === IDerivationState.NOT_TRACKING
//                 ? getMessage("m032")
//                 : ` * This computation will re-run if any of the following observables changes:
//     ${joinStrings(observing)}
//     ${this.isComputing && isTracking
//         ? " (... or any observable accessed during the remainder of the current run)"
//         : ""}
//     ${getMessage("m038")}

//   * If the outcome of this computation changes, the following observers will be re-run:
//     ${joinStrings(observers)}
// `)
//         );
//     }
}
ComputedValue.prototype.isComputedValue = true;

//(ComputedValue.prototype as any)[primitiveSymbol()] = ComputedValue.prototype.valueOf;

export function isComputedValue(x: any): x is IComputedValue<any> {
    //return x instanceof ComputedValue;
    return x && x.isComputedValue === true;
} 
//= createInstanceofPredicate("ComputedValue", ComputedValue);
