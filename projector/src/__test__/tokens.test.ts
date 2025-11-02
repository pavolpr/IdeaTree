import { expect, it, describe } from "vitest";
import { getAllTokens } from "../parser/buildParser";
import { Tokens } from "../parser/token";
import { globalState } from "../mx/globalstate";
//import "../core/postDefinitions";


describe("tokens", () => {
    it("should collect and parseall tokens", () => {
        globalState.setupEditMode();
        const { tokenDefs, tokenDefNames, constantTokens } = getAllTokens();
        const tokenSet = new Tokens();
        for (const tokenDef of tokenDefs) {
            tokenSet.makeToken(tokenDef);
        }
        for (const constantToken of constantTokens) {
            tokenSet.makeToken(constantToken);
        }

        expect(tokenSet.keywords.size).toBe(constantTokens.size);
    });
});