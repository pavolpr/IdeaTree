import { expect, it, describe } from "vitest";
import * as utils from "../utils";
import { nodeSetByUid, Node, getGlobalNode, ensureGlobalNode, type INodeRef } from "../node";
import { globalState } from "../mx/globalstate";

describe("utils", () => {
    // it("dict works", ()=> {
    //     const intComparer: utils.IDictComparer<number> = {
    //         equals(a: number, b: number) {
    //             return a === b;
    //         },
    //         hashCode(key: number) {
    //             return key | 0;
    //         }
    //     };
    //     const d1 = new utils.Dict<number, string>(intComparer);
    //     expect(d1.entries.length).toBe(0);
    //     expect(d1.buckets.length).toBe(3);

    //     expect(d1.containsKey(1)).toBe(false);
    //     expect(d1.get(1)).toBeUndefined();
    //     d1.add(1, "prvá");
    //     expect(d1.entries.length).toBe(1);
    //     expect(d1.containsKey(1)).toBe(true);
    //     expect(d1.get(1)).toBe("prvá");

    //     expect(d1.containsKey(-1)).toBe(false);
    //     expect(d1.get(-1)).toBeUndefined();
    //     d1.add(-1, "-prvá");
    //     expect(d1.entries.length).toBe(2);
    //     expect(d1.containsKey(-1)).toBe(true);
    //     expect(d1.get(-1)).toBe("-prvá");
    //     expect(d1.get(1)).toBe("prvá");

    //     expect(d1.containsKey(2)).toBe(false);
    //     expect(d1.get(2)).toBeUndefined();
    //     d1.add(2, "druhá");
    //     expect(d1.entries.length).toBe(3);
    //     expect(d1.containsKey(2)).toBe(true);
    //     expect(d1.get(2)).toBe("druhá");
    //     expect(d1.get(-1)).toBe("-prvá");
    //     expect(d1.get(1)).toBe("prvá");

    //     expect(d1.buckets.length).toBe(3);

    //     expect(d1.containsKey(3)).toBe(false);
    //     expect(d1.get(3)).toBeUndefined();
    //     d1.add(3, "tretia");
    //     expect(d1.entries.length).toBe(4);
    //     expect(d1.containsKey(3)).toBe(true);
    //     expect(d1.get(3)).toBe("tretia");
    //     expect(d1.get(2)).toBe("druhá");
    //     expect(d1.get(-1)).toBe("-prvá");
    //     expect(d1.get(1)).toBe("prvá");

    //     expect(d1.buckets.length).toBe(7);

    //     d1.put(3, "tretia-2");
    //     expect(d1.get(3)).toBe("tretia-2");

    //     expect(d1.freeList).toBe(-1);
    //     expect(d1.remove(3)).toBe(true);
    //     expect(d1.containsKey(3)).toBe(false);
    //     expect(d1.get(3)).toBeUndefined();
    //     expect(d1.freeList >= 0).toBe(true);

    //     expect(d1.get(2)).toBe("druhá");
    //     expect(d1.get(-1)).toBe("-prvá");
    //     expect(d1.get(1)).toBe("prvá");

    //     expect(d1.remove(1)).toBe(true);
    //     expect(d1.containsKey(1)).toBe(false);
    //     expect(d1.get(2)).toBe("druhá");
    //     expect(d1.get(-1)).toBe("-prvá");
    //     expect(d1.get(1)).toBeUndefined();
    //     expect(d1.freeList >= 0).toBe(true);

    // });

    it("node ArraySet works", () => {
        globalState.nodeMap = [];
        const nm = globalState.nodeMap;
        expect(nm.length).toBe(0);
        expect(nodeSetByUid.step(nm)).toBe(1);
        expect(nodeSetByUid.count(nm)).toBe(0);

        expect(nodeSetByUid.get(nm, 1)).toBeUndefined();
        expect(getGlobalNode(1)).toBeUndefined();

        expect(nodeSetByUid.remove(nm, 1)).toBe(undefined);
        expect(nm.length).toBe(0);

        let n1 = ensureGlobalNode(1);
        expect(nm.length).toBe(1);
        expect(nodeSetByUid.step(nm)).toBe(1);
        expect(nodeSetByUid.count(nm)).toBe(1);

        expect(nodeSetByUid.get(nm, 1) as INodeRef).toBe(n1);
        expect(getGlobalNode(1)).toBe(n1);

        expect(nodeSetByUid.get(nm, 2)).toBeUndefined();
        expect(getGlobalNode(2)).toBeUndefined();

        //remove and add again n1
        expect(nodeSetByUid.remove(nm, 1) as INodeRef).toBe(n1);
        expect(nm.length).toBe(0);
        expect(n1 = ensureGlobalNode(n1.uid)).toBe(n1);
        expect(nm.length).toBe(1);

        const n2 = ensureGlobalNode(2);
        expect(nm.length).toBe(2);
        expect(nodeSetByUid.get(nm, 2) as INodeRef).toBe(n2);
        expect(getGlobalNode(2)).toBe(n2);
        expect(getGlobalNode(1)).toBe(n1);

        ensureGlobalNode(2);
        expect(nm.length).toBe(2);
        expect(nodeSetByUid.get(nm, 2) as INodeRef).toBe(n2);
        expect(nodeSetByUid.count(nm)).toBe(2);

        expect(() => ensureGlobalNode(undefined!)).toThrowError(/undefined values not supported/);
        expect(() => nodeSetByUid.add(nm, n2.uid, true)).toThrowError(/Adding duplicate value:/);

        expect(() => nodeSetByUid.get(nm, undefined!)).toThrowError(/undefined set key is not allowed/);
        expect(() => nodeSetByUid.remove(nm, undefined!)).toThrowError(/undefined set value is not allowed/);

        //remove and add again n1
        expect(nodeSetByUid.remove(nm, 1) as INodeRef).toBe(n1);
        expect(nm.length).toBe(1);
        expect(nodeSetByUid.remove(nm, 1)).toBeUndefined();
        expect(n1 = ensureGlobalNode(n1.uid)).toBe(n1);
        expect(nm.length).toBe(2);
        expect(nm[0] as INodeRef).toBe(n2);
        expect(nm[1] as INodeRef).toBe(n1);

        for (let i = 3; i <= 8; i++) {
            expect(nodeSetByUid.get(nm, i)).toBeUndefined();
            expect(getGlobalNode(i)).toBeUndefined();
        }
        for (let i = 3; i <= 8; i++) {
            const ni = ensureGlobalNode(i);
            expect(nm.length).toBe(i);
            expect(nodeSetByUid.count(nm)).toBe(i);
            expect(nodeSetByUid.get(nm, i) as INodeRef).toBe(ni);
            expect(getGlobalNode(2)).toBe(n2);
            expect(getGlobalNode(1)).toBe(n1);
            expect(getGlobalNode(i)).toBe(ni);
        }

        // ---> hashing
        expect(nodeSetByUid.get(nm, 9)).toBeUndefined();
        expect(getGlobalNode(9)).toBeUndefined();
        expect(nm.length).toBe(8);
        expect(nodeSetByUid.count(nm)).toBe(8);
        expect(nodeSetByUid.step(nm)).toBe(1);

        let n9 = ensureGlobalNode(9);
        expect(nm.length).toBe(1 + 2 * 9);
        expect(nodeSetByUid.count(nm)).toBe(9);
        expect(nodeSetByUid.step(nm)).toBe(2);

        expect((nm[0] as any).length).toBe(23);
        expect(nodeSetByUid.get(nm, 9) as INodeRef).toBe(n9);
        expect(getGlobalNode(2)).toBe(n2);
        expect(getGlobalNode(1)).toBe(n1);
        expect(getGlobalNode(9)).toBe(n9);
        // again, no effect
        ensureGlobalNode(9);
        expect(nm.length).toBe(1 + 2 * 9);
        expect(nodeSetByUid.step(nm)).toBe(2);
        expect(nodeSetByUid.get(nm, 9) as INodeRef).toBe(n9);
        expect(() => nodeSetByUid.add(nm, n9.uid, true)).toThrowError(/Adding duplicate value:/);

        //remove and add again n9 and n8, n7, n6, n5
        expect(nodeSetByUid.remove(nm, 9) as INodeRef).toBe(n9);
        expect(nm.length).toBe(1 + 2 * 8);
        expect(nodeSetByUid.count(nm)).toBe(8);
        for (let i = 5; i <= 8; i++) {
            expect(nodeSetByUid.remove(nm, i)).toEqual(new Node(i));
        }
        expect(nm.length).toBe(1 + 2 * 4);
        expect(nodeSetByUid.count(nm)).toBe(4);
        expect(nodeSetByUid.step(nm)).toBe(2);
        // back to dense array
        expect(nodeSetByUid.remove(nm, 4)).toEqual(new Node(4));
        expect(nm.length).toBe(3);
        expect(nodeSetByUid.count(nm)).toBe(3);
        expect(nodeSetByUid.step(nm)).toBe(1);
        expect(nm[0] as INodeRef).toBe(n2);
        expect(nm[1] as INodeRef).toBe(n1);
        expect(nm[2] as INodeRef).toEqual(new Node(3));
        for (let i = 4; i <= 8; i++) {
            const ni = ensureGlobalNode(i);
            expect(nm.length).toBe(i);
            expect(nodeSetByUid.count(nm)).toBe(i);
            expect(nodeSetByUid.get(nm, i) as INodeRef).toBe(ni);
            expect(getGlobalNode(2)).toBe(n2);
            expect(getGlobalNode(1)).toBe(n1);
            expect(getGlobalNode(i)).toBe(ni);
        }

        // go to hashed and back to dense array, but remove non-end element
        expect(n9 = ensureGlobalNode(n9.uid) as INodeRef).toBe(n9); // be hashed
        expect(nm.length).toBe(1 + 2 * 9);
        expect(nodeSetByUid.count(nm)).toBe(9);
        expect(nodeSetByUid.step(nm)).toBe(2);
        for (let i = 5; i <= 8; i++) {
            expect(nodeSetByUid.remove(nm, i)).toEqual(new Node(i));
        }
        expect(nodeSetByUid.remove(nm, n9.uid) as INodeRef).toEqual(n9);
        expect(nm.length).toBe(1 + 2 * 4); // still hashed
        expect(nodeSetByUid.count(nm)).toBe(4);
        expect(nodeSetByUid.step(nm)).toBe(2);
        //   back to dense array, but remove 3
        expect(nodeSetByUid.remove(nm, 3)).toEqual(new Node(3));
        expect(nm.length).toBe(3);
        expect(nodeSetByUid.step(nm)).toBe(1);
        expect(nm[0] as INodeRef).toBe(n2);
        expect(nm[1] as INodeRef).toBe(n1);
        expect(nm[2]).toEqual(new Node(4));
        ensureGlobalNode(3);
        for (let i = 5; i <= 8; i++) {
            const ni = ensureGlobalNode(i);
            expect(nm.length).toBe(i);
            expect(nodeSetByUid.get(nm, i) as INodeRef).toBe(ni);
            expect(getGlobalNode(2)).toBe(n2);
            expect(getGlobalNode(1)).toBe(n1);
            expect(getGlobalNode(i)).toBe(ni);
        }

        // hashing, again
        expect(nm.length).toBe(8);
        expect(getGlobalNode(9)).toBeUndefined();
        expect(n9 = ensureGlobalNode(n9.uid) as INodeRef).toBe(n9);
        expect(nm.length).toBe(1 + 2 * 9);
        expect(nodeSetByUid.count(nm)).toBe(9);
        expect(nodeSetByUid.step(nm)).toBe(2);
        expect(nodeSetByUid.get(nm, 9) as INodeRef).toBe(n9);
        expect(getGlobalNode(2)).toBe(n2);
        expect(getGlobalNode(1)).toBe(n1);
        expect(getGlobalNode(9)).toBe(n9);

        const buckets = nm[0] as any as Int32Array;
        expect(buckets.length).toBe(23);

        // making 0 -> 1 -> . at hash 1
        expect(nodeSetByUid.get(nm, 0)).toBeUndefined();
        expect(getGlobalNode(0)).toBeUndefined();
        expect(nm[1 + 1 * 2 + 0] as INodeRef).toBe(n1); // n1 is after n2 now
        expect(nm[1 + 1 * 2 + 1] as any).toBe(0); //no next
        const n231 = ensureGlobalNode(231);
        expect(nm.length).toBe(1 + 2 * 10);
        expect(nodeSetByUid.count(nm)).toBe(10);
        expect(nm[1 + 1 * 2 + 0] as INodeRef).toBe(n1);
        expect(nm[1 + 1 * 2 + 1] as any).toBe(0);
        expect(nm[1 + 9 * 2 + 0] as INodeRef).toBe(n231);
        expect(nm[1 + 9 * 2 + 1] as any).toBe(1 + 1 * 2); //next is n1

        expect(nodeSetByUid.get(nm, 231) as INodeRef).toBe(n231);
        expect(getGlobalNode(2)).toBe(n2);
        expect(getGlobalNode(1)).toBe(n1);
        expect(getGlobalNode(231)).toBe(n231);

        // remove n1, which is next to n231
        expect(nodeSetByUid.remove(nm, n1.uid) as INodeRef).toBe(n1);
        expect(nodeSetByUid.remove(nm, n1.uid)).toBeUndefined();
        expect(n1 = ensureGlobalNode(n1.uid)).toBe(n1);
        // now, n231 is next to n1, and the posision n1 <-> n231
        expect(nm.length).toBe(1 + 2 * 10);
        expect(nm[1 + 1 * 2 + 0] as INodeRef).toBe(n231);
        expect(nm[1 + 1 * 2 + 1] as any).toBe(0);
        expect(nm[1 + 9 * 2 + 0] as INodeRef).toBe(n1);
        expect(nm[1 + 9 * 2 + 1] as any).toBe(1 + 1 * 2); //next is n231

        //make last to point to previous last
        const nLastPointinngToN1 = ensureGlobalNode(5 * 23 + 1);
        expect(ensureGlobalNode(nLastPointinngToN1.uid)).toBe(nLastPointinngToN1);
        expect(nm[1 + 10 * 2 + 0] as INodeRef).toBe(nLastPointinngToN1);
        expect(nm[1 + 10 * 2 + 1] as any).toBe(1 + 9 * 2); //next is n1
        // remove 9 to go before n1, which will end up to be the last
        expect(nodeSetByUid.remove(nm, n9.uid) as INodeRef).toBe(n9);
        expect(nm[1 + 8 * 2 + 0] as INodeRef).toBe(nLastPointinngToN1);
        expect(nm[1 + 8 * 2 + 1] as any).toBe(1 + 9 * 2); //next is n1
        //now, remove n8, to move n1 to previous last
        expect(nodeSetByUid.remove(nm, 8)).toEqual(new Node(8));
        // now, add one more nLast, and delete 5,6,7 to create the reversed chain
        const nLastPointinngToN1_2 = ensureGlobalNode(6 * 23 + 1);
        expect(ensureGlobalNode(nLastPointinngToN1_2.uid)).toBe(nLastPointinngToN1_2);
        expect(nodeSetByUid.remove(nm, 5)).toEqual(new Node(5));
        expect(nodeSetByUid.remove(nm, 6)).toEqual(new Node(6));
        expect(nodeSetByUid.remove(nm, 7)).toEqual(new Node(7));


        // and make it to have similar what we had at start
        expect(nodeSetByUid.remove(nm, nLastPointinngToN1.uid) as INodeRef).toBe(nLastPointinngToN1);
        expect(nodeSetByUid.remove(nm, nLastPointinngToN1_2.uid) as INodeRef).toBe(nLastPointinngToN1_2);
        expect(nm.length).toBe(1 + 2 * 5); // + n231
        expect(nodeSetByUid.count(nm)).toBe(5);
        for (let i = 5; i <= 8; i++) {
            const ni = ensureGlobalNode(i);
            expect(nm.length).toBe(1 + 2 * (i + 1)); // + n231
            expect(nodeSetByUid.count(nm)).toBe(i + 1);
            expect(nodeSetByUid.get(nm, i) as INodeRef).toBe(ni);
            expect(getGlobalNode(2)).toBe(n2);
            expect(getGlobalNode(1)).toBe(n1);
            expect(getGlobalNode(i)).toBe(ni);
        }
        expect(n9 = ensureGlobalNode(n9.uid)).toBe(n9);
        expect(nm.length).toBe(1 + 2 * 10); // + n231


        // fill in up to 23
        for (let i = 11; i <= 23; i++) {
            const ni = ensureGlobalNode(i);
            expect(nm.length).toBe(1 + i * 2);
            expect(nodeSetByUid.count(nm)).toBe(i);
            expect(nodeSetByUid.get(nm, i) as INodeRef).toBe(ni);
            expect(getGlobalNode(2)).toBe(n2);
            expect(getGlobalNode(1)).toBe(n1);
            expect(getGlobalNode(i)).toBe(ni);
        }
        expect(nm.length).toBe(1 + 2 * 23);
        expect(nodeSetByUid.count(nm)).toBe(23);
        expect(nm[0] as any).toBe(buckets);

        // 2. re-hash
        expect(nodeSetByUid.get(nm, 24)).toBeUndefined();
        expect(getGlobalNode(24)).toBeUndefined();
        expect(nodeSetByUid.step(nm)).toBe(2);
        const n24 = ensureGlobalNode(24);
        expect(nm.length).toBe(1 + 2 * 24);
        expect(nodeSetByUid.count(nm)).toBe(24);
        expect(nodeSetByUid.step(nm)).toBe(2);
        expect(nodeSetByUid.get(nm, 24) as INodeRef).toBe(n24);
        expect(getGlobalNode(2)).toBe(n2);
        expect(getGlobalNode(1)).toBe(n1);
        expect(getGlobalNode(231)).toBe(n231);
        expect(getGlobalNode(24)).toBe(n24);
        const buckets2 = nm[0] as any as Int32Array;
        expect(buckets2.length).toBe(47);

        //delete enough elems to resize down
        for (let i = 11; i <= 22; i++) {
            expect(nodeSetByUid.remove(nm, i)).toEqual(new Node(i));
            expect(nodeSetByUid.remove(nm, i)).toBeUndefined();
        }
        expect(nodeSetByUid.remove(nm, 23)).toEqual(new Node(23));

        const buckets3 = nm[0] as any as Int32Array;
        expect(buckets3.length).toBe(23);
        expect(nm.length).toBe(1 + 2 * 11); //9x + n231 + n24

        //put them back, and remove again, but he last one not from the end
        for (let i = 11; i <= 23; i++) {
            const ni = ensureGlobalNode(i);
            expect(nodeSetByUid.get(nm, i) as INodeRef).toBe(ni);
        }
        const buckets4 = nm[0] as any as Int32Array;
        expect(buckets4.length).toBe(47);
        expect(nm.length).toBe(1 + 2 * 24); //9x + 13x + n231 + n24
        for (let i = 11; i <= 22; i++) {
            expect(nodeSetByUid.remove(nm, i)).toEqual(new Node(i));
            expect(nodeSetByUid.remove(nm, i)).toBeUndefined();
        }
        //expect(nodeSet.remove(nm, new Node(23))).toEqual(new Node(23));
        expect(nodeSetByUid.remove(nm, n24.uid) as INodeRef).toBe(n24);

        //check we are back on 23, and with correct content
        const buckets5 = nm[0] as any as Int32Array;
        expect(buckets5.length).toBe(23);
        expect(nm.length).toBe(1 + 2 * 11); //9x + n231 + Node(23)
        expect(nodeSetByUid.count(nm)).toBe(11);

        for (let i = 1; i <= 9; i++) {
            expect(nodeSetByUid.get(nm, i)).toEqual(new Node(i));
        }
        expect(getGlobalNode(1)).toBe(n1);
        expect(getGlobalNode(2)).toBe(n2);
        expect(getGlobalNode(9)).toBe(n9);
        expect(getGlobalNode(231)).toBe(n231);
        //expect(getGlobalNode(24)).toBe(n24);
        expect(getGlobalNode(23)).toEqual(new Node(23));

        //remove it all
        for (let i = 3; i <= 8; i++) {
            expect(nodeSetByUid.remove(nm, i)).toEqual(new Node(i));
        }
        expect(nodeSetByUid.remove(nm, n1.uid) as INodeRef).toBe(n1);
        expect(nodeSetByUid.remove(nm, n2.uid) as INodeRef).toBe(n2);
        expect(nodeSetByUid.remove(nm, n9.uid) as INodeRef).toBe(n9);
        expect(nodeSetByUid.remove(nm, n231.uid) as INodeRef).toBe(n231);
        //expect(getGlobalNode(24)).toBe(n24);
        expect(nodeSetByUid.remove(nm, 23)).toEqual(new Node(23));
        expect(nm.length).toBe(0);
        expect(nodeSetByUid.count(nm)).toBe(0);
    });

    it.skip("Old non-31bit Uid functions works", () => {
        expect(utils.makeUid(0, 0)).toBe(0);
        expect(utils.makeUid(0, 1)).toBe(1);
        expect(utils.makeUid(1, 0)).toBe(Math.pow(2, 32));
        expect(utils.makeUid(2, 0)).toBe(2 * Math.pow(2, 32));

        expect(utils.getSidx(utils.makeUid(0, 0))).toBe(0);
        expect(utils.getSidx(utils.makeUid(0, 1))).toBe(1);
        expect(utils.getSidx(utils.makeUid(1, 0))).toBe(0);
        expect(utils.getSidx(utils.makeUid(1, 1))).toBe(1);
        expect(utils.getSidx(utils.makeUid(11, 12))).toBe(12);

        expect(utils.getGidx(utils.makeUid(0, 0))).toBe(0);
        expect(utils.getGidx(utils.makeUid(0, 1))).toBe(0);
        expect(utils.getGidx(utils.makeUid(1, 0))).toBe(1);
        expect(utils.getGidx(utils.makeUid(1, 1))).toBe(1);
        expect(utils.getGidx(utils.makeUid(11, 1))).toBe(11);

        expect(() => utils.makeUid(0, -1)).toThrowError(/Invalid sidx/);
        expect(() => utils.makeUid(0, Math.pow(2, 31))).toThrowError(/Invalid sidx/);
        expect(utils.makeUid(0, Math.pow(2, 31) - 1)).toBe(Math.pow(2, 31) - 1);
        expect(() => utils.makeUid(0, Math.pow(2, 33))).toThrowError(/Invalid sidx/);

        expect(() => utils.makeUid(-1, 0)).toThrowError(/Invalid gidx/);
        expect(() => utils.makeUid(Math.pow(2, 21), 0)).toThrowError(/Invalid gidx/);
        expect(utils.getGidx(utils.makeUid(Math.pow(2, 21) - 1, 0))).toBe(Math.pow(2, 21) - 1);
        expect(() => utils.makeUid(Math.pow(2, 22), 0)).toThrowError(/Invalid gidx/);
    });

    it("Uid functions works", () => {
        expect(utils.makeUid(0, 0)).toBe(0);
        expect(utils.makeUid(0, 1)).toBe(1);
        expect(utils.makeUid(1, 0)).toBe(Math.pow(2, 14));
        expect(utils.makeUid(2, 0)).toBe(2 * Math.pow(2, 14));

        expect(utils.getSidx(utils.makeUid(0, 0))).toBe(0);
        expect(utils.getSidx(utils.makeUid(0, 1))).toBe(1);
        expect(utils.getSidx(utils.makeUid(1, 0))).toBe(0);
        expect(utils.getSidx(utils.makeUid(1, 1))).toBe(1);
        expect(utils.getSidx(utils.makeUid(11, 12))).toBe(12);

        expect(utils.getGidx(utils.makeUid(0, 0))).toBe(0);
        expect(utils.getGidx(utils.makeUid(0, 1))).toBe(0);
        expect(utils.getGidx(utils.makeUid(1, 0))).toBe(1);
        expect(utils.getGidx(utils.makeUid(1, 1))).toBe(1);
        expect(utils.getGidx(utils.makeUid(11, 1))).toBe(11);

        expect(() => utils.makeUid(0, -1)).toThrowError(/Invalid sidx/);
        expect(() => utils.makeUid(0, Math.pow(2, 31))).toThrowError(/Invalid sidx/);
        expect(utils.makeUid(0, Math.pow(2, 14) - 1)).toBe(Math.pow(2, 14) - 1);
        expect(() => utils.makeUid(0, Math.pow(2, 14))).toThrowError(/Invalid sidx/);

        expect(() => utils.makeUid(-1, 0)).toThrowError(/Invalid gidx/);
        expect(() => utils.makeUid(Math.pow(2, 31), 0)).toThrowError(/Invalid gidx/);
        expect(utils.getGidx(utils.makeUid(Math.pow(2, 31) - 1, 0))).toBe(Math.pow(2, 31) - 1);
        expect(() => utils.makeUid(Math.pow(2, 32), 0)).toThrowError(/Invalid gidx/);
    });
});