import { expect, it, describe } from "vitest";
import { GuidMap } from "../guidmap";

describe("guidmap", () => {
    it("guidmap works", () => {
        const g = new GuidMap();
        expect(g.store.length).toBe(256 * 6);
        expect(g.freeIndex).toBe(0);
        expect(g.hashMask).toBe(255);

        const gbuf = new Int32Array(8);

        expect(g.gidx(gbuf, 0)).toBe(0);
        expect(g.gidx(gbuf, 4)).toBe(0);
        expect(g.freeIndex).toBe(6);
        expect(g.guid(0)).toBe(0);

        expect(g.newGidx()).toBe(1);
        gbuf[0] = g.store[6]!;
        gbuf[1] = g.store[7]!;
        gbuf[2] = g.store[8]!;
        gbuf[3] = g.store[9]!;
        expect(g.gidx(gbuf, 0)).toBe(1);
        gbuf[0]++;
        expect(g.findEntry(gbuf, 0)).toBe(-1);
        expect(g.gidx(gbuf, 0)).toBe(2);
        expect(g.gidx(gbuf, 0)).toBe(2);
        gbuf[3]++;
        expect(g.findEntry(gbuf, 0)).toBe(-1);
        expect(g.gidx(gbuf, 0)).toBe(3);

        for (let gidx = 4; gidx < 256; gidx++) {
            expect(g.newGidx()).toBe(gidx);
        }
        expect(g.store.length / 6).toBe(256);
        for (let i = 0; i < 256; i++) {
            expect(g.gidx(g.store, i * 6)).toBe(i);
        }
        expect(g.newGidx()).toBe(256);
        expect(g.store.length / 6).toBe(512);
        expect(g.hashMask).toBe(511);

        expect(g.gidx(g.store, 256 * 6)).toBe(256);

        for (let i = 0; i <= 256; i++) {
            expect(g.gidx(g.store, i * 6)).toBe(i);
        }

        const hGuid = "f1f24cca-dfdd-47fb-bd68-579d61cb50d7";
        const heapGidx = g.gidxFromString(hGuid);
        expect(heapGidx).toBe(257);
        expect(g.gidxFromString(hGuid)).toBe(heapGidx);
        expect(g.gidxToString(heapGidx)).toBe(hGuid);
    });
});