const primes = [
    3, 7, 11, 17, 23, 29, 37, 47, 59, 71, 89, 107, 131, 163, 197, 239, 293, 353, 431, 521, 631, 761, 919,
    1103, 1327, 1597, 1931, 2333, 2801, 3371, 4049, 4861, 5839, 7013, 8419, 10103, 12143, 14591,
    17519, 21023, 25229, 30293, 36353, 43627, 52361, 62851, 75431, 90523, 108631, 130363, 156437,
    187751, 225307, 270371, 324449, 389357, 467237, 560689, 672827, 807403, 968897, 1162687, 1395263,
    1674319, 2009191, 2411033, 2893249, 3471899, 4166287, 4999559, 5999471, 7199369
];

function isPrime(candidate: number) {
    if ((candidate & 1) !== 0) {
        const limit = Math.sqrt(candidate) | 0;
        for (let divisor = 3; divisor <= limit; divisor += 2) {
            if ((candidate % divisor) === 0)
                return false;
        }
        return true;
    }
    return (candidate === 2);
}

const int32MaxValue = 0x7fffffff; //((1 << 31) - 1) | 0;  //Number.MAX_SAFE_INTEGER;

function getPrime(min: number): number {
    if (!(min >= 0 && min <= int32MaxValue))
        throw new Error("Arg_HTCapacityOverflow");
    //Contract.EndContractBlock();

    for (const prime of primes) {
        if (prime >= min)
            return prime;
    }

    //outside of our plredefined table.
    //compute the hard way.
    for (let i = (min | 1); i < int32MaxValue; i += 2) {
        if (isPrime(i) /*&& ((i - 1) % 101 /*Hashtable.HashPrime* / !== 0)*/)
            return i;
    }
    return min;
}
// This is the maximum prime smaller than Array.MaxArrayLength
const maxPrimeArrayLength = 0x7FEFFFFD;
function expandPrime(oldSize: number) {
    const newSize = oldSize * 2; //<< 1;

    // Allow the hashtables to grow to maximum possible size (~2G elements) before encoutering capacity overflow.
    // Note that this check works even when _items.Length overflowed thanks to the (uint) cast
    if (newSize > maxPrimeArrayLength && maxPrimeArrayLength > oldSize) {
        //Contract.Assert(MaxPrimeArrayLength == GetPrime(MaxPrimeArrayLength), "Invalid MaxPrimeArrayLength");
        return maxPrimeArrayLength;
    }

    return getPrime(newSize);
}

//**** Dictionary ****

const lower31BitMask = 0x7FFFFFFF;


// //TODO: try if plain object would be faster
// //MAYBE: flatten the entry into the entries array
// export class DictEntry<TKey, TValue> {
//     hashCode: number;    // Lower 31 bits of hash code, -1 if unused
//     next: number;        // Index of next entry, -1 if last
//     key: TKey;           // Key of entry
//     value: TValue;         // Value of entry
//     constructor(hashCode: number, next: number, key: TKey, value: TValue) {
//         this.hashCode = hashCode;
//         this.next = next;
//         this.key = key;
//         this.value = value;
//     }
//     // toString() {
//     //     return `{${this.key}->${this.value}}`;
//     // }
// }

// export interface IDictComparer<TKey> {
//     hashCode(key: TKey): number;
//     equals(key1: TKey, key2: TKey): boolean;
// }

// export class Dict<TKey, TValue> {
//     comparer: IDictComparer<TKey>;
//     buckets: Int32Array; //length is the size
//     entries: Array<DictEntry<TKey, TValue>>; //only pushing to this one
//     //count: number; //count === entries.length
//     freeList: number;
//     //freeCount: number;

//     constructor(comparer: IDictComparer<TKey>, initialCapacity?: number) {
//         this.comparer = comparer;
//         // call initialize()  "early" to make sure (easy to reason) the instance has always the same hidden class
//         this.initialize(initialCapacity !== undefined ? initialCapacity : 0);
//     }
//     containsKey(key: TKey): boolean {
//         return this.findEntry(key) >= 0;
//     }
//     get(key: TKey) {
//         const i = this.findEntry(key);
//         if (i >= 0)
//             return this.entries[i].value;
//         return undefined;
//     }
//     add(key: TKey, value: TValue) {
//         this.insert(key, value, true);
//     }
//     put(key: TKey, value: TValue) {
//         this.insert(key, value, false);
//     }
//     remove(key: TKey): boolean {
//         if(key == null) {
//             throw new Error("A null or undefined key is not allowed.");
//         }
//         const buckets = this.buckets;
//         if (buckets !== undefined) {
//             const comparer = this.comparer;
//             const hashCode = comparer.hashCode(key) & lower31BitMask;
//             const bucket = hashCode % buckets.length;
//             const entries = this.entries;
//             let last = -1;
//             for (let i = buckets[bucket]; i >= 0; ) {
//                 const entry = entries[i];
//                 if (entry.hashCode === hashCode && comparer.equals(entry.key, key)) {
//                     if (last < 0) {
//                         buckets[bucket] = entry.next;
//                     } else {
//                         entries[last].next = entry.next;
//                     }
//                     entry.hashCode = -1;
//                     entry.next = this.freeList;
//                     entry.key = undefined!;
//                     entry.value = undefined!;
//                     this.freeList = i;
//                     //freeCount++;
//                     //version++;
//                     return true;
//                 }
//                 last = i;
//                 i = entry.next;
//             }
//         }
//         return false;
//     }
//     private initialize(capacity: number) {
//         const size = getPrime(capacity);
//         const buckets = new Int32Array(size);
//         //buckets.fill(-1); unfortunately no support on IE, Safari, even mobile Chrome ...
//         for (let i = 0; i < buckets.length; i++) buckets[i] = -1;
//         this.buckets = buckets;
//         //this.entries = new Array<DictEntry<TKey, TValue>>(size);
//         this.entries = []; // maybe [] is "better" as some engines does not optimize the above as expected
//         this.freeList = -1;
//         //this.freeCount = 0;
//     }
//     private findEntry(key: TKey): number {
//         // key !== null | undefined, i.e., == null is by intent (not ===)
//         if(key == null) { 
//             //ThrowHelper.ThrowArgumentNullException(ExceptionArgument.key);
//             throw new Error("A null or undefined key is not allowed.");
//         }
//         const buckets = this.buckets;
//         if (buckets !== undefined) {
//             const comparer = this.comparer;
//             const hashCode = comparer.hashCode(key) & lower31BitMask;
//             const entries = this.entries;
//             for (let i = buckets[hashCode % buckets.length]; i >= 0; ) {
//                 const entry = entries[i];
//                 if (entry.hashCode === hashCode && comparer.equals(entry.key, key))
//                     return i;
//                 i = entry.next;
//             }
//         }
//         return -1;
//     }

//     private insert(key: TKey, value: TValue, add: boolean) {
//         // key !== null | undefined, i.e., == null is by intent (not ===)
//         if(key == null) {
//             throw new Error("null or undefined keys not supported.");
//         }

//         if (this.buckets === undefined) this.initialize(0);
//         const comparer = this.comparer;
//         const hashCode = comparer.hashCode(key) & 0x7FFFFFFF;
//         let buckets = this.buckets;
//         let targetBucket = hashCode % buckets.length;
//         const entries = this.entries;

//         for (let i = buckets[targetBucket]; i >= 0; ) {
//             const entry = entries[i];
//             if (entry.hashCode === hashCode && comparer.equals(entry.key, key)) {
//                 if (add) {
//                     throw new Error(`Adding duplicate key:${key}.`);
//                 }
//                 entry.value = value;
//                 return;
//             }
//             i = entry.next;
//         }
//         let index;
//         //if (this.freeCount > 0) {
//         if (this.freeList >= 0) {
//             index = this.freeList;
//             const entryAtIndex = entries[index];
//             this.freeList = entryAtIndex.next;
//             //this.freeCount--;
//             entryAtIndex.hashCode = hashCode;
//             entryAtIndex.next = buckets[targetBucket];
//             entryAtIndex.key = key;
//             entryAtIndex.value = value;
//         } else {
//             const count = entries.length; // no free entry, so entries.length == count
//             if (count === buckets.length) { // and buckets.length == size, so count === size
//                 this.resize();
//                 buckets = this.buckets;
//                 targetBucket = hashCode % buckets.length;
//             }
//             //index = this.count;
//             index = count;
//             //entries[index] = new DictEntry<TKey, TValue>(hashCode, buckets[targetBucket], key, value);
//             entries.push(new DictEntry<TKey, TValue>(hashCode, buckets[targetBucket], key, value));
//             //this.count++;
//         }

//         buckets[targetBucket] = index;
//         //version++;
//     }

//     private resize() {
//         //INVARIANT: this.freeList === -1 && count === entries.length && count === buckets.length
//         const entries = this.entries;
//         //if(entries.length !== this.buckets.length)
//         //    throw new Error("Expected entries.length === buckets.length");
//         //const count = entries.length;
//         const newSize = expandPrime(entries.length);
//         //Contract.Assert(newSize >= entries.Length);
//         const newBuckets = new Int32Array(newSize);
//         for (let i = 0; i < newBuckets.length; i++) newBuckets[i] = -1;

//         //Entry[] newEntries = new Entry[newSize];
//         //Array.Copy(entries, 0, newEntries, 0, count);

//         // redistribute all entries, except non-free ones
//         for (let i = 0; i < entries.length; i++) {
//             const entry = entries[i];
//             const hc = entry.hashCode;
//             if (hc >= 0) { //a valid/non-free entry
//                 const bucket = hc % newSize;
//                 entry.next = newBuckets[bucket];
//                 newBuckets[bucket] = i;
//             }
//         }
//         this.buckets = newBuckets;
//         //entries = newEntries;
//     }
// }

// Entries:
//  lenght <= 8 ... array of values
//  lenght > 8 ... array of Entries
//    e[0] ... array of buckets

// Entry:
//   value
//   next

// removing is done always from the end, which will fill in the deleted entry (if not at the end)

const lengthThreshold = 8;
const initialSize = expandPrime(lengthThreshold + 1);

export type ArraySet<T> = T[];

// export function arraySetStep<T>(set: ArraySet<T>): number {
//     return set.length <= lengthThreshold ? 1 : 2;
// }

export class ArraySetImplementation<Key, T> {
    wasCreated: boolean = false;
    lastIndex?: number = undefined;
    readonly equals: (key: Key, value: T) => boolean;
    readonly hash: (key: Key) => number;
    readonly hashValue: (value: T) => number;
    readonly create: (key: Key) => T;

    constructor(
        equals: (key: Key, value: T) => boolean,
        hash: (key: Key) => number,
        hashValue: (value: T) => number,
        create: (key: Key) => T,
    ) {
        this.equals = equals;
        this.hash = hash;
        this.hashValue = hashValue;
        this.create = create;
    }

    // contains(set: ArraySet<T>, value: T): boolean {
    //     return this.get(set, value) !== undefined;
    // }

    get(set: ArraySet<T>, key: Key): T | undefined {
        if (key === undefined) {
            throw new Error("undefined set key is not allowed.");
        }
        const equals = this.equals;
        if (set.length <= lengthThreshold) {
            for (let i = 0; i < set.length; i++) {
                const entryValue = set[i];
                if (equals(key, entryValue)) {
                    this.lastIndex = i;
                    return entryValue;
                }
            }
            this.lastIndex = undefined;
            return undefined;
        }

        const buckets = set[0] as any as Int32Array;
        const hashCode = this.hash(key) & lower31BitMask;
        for (let i = buckets[hashCode % buckets.length]; i > 0;) {
            const entryValue = set[i];
            if (equals(key, entryValue)) {
                this.lastIndex = i >> 1;
                return entryValue;
            }
            i = set[i + 1] as any as number; // .next;
        }
        this.lastIndex = undefined;
        return undefined;
    }

    add(set: ArraySet<T>, key: Key, addOnly = false): T {
        if (key === undefined) {
            throw new Error("undefined values not supported.");
        }

        const equals = this.equals;
        // pure array
        if (set.length <= lengthThreshold) {
            for (let i = 0; i < set.length; i++) {
                const entryValue = set[i];
                if (equals(key, entryValue)) {
                    if (addOnly) throw new Error(`Adding duplicate value:${key}.`);
                    this.wasCreated = false;
                    this.lastIndex = i;
                    return entryValue;
                }
            }
            this.wasCreated = true;
            //INVARIANT: call this.create() before any change of the set, so that eventual exception will do no harm
            const value = this.create(key); // tslint:disable-line:no-shadowed-variable
            const len = set.length;
            this.lastIndex = len;
            if (len < lengthThreshold) {
                set.push(value);
                return value;
            }
            this.initialize(set, value);
            return value;
        }

        // hashed array
        let buckets = set[0] as any as Int32Array;
        const hashCode = this.hash(key) & lower31BitMask;
        let targetBucket = hashCode % buckets.length;

        for (let i = buckets[targetBucket]; i > 0;) {
            const entryValue = set[i];
            if (equals(key, entryValue)) {
                if (addOnly) throw new Error(`Adding duplicate value:${key}.`);
                this.wasCreated = false;
                this.lastIndex = i >> 1;
                return entryValue;
            }
            i = set[i + 1] as any as number; // .next;
        }

        this.wasCreated = true;
        //INVARIANT: call this.create() before any change of the set, so that eventual exception will do no harm
        const value = this.create(key);

        const count = set.length >> 1;
        this.lastIndex = count;
        if (count === buckets.length) { // and buckets.length == size, so count === size
            this.resize(set, expandPrime(count));
            buckets = set[0] as any as Int32Array;
            targetBucket = hashCode % buckets.length;
        }
        //entries[index] = new DictEntry<TKey, TValue>(hashCode, buckets[targetBucket], key, value);
        set.push(value, buckets[targetBucket] as any);
        buckets[targetBucket] = set.length - 2;
        return value;
    }

    resize(set: ArraySet<T>, newSize: number) {
        //INVARIANT: count > thresholdLength && (count === buckets.length || count === threshold + 1)
        //INVARIANT: newSize is a prime already, and newSize > count
        const buckets = new Int32Array(newSize);
        set[0] = buckets as any;

        // redistribute all entries
        for (let i = 1; i < set.length; i += 2) {
            const entryValue = set[i];
            const bucket = (this.hashValue(entryValue) & lower31BitMask) % newSize;
            set[i + 1] = buckets[bucket] as any; //next
            buckets[bucket] = i;
        }
    }

    private initialize(set: ArraySet<T>, value: T) {
        //INVARIANT: set.length === lengthThreshold
        // move the second half
        for (let i = lengthThreshold; i <= (lengthThreshold << 1); i++) {
            set.push((i & 1) === 0 ? 0 as any : set[i >> 1]);
        }
        set.push(value);
        set.push(0 as any); //next
        // move the first half
        for (let i = lengthThreshold - 1; i > 0; i--) {
            set[i] = (i & 1) === 0 ? 0 as any : set[i >> 1];
        }

        this.resize(set, initialSize);
    }

    remove(set: ArraySet<T>, key: Key): T | undefined {
        if (key === undefined) {
            throw new Error("undefined set value is not allowed.");
        }
        const equals = this.equals;
        if (set.length <= lengthThreshold) {
            for (let i = 0; i < set.length; i++) {
                const entryValue = set[i];
                if (equals(key, entryValue)) {
                    const lastValue = set.pop() as T;
                    if (i < set.length) {
                        set[i] = lastValue;
                    }
                    return entryValue;
                }
            }
            return undefined;
        }

        const buckets = set[0] as any as Int32Array;
        const hashCode = this.hash(key) & lower31BitMask;
        let bucket = hashCode % buckets.length;
        let last = 0;
        for (let i = buckets[bucket]; i > 0;) {
            const entryValue = set[i];
            if (this.equals(key, entryValue)) {
                if (last > 0) {
                    set[last + 1] = set[i + 1]; //.next <- .next
                } else {
                    buckets[bucket] = set[i + 1] as any; //.next;
                }
                const lastNext = set.pop() as any as number;
                const lastValue = set.pop() as T;
                const lastIdx = set.length;
                if (lastIdx <= lengthThreshold) { //should be actually < ; 7 for threshold 8
                    if (i < lastIdx) set[i] = lastValue as T; // fill the hole with the last value
                    for (i = 1; i < lastIdx; i += 2) {
                        set[i >> 1] = set[i];
                    }
                    set.length = lastIdx >> 1; //3 elements when threshold is 8
                } else if (initialSize <= lastIdx && (lastIdx << 1) < buckets.length) {
                    // downsize, when count <=~ bucket.length / 4
                    if (i < lastIdx) set[i] = lastValue as T; // fill the hole with the last value
                    //const newSize = lastIdx;
                    this.resize(set, getPrime(lastIdx));
                } else if (i < lastIdx) {
                    // replace the original with the last one
                    set[i] = lastValue; // fill the hole with the last value
                    set[i + 1] = lastNext as any;
                    bucket = (this.hashValue(lastValue) & lower31BitMask) % buckets.length;
                    let ii = buckets[bucket];
                    if (ii === lastIdx) {
                        buckets[bucket] = i;
                    } else {
                        while (ii > 0) {
                            const nextIi = set[ii + 1] as any as number;
                            if (nextIi === lastIdx) {
                                set[ii + 1] = i as any;
                                return entryValue;
                            }
                            ii = nextIi;
                        }
                        // a fatal programming error
                        throw new Error("Could not find fill for the removed one.");
                    }
                }
                return entryValue;
            }
            last = i;
            i = set[i + 1] as any as number; // entry.next;
        }
        return undefined;
    }
    step(set: ArraySet<T>): number {
        return set.length <= lengthThreshold ? 1 : 2;
    }
    count(set: ArraySet<T>): number {
        return set.length <= lengthThreshold ? set.length : set.length >> 1;
    }

}


