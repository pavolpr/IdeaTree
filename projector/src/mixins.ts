//won't be this  https://en.wikipedia.org/wiki/C3_linearization (good only for Method Resolution Order (MRO))
//but Scala like traits: 
// - https://www.aptsoftware.com/scala-linearization-technique-to-avoid-multiple-inheritance/
// one implementation: https://github.com/tannerntannern/ts-mixer
//then see https://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/
//     and in TS https://github.com/Microsoft/TypeScript/pull/13743#issuecomment-299540915
//
//see also 
//   https://github.com/traitsjs/traits.js
//   https://github.com/michaelolof/typescript-mix/blob/master/src/index.ts

import { INodeRef } from "./node";

//export type Class<Inst, Stat> = (new (...args: any[]) => Inst) & Stat;
//export type Class<Inst, Stat> = { new(...args: any[]): Inst } & { [K in keyof Stat]: Stat[K] };
export type Ctor<T = any> = new (...args: any[]) => T;

export const _appliedMixins = Symbol('appliedMixins');

//export type MixinFactory<T extends B, B = object> = (superclass: Constructor<B>) => Constructor<T>;
//export type MixinFactory<Ider extends Ibase, Sder extends Sbase, Ibase = object, Sbase = object> = (superclass: Class<Ibase, Sbase>) => Class<Ider, Sder>;
export type MixinFactory<CSub extends CSuper, CSuper extends Ctor> = (superclass: CSuper) => CSub;

//export class Mixin<M extends B, B = object> {
//export class Mixin<IM extends IB, SM extends SB, IB = object, SB = object> {
export class Mixin<CM extends CB, CB extends Ctor = ObjectConstructor> {
    name: string = "<unapplied>"
    readonly appliedTo: Map<CB /*superclass*/, Ctor/*subclass*/> = new Map();
    
    //constructor(public factory: MixinFactory<IM, SM, IB, SB>) {}
    constructor(readonly def: INodeRef, public factory: MixinFactory<CM, CB>) {}
    
    makeSubclass(superclass: CB) {
        if(this.isIn(superclass.prototype))
            return superclass;
               
        const appliedTo = this.appliedTo;
        let subclass = appliedTo.get(superclass);
        if (!subclass) {
            subclass = this.factory(superclass);
            this.name = subclass.name;
            let upper = subclass.prototype[_appliedMixins] as Set<Mixin<any, any>>;
            let current = upper ? new Set(upper) : new Set<Mixin<any, any>>();
            current.add(this);
            subclass.prototype[_appliedMixins] = current;
            
            appliedTo.set(superclass, subclass);
        }

        return subclass;            
    }

    isIn(o: any) {
        return !!(o?.[_appliedMixins] as Set<any>)?.has(this);
    }
}

type Props<T> = { [K in keyof T]: T[K] };

//type Subclass1<B extends Ctor, M1 extends Ctor> = Ctor<InstanceType<B> & InstanceType<M1>> & Props<B> & Props<M1>;
//type Subclass2<B extends Ctor, M1 extends Ctor, M2 extends Ctor> = Ctor<InstanceType<B> & InstanceType<M1> & InstanceType<M2>> & Props<B> & Props<M1> & Props<M2>;

export function mix<B extends Ctor>(superclass: B): B;
export function mix<B extends B1, M1 extends B1, B1 extends Ctor>(superclass: B, m1: Mixin<M1, B1>): Ctor<InstanceType<B> & InstanceType<M1>> & Props<B> & Props<M1>;
//export function mix<B extends B1, M1 extends B1, B1>(superclass: Constructor<B>, m1: Mixin<M1, B1>): Constructor<B & M1>;
//export function mix<IB extends IB1, SB extends SB1, IM1 extends IB1, SM1 extends SB1, IB1, SB1>(superclass: Class<IB, SB>, m1: Mixin<IM1, SM1, IB1, SB1>): Class<IB & IM1, SB & SM1>;
//export function mix<B extends B1 & B2, M1 extends B1, B1, M2 extends B2, B2>(superclass: Constructor<B>, m1: Mixin<M1, B1>, m2: Mixin<M2, B2>): Constructor<B & M1 & M2>;
export function mix<B extends B1 & B2, M1 extends B1, B1 extends Ctor, M2 extends B2, B2 extends Ctor>(superclass: B, m1: Mixin<M1, B1>, m2: Mixin<M2, B2>): 
        Ctor<InstanceType<B> & InstanceType<M1> & InstanceType<M2>> & Props<B> & Props<M1> & Props<M2>;
export function mix<B extends B1 & B2 & B3, M1 extends B1, B1 extends Ctor, M2 extends B2, B2 extends Ctor, M3 extends B3, B3 extends Ctor>
        (superclass: B, m1: Mixin<M1, B1>, m2: Mixin<M2, B2>, m3: Mixin<M3, B3>): 
        Ctor<InstanceType<B> & InstanceType<M1> & InstanceType<M2> & InstanceType<M3>> & Props<B> & Props<M1> & Props<M2> & Props<M3>;
export function mix<B extends B1 & B2 & B3 & B4, M1 extends B1, B1 extends Ctor, M2 extends B2, B2 extends Ctor, M3 extends B3, B3 extends Ctor, M4 extends B4, B4 extends Ctor>
        (superclass: B, m1: Mixin<M1, B1>, m2: Mixin<M2, B2>, m3: Mixin<M3, B3>, m4: Mixin<M4, B4>): 
        Ctor<InstanceType<B> & InstanceType<M1> & InstanceType<M2> & InstanceType<M3> & InstanceType<M4>> & Props<B> & Props<M1> & Props<M2> & Props<M3> & Props<M4>;
export function mix(superclass: Ctor, ...mixins: Mixin<any, any>[]) {
    let c = superclass;
    for(let m of mixins) c = m.makeSubclass(c);
    //return mixins.reduce((c, m) => m.makeSubclass(c), superclass);
    return c;
}

/*
class BaseClass
trait Trait1 extends BaseClass
trait Trait2 extends BaseClass
trait Trait3 extends Trait2
class DerrivedClass extends BaseClass with Trait1, Trait3
*/
/*
class BaseClass {
    protected m: any;
    price = 20;
    get baseG() { return 1; }
    baseFun() {}
    iam() {
        console.log("BaseClass");
    }
    static staticBaseFun() {}
}
class OtherClass extends BaseClass {
    protected m: any;

    other = 20;
    price = 20;
    get baseG() { return 1; }
    baseFun() {}
    iam() {
        console.log("OtherClass");
    }
}

let T1 = new Mixin((sc: typeof BaseClass) => class T1 extends sc  {
    t1: string = "t1"
    iam() {
        console.log(this.t1);
        super.iam();
    }
    static t1StaticFun() {}
});

let T2 = new Mixin((sc: typeof BaseClass) => class T2 extends sc  {
    t2: string = "t2"
    iam() {
        console.log(this.t2);
        super.iam();
    }
    static staticT2fun() {}
});

let T3 = new Mixin((sc: typeof OtherClass) => class T3 extends mix(sc, T2)  {
    t3: string = "t3";
    //get baseG() { return 1 + super.baseG; }
    iam() {
        console.log(this.t3);
        super.iam();
    }
    t3fun() {
        //super.baseG; 
    }
    baseFun() {
        super.baseFun();
        //this.m;
        this.other;
    }
    static staticT3fun() {}
});

class DerrivedClass extends mix(OtherClass, T3, T1) {
    d: string = "dc"
    iam() {
        console.log("DerrivedClass");
        super.iam();
    }
}

DerrivedClass.t1StaticFun

let dc = new DerrivedClass();
dc.iam();
console.log(T3.isIn(dc));
console.log(dc)

*/