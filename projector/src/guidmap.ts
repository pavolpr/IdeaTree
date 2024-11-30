//const guidsPerChunkPowerOf2 = 8; //256 guids ... 4096 bytes pre chunk
//const int8ArrayChunkLength = 1 << (4 + guidsPerChunkPowerOf2);
declare const msCrypto: Crypto;
const cryptoLib = typeof crypto === "object" && crypto 
                || /*typeof msCrypto === "object" &&*/ msCrypto;
const guidValueBuffer = new Int32Array(4);
//const lower31BitMask = 0x7FFFFFFF;

const nextOffset = 4;
const bucketOffset = 5;
const entrySize = 6;
const hexChars = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"];
const hexBuf = new Array(36);

export class GuidMap {
    //entry: guid:4*32b, next:32b, bucket:32b
    //guid layout is little endian: low significant first
    //hash: the 1st 32b
    store: Int32Array;
    //advances by entrySize
    /*private*/ freeIndex: number;
    //we have size always a power of 2, so we can take hash and just mask it to get a bucket
    /*private*/ hashMask: number;
    //buckets: Int32Array; //??should be in the entries ? perhaps yes, for 64b architectures, it will be aligned better with 6 32b words than with 5

    //start with 256 entries by default
    constructor() {
        const initCapacityPowOf2 = 8;
        const capacity = 1 << initCapacityPowOf2;
        const store = new Int32Array(capacity * entrySize);
        //initialize: set all buckets to -1
        for (let i = bucketOffset; i < store.length; i += entrySize) 
            store[i] = -1;

        this.store = store;
        this.hashMask = capacity - 1;
        this.freeIndex = 0;
    }
    gidx(source: Int32Array, offset: number): number {
        const i = this.findEntry(source, offset);
        if(i >= 0)
            return (i / entrySize) | 0;
        return (this.add(source, offset) / entrySize) | 0;
    }
    gidxFromString(guid: string): number {
        //e.g. |f1f24cca-|dfdd-47fb-|bd68-579d|61cb50d7|
        const g = guid.replace(/-/g, "");
        for(let i = 0; i < 4; i++) {
            const num = parseInt(g.substr((3-i)<<3, 8), 16);
            guidValueBuffer[i] = num | 0;
        }
        return this.gidx(guidValueBuffer, 0);
    }
    gidxToString(gidx: number): string {
        const offset = this.guid(gidx);
        const store = this.store;
        //e.g. |f1f2|4cca-| |dfdd-|47fb-| |bd68-|579d| |61cb|50d7|
        //      1514 1312    1110  9 8     7 6   5 4    3 2  1 0
        //               8       13   18       23
        //      3            2             1            0
        for(let num: number, i = 0, bi = 35; i < 32; i++) {
            if((i & 7) === 0) num = store[offset + (i>>3)];
            const h = hexChars[num! & 15];
            hexBuf[bi--] = h;
            num = num! >> 4;
            if(bi === 8 || bi === 13 || bi === 18 || bi === 23)
                hexBuf[bi--] = "-";
        }
        return hexBuf.join("");
    }
    //returns offset in the store
    guid(gidx: number): number {
        const i = (gidx | 0) * entrySize;
        if(!(i >= 0 && i < this.freeIndex))
            throw new Error(`Bad gidx:${gidx}.`);
        return i;
    } 

    //creates a new guid and adds it to the store
    newGidx(): number {
        cryptoLib.getRandomValues(guidValueBuffer);
        //should we try if it is really unique? perhaps not
        return (this.add(guidValueBuffer, 0) / entrySize) | 0;
    }

    /*private*/ findEntry(source: Int32Array, offset: number): number {
        const store = this.store;
        //const comparer = this.comparer;
        const source0 = source[offset];
        const hashCode = source0 & this.hashMask;
        //const entries = this.entries;
        for (let i = store[hashCode * entrySize + bucketOffset]; i >= 0; i = store[i+nextOffset]) {
            if (store[i] === source0 
                && store[i+1] === source[offset+1]
                && store[i+2] === source[offset+2]
                && store[i+3] === source[offset+3])
                return i;
        }
        return -1;
    }

    private add(source: Int32Array, offset: number): number {
        const i = this.freeIndex;
        let store = this.store;
        if(i >= store.length) {
            if(i > store.length) throw new Error("guid index fatal error.");
            this.resize();
            store = this.store;
        }
        
        const source0 = source[offset];
        store[i] = source0;
        store[i+1] = source[offset+1];
        store[i+2] = source[offset+2];
        store[i+3] = source[offset+3];
        const targetBucket = (source0 & this.hashMask) * entrySize + bucketOffset;
        store[i+nextOffset] = store[targetBucket];
        store[targetBucket] = i;

        this.freeIndex = i + entrySize;
        return i;
    }

    private resize() {
        const store = this.store;
        const newSize = store.length << 1;
        const newStore = new Int32Array(newSize);
        newStore.set(store); //copy the old store entirely
        const newHashMask = (this.hashMask << 1) + 1; //newSize/entrySize - 1;
        //set all buckets to -1
        for (let i = bucketOffset; i < newStore.length; i += entrySize) 
            newStore[i] = -1;
        
        // redistribute all entries
        const freeIndex = this.freeIndex;
        for (let i = 0; i < freeIndex; i += entrySize) {
            const newStore0 = newStore[i];
            const bucket = (newStore0 & newHashMask) * entrySize + bucketOffset;
            newStore[i+nextOffset] = newStore[bucket];
            newStore[bucket] = i;
        }
        this.store = newStore;
        this.hashMask = newHashMask;
    }

}

