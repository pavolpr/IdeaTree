import { expect, it, describe } from "vitest";
import { buildTokens, getAllTokens } from "../parser/buildParser";
import { globalState } from "../mx/globalstate";


describe("tokens", () => {
    it("should collect and parseall tokens", () => {
        globalState.setupEditMode();
        const { tokenDefs, constantTokens } = getAllTokens();
        const tokens = buildTokens(tokenDefs, constantTokens);
        const dfa = tokens.mainStart.dfa();
        expect(tokens.keywords.size).toBe(constantTokens.size);
    });
});