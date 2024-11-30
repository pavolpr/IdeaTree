
/*
union concept TokenTreeElement
    styles: children StyleTermArg* // only for TokenConst and TokenProperty for now
    hintId: BaseConcept?
        
    concept TokenConst
        text: string
    
    concept TokenProperty
        projectedNode: BaseConcept
        //or const: child TokenConst
        property: ConceptStructureMemberDef

    concept TokenTree
        projectedNode: BaseConcept? //a children sub-tree when empty
        //deltaIndent: int?
        elements: children TokenTreeElement*

        concept TokenStructured

    concept TokenDropSpace
    concept TokenStartNewLine
    concept TokenAddIndent
    concept TokenSubIndent

*/

import { BaseConcept, baseConceptDef, conceptStructureMemberDefDef, LangBuilder, StyleTermArgDef } from "../concept";

export const langGuid = "8cf51185-29ae-426b-b56c-b7c271b7abb4"; 
const lb = new LangBuilder(langGuid, "TokenTree", 30);

export const TokenTreeElementDef = lb.newConceptDefNode(1, "TokenTreeElement");
export const TokenConstDef = lb.newConceptDefNode(2, "TokenConst");
export const TokenPropertyDef = lb.newConceptDefNode(3, "TokenProperty");
export const TokenTreeDef = lb.newConceptDefNode(4, "TokenTree");
export const TokenStructuredDef = lb.newConceptDefNode(16, "TokenStructured");
export const TokenDropSpaceDef = lb.newConceptDefNode(5, "TokenDropSpace");
export const TokenStartNewLineDef = lb.newConceptDefNode(6, "TokenStartNewLine");
export const TokenAddIndentDef = lb.newConceptDefNode(13, "TokenAddIndent");
export const TokenSubIndentDef = lb.newConceptDefNode(14, "TokenSubIndent");

export class TokenTreeElement extends BaseConcept {
    static Def = new TokenTreeElement(TokenTreeElementDef);
    static StylesCNA = lb.childrenAccessor(TokenTreeElementDef, StyleTermArgDef, 15, "styles");
    static HintIdFA = lb.refFieldAccessor(TokenTreeDef, baseConceptDef, 17, "hintId", /*isOptional:*/true);
}

export class TokenConst extends TokenTreeElement {
    static Def = new TokenConst(TokenConstDef);

    static TextFA = lb.stringFieldAccessor(TokenConstDef, 7, "text");
}
lb.subTypeAsMember(TokenTreeElementDef, TokenConstDef);

export class TokenProperty extends TokenTreeElement {
    static Def = new TokenProperty(TokenPropertyDef);
    static ProjectedNodeFA = lb.refFieldAccessor(TokenPropertyDef, baseConceptDef, 12, "projectedNode");

    static PropertyFA = lb.refFieldAccessor(TokenPropertyDef, conceptStructureMemberDefDef, 8, "property");
}
lb.subTypeAsMember(TokenTreeElementDef, TokenPropertyDef);

export class TokenTree extends TokenTreeElement {
    static Def = new TokenTree(TokenTreeDef);
    //style: TextStyle? //or children TextStyleRef*

    static ProjectedNodeFA = lb.refFieldAccessor(TokenTreeDef, baseConceptDef, 11, "projectedNode", /*isOptional:*/true);


    //static DeltaIndentFA = lb.intFieldAccessor(TokenTreeDef, 9, "deltaIndent", true);
    static ElementsCNA = lb.childrenAccessor(TokenTreeDef, TokenTreeElementDef, 10, "elements");
}
lb.subTypeAsMember(TokenTreeElementDef, TokenTreeDef);

export class TokenStructured extends TokenTree {
    static Def = new TokenStructured(TokenStructuredDef);
}
lb.subTypeAsMember(TokenTreeDef, TokenStructuredDef);

export class TokenDropSpace extends TokenTreeElement {
    static Def = new TokenDropSpace(TokenDropSpaceDef);
}
lb.subTypeAsMember(TokenTreeElementDef, TokenDropSpaceDef);

export class TokenStartNewLine extends TokenTreeElement {
    static Def = new TokenStartNewLine(TokenStartNewLineDef);
}
lb.subTypeAsMember(TokenTreeElementDef, TokenStartNewLineDef);

export class TokenAddIndent extends TokenTreeElement {
    static Def = new TokenAddIndent(TokenAddIndentDef);
}
lb.subTypeAsMember(TokenTreeElementDef, TokenAddIndentDef);

export class TokenSubIndent extends TokenTreeElement {
    static Def = new TokenSubIndent(TokenSubIndentDef);
}
lb.subTypeAsMember(TokenTreeElementDef, TokenSubIndentDef);

export const tokenTreeLangHeap = lb.langHeap;
