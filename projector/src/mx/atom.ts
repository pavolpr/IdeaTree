// tslint:disable-next-line:no-empty-interface
export interface IAtom extends ISource {
    reportRead(): void;
    reportChanged(): void;
}

/**
 * Anything that can be used to _store_ state is an Atom in mobx. Atoms have two important jobs
 *
 * 1) detect when they are being _used_ and report this (using reportObserved). This allows mobx to make the connection between running functions and the data they used
 * 2) they should notify mobx whenever they have _changed_. This way mobx can re-run any functions (derivations) that are using this atom.
 */
export class Atom implements IAtom {
    protected _state: TrackingState = TrackingState.NotTracking; //0
    
    get lowestDerivationState(): TrackingState { return this._state & TrackingStateMasks.stateMask; }
    set lowestDerivationState(value: TrackingState) { this._state = (value & TrackingStateMasks.stateMask) | (this._state & ~TrackingStateMasks.stateMask); }
    //lowestDerivationState = TrackingState.NotTracking;

    get isPendingUntracked(): boolean { return true; }
    set isPendingUntracked(_value: boolean) { }
    //isPendingUntracked = true; // for effective unobserving. BaseAtom has true, for extra optimization, so its onBecomeUnobserved never gets called, because it's not needed
    
    get diffValue(): boolean { return (this._state & TrackingStateMasks.diffValueBit) !== 0; }
    set diffValue(value: boolean) { this._state = value ? (this._state | TrackingStateMasks.diffValueBit) : (this._state & ~TrackingStateMasks.diffValueBit); }
    //diffValue = false;
    
    derivations: utils.ArraySet<IDerivation> = [];
    
    lastAccessedBy = 0;

    //isComputedValue: boolean; //Atom.prototype.isComputedValue = false;
    //evaluateComputedValue(): void { }

    /**
     * Create a new atom. For debugging purposes it is recommended to give it a name.
     * The onBecomeObserved and onBecomeUnobserved callbacks can be used for resource management.
     */
    constructor(/*public name = "Atom@" + getNextId()*/) {}

    onBecomeUtracked() {
        // noop ... should be never called, because it has IsPendingUntracked set to true forever
    }

    /**
     * Invoke this method to notify mobx that your atom has been used somehow.
     */
    // public reportRead() {
    //     reportReadAtom(this);
    // }
    reportRead() {
        const derivation = globalState.trackingDerivation;
        if (derivation !== undefined) {
            /**
             * Simple optimization, give each derivation run an unique id (runId)
             * Check if last time this observable was accessed the same runId is used
             * if this is the case, the relation is already known
             */
            if (globalState.derivationRunId !== this.lastAccessedBy) {
                this.lastAccessedBy = globalState.derivationRunId;
                derivation.sources[derivation.unboundSrcsCount++] = this;
            }
        } 
        // else if (source.derivations.length === 0) {
        //     queueForBecomeUntracked(source);
        // }
    }

    /**
     * Invoke this method _after_ this method has changed to signal mobx that all its observers should invalidate.
     */
    public reportChanged() {
        if(this.derivations.length > 0) {
            startBatch();
            propagateChanged(this);
            endBatch();
        }
    }

    checkCanMutate() {
        if(this.derivations.length === 0)
            return;
        // Should never be possible to change an observed observable from inside computed, see #798
        if (globalState.computationDepth > 0) 
            throwError("Computed values are not allowed to cause side effects. Tried to modify: " + this);
        // Should not be possible to change observed state outside strict mode, except during initialization, see #563
        if (!globalState.allowStateChanges)
            throwError("Side effects like changing state are not allowed at this point. Tried to modify: " + this);
    }

    replaceWith(newAtomValue: Atom): void {
        this.checkCanMutate();
        const derivations = this.derivations;
        const step = derivationSet.step(derivations);
        for(let i = step - 1, len = derivations.length; i < len; i += step) {
            const der = derivations[i];
            if (!replaceSource(der, this, newAtomValue))
                throw new Error("Some new atom value was not replaced in the old derivations' sources.");
        }
        // replace state and derivations of this (should be TrackingState.NotTracking and empty)
        this._state = newAtomValue._state;
        this.derivations = newAtomValue.derivations;
        this.lastAccessedBy = 0; // for sure - should have no effect as the next derivation should not be inside an action
        newAtomValue._state = this._state;
        newAtomValue.derivations = derivations;
        //newAtomValue.reportChanged();
    }

    toString() {
        return "Atom";
    }
}
//Atom.prototype.isComputedValue = false;


export interface IAtomValue<T> extends IAtom {
    get(): T;
    set(value: T): boolean;
    getUntracked(): T;
    reportRead(): void;
    //replaceWith(newAtomValue: IAtom): void;
    clear(): boolean;
    checkCanMutate(): void;
}

export class AtomValue<T> extends Atom  implements IAtomValue<T> {
    protected value: T;
    
    constructor(value: T) {
        super();
        this.value = value;
    }

    get(): T {
        this.reportRead();
        return this.value;
    }
    getUntracked(): T {
        return this.value;
    }

    set(newValue: T): boolean {
        this.checkCanMutate();
        
        if (this.value !== newValue) {
            this.value = newValue;
            this.reportChanged();
            return true;
        }
        return false;
    }

    clear(): boolean {
        this.checkCanMutate();
        if (this.value === undefined) {
            return false;
        }
        this.value = undefined!;
        this.reportChanged();
        return true;
    }
    
    toJSON() {
        return this.get();
    }

    toString() {
        return `atom[${this.value}]`;
    }
}


//export const isAtom = (x: any) => x instanceof Atom; //  createInstanceofPredicate("Atom", Atom);
(AtomValue.prototype as any).isMXAtomValue = true;
export function isAtomValue(x: any): x is IAtomValue<any> {
    //return x instanceof AtomValue;
    return x && x.isMXAtomValue === true;
}
// export const isAtomValue = createInstanceofPredicate("AtomValue", AtomValue) as (
//     x: any
// ) => x is IAtomValue<any>;

import { globalState, throwError } from "./globalstate";
import { ISource, propagateChanged, startBatch, endBatch, derivationSet } from "./source";
import { IDerivation, TrackingState, TrackingStateMasks, replaceSource } from "./derivation";
import * as utils from "../utils";