const addBase = 0x9e3779b9;
export function combineHashCodes(h1: number, h2: number): number {
    //resharper's approach - FNV hashing
    //unchecked
    //{
    //    return (FieldUid.GetHashCode() * 397) ^ (FieldType != null ? FieldType.GetHashCode() : 0);
    //}

    //from array structural hashing - only max 8 elements
    //return ((h1 << 5) + h1) ^ h2;

    //from bootstrap
    //seed ^= hash_value(v) + 0x9e3779b9 + (seed << 6) + (seed >> 2);

    //combine h1 and h2: 
    //0, h1 => seed  
    //seed, h2 => seed

    const seed = ((h1 | 0) + addBase) | 0;
    //seed ^= h2 + addBase + (seed << 6) + (seed >> 2);
    return (seed ^ ((h2 | 0) + addBase + (seed << 6) + (seed >> 2))) | 0;
}





export type Uid = number;
// //NOTE: we have 1 bit unused in the lower 32bits of Uid-s beacause we use only 31 bits for sidx-s 
// //MAYBE: we should make the split on 26 + 27 instead of 21 + (1+)31
//const twoTo32 = 4294967296;
// //const twoTo31minusOne = -1 >>> 1; // 2147483647;
// const twoTo21 = 1 << 21; //2097152;
// export function makeUid(gidx: number, sidx: number): Uid {
//     const si = (sidx|0);
//     if(si !== sidx || si < 0) 
//         throw new Error(`Invalid sidx, it is not an integer in the range 0..2147483647, sidx=${sidx}, sidx|0=${si}`);
//     const gi = (gidx|0);
//     if(gi !== gidx || gi >= twoTo21 || gi < 0)
//         throw new Error(`Invalid gidx, it is not an integer in the range 0..2097151, gidx=${gidx}, gidx|0=${gi}`);
//     return gi * twoTo32 + si;
// }
// const divideByTwoTo32 = 1 / twoTo32;
// export function getGidx(uid: Uid) {
//     return (uid * divideByTwoTo32) | 0;
// }
// export function getSidx(uid: Uid) {
//     return uid | 0;
// }
// export function hashUid(uid: Uid): number {
//     return combineHashCodes((uid * divideByTwoTo32)|0, uid|0);
// }

//const twoTo32 = 4294967296;
// we are using:
// idx:  14bits
// gidx: rest of the bits
//   when qidx <= 16 bits, both fits nicely in 30bits (+1 for positive 31bits, which are optimized by 32bit runtimes)
export const maxSidx = (1 << 14) - 1;
export function makeUid(gidx: number, sidx: number): Uid {
    const si = (sidx | 0);
    if (si !== sidx || si < 0 || si >= (1 << 14))
        throw new Error(`Invalid sidx, it is not an integer in the range 0..16383, sidx=${sidx}, sidx|0=${si}`);
    const gi = (gidx | 0);
    if (gi !== gidx || gi < 0)
        throw new Error(`Invalid gidx, it is not an integer in the range 0..2097151, gidx=${gidx}, gidx|0=${gi}`);
    if (gi < (1 << 17))
        return (gi << 14) + si;
    return gi * (1 << 14) + si;
}

const divideByTwoTo14 = 1 / (1 << 14);
export function getGidx(uid: Uid): number {
    const u = uid | 0;
    if (u === uid)
        return u >> 14;
    return (uid * divideByTwoTo14) | 0;
}
export function getSidx(uid: Uid): number {
    return uid & ((1 << 14) - 1);
}

export function hashUid(uid: Uid): number {
    return uid | 0;
}