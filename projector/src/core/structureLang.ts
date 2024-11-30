/* structure lang (D0 structure)

- ? tree of this <- TS accessors
- projection lang (grammar + token lang)
   - bootstrap the same as structure lang
   - ?projections themselves? - trees in projection lang
     - they can be just a tree, no need for TS representation
     - how to bootstrap them?
        - ? JSON 
            - editable
            - low-level
        - ? JS - a builder <===
- a tree in a lang
    - projection into RichText lang
        - via the lang's projections
        - native tree
            - editable native projection?

abstract concept BaseConcept //implicit inherited concept when inherit is not specified

trait ILangDefinition

concept LanguageModuleRoot
    definitions: children ILangDefinition*
    projection
        definitions*(separator: start-new-line)


trait INamed
    name: Name //maybe: string:Name - should be overridable in projections and/or by implementers?

trait IConceptMember
    concept ConceptStructureMemberDef with INamed
        type: child ConceptMemberType
        projection
            name(style: MemberName) drop-space ":"(style: Operator) type

union concept ConceptOrTraitDef with INamed, IConceptMember, ILangDefinition
    //isOpen/isSealed: bool
    isUnion: bool
    inherit: ConceptDef?
    traits: children TraitRef*
    members: children IConceptMember*
  
    concept ConceptDef
        isAbstract: bool
        projection
            "abstract"(style: Keyword)?isAbstract //semantically only {isAbstract, !isUnion}
            "union"(style: Keyword)?isUnion // "union"(Keyword)?isUnion
            "concept"(style: Keyword) name(style: Name)
            [drop-space ":"(style: Operator) inherit->name(style: Reference))]?inherit //.isPresent
            ["with"(style: Keyword) traits+(separator: [drop-space ","])]?traits //.isAny
            indented-block
                members*(separator: start-new-line)    
                //members*(map: member => [start-new-line member])
                //members*(prefix: start-new-line)
                //members*(prefix-start-new-line)
    
    concept TraitDef
        projection
            "union"(style: Keyword)?isUnion // "union"(Keyword)?isUnion
            "trait"(style: Keyword) name(style: Name)
            [drop-space ":"(style: Operator) inherit->name(style: Reference))]?inherit //.isPresent
            ["with"(style: Keyword) traits+(separator: [drop-space ","])]?traits //.isAny
            indented-block
                members*(separator: start-new-line)

concept TraitRef
    trait: TraitDef
    projection
        trait->name(style: Reference)

union concept ConceptMemberType
    isOptional: bool

    union PrimitiveType
        concept BoolType
            projection
                "bool"(style: Type)
                [drop-space "?"(style: Operator)]?isOptional
        concept StringType
            projection
                "string"(style: Type)
                [drop-space "?"(style: Operator)]?isOptional
            concept TokenType //maybe make this more abstract, as ConstrainedStringType via IStringTypeConstraint
                tokenDef: TokenDef
                projection
                    token->name(style: TypeReference)
                    [drop-space "?"(style: Operator)]?isOptional
        concept DoubleType
            projection
                "double"(style: Type)
                [drop-space "?"(style: Operator)]?isOptional
        concept IntegerType
            projection
                "int"(style: Type)
                [drop-space "?"(style: Operator)]?isOptional

    union NodeLikeType
        ofConcept: ConceptOrTraitDef
        
        concept NodeRefType: 
            projection
                ofConcept->name(style: TypeReference)
                [drop-space "?"(style: Operator)]?isOptional
        concept SingleChildType
            projection
                "child"(style: Keyword) ofConcept->name(style: TypeReference)
                [drop-space "?"(style: Operator)]?isOptional
        concept ChildrenType //*, +
            projection
                "children"(style: Keyword) ofConcept->name(style: TypeReference)
                drop-space ["*"?isOptional "+"?!isOptional](style: Operator)

        // union concept ChildNodeType
        //     concept ExactlyOneChildType
        //         projection
        //             "child"(style: Keyword) ofConcept->name(style: TypeReference)
        //     concept ZeroOrOneChildType  //?
        //         projection
        //             "child"(style: Keyword) ofConcept->name(style: TypeReference) drop-space "?"(style: Operator)
        //     concept ZeroOrMoreChildType //*
        //         projection
        //             "children"(style: Keyword) ofConcept->name(style: TypeReference) drop-space "*"(style: Operator)
        //     concept OneOrMoreChildType  //+
        //         projection
        //             "children"(style: Keyword) ofConcept->name(style: TypeReference) drop-space "+"(style: Operator)


style Operator
    font-weight: bold
style Reference
    font-style: italic
    color: Green
style TypeReference
    font-style: italic
    color: Blue
style Type
    color: Blue
style Name
    color: Yellow
style MemberName
    color: Yellow
style Keyword
    color: DarkBlue
    font-weight: bold
style Number
    color: DarkBlue

token Digit
    '0'..'9'
token Alpha
    'a'..'z' | 'A'..'Z'
token AlphaNum
    Alpha | Digit
token Name
    [Alpha | '_'] [AlphaNum | '_']*

//concept ChildNodeType: ConceptMemberType
//    cardinality: ChildCardinality
//    //isRequired/isOptional: bool //?? should we declare this at the child-def level? Or, like Closure "by contract"?
//    //isMulti: bool
//    ofConcept: AstractConceptDef

//enum ChildCardinality
//    ZeroOrOne, //?
//    ExactlyOne,
//    ZeroOrMore,//*
//    OneOrMore  //+


//abstract concept ConceptOrTraitDef with INamed
    //children properties: PropertyDef
    //children RefDefs: RefDef
    //children children: ChildDef

//concept ChildNodeType: ConceptMemberType
    //isRequired/isOptional: bool //?? should we declare this at the child-def level? Or, like Closure "by contract"?
    //isMulti: bool
    //ofConcept: AstractConceptDef

//union concept ConceptMember

//concept ChildDef: ConceptMember with INamed
//    //isRequired/isOptional: bool //?? should we declare this at the child-def level? Or, like Closure "by contract"?
//    //isMulti: bool //cardinality
//    type: child ChildNodeType //or NodeType

//concept PropertyDef: ConceptMember with INamed
//    isRequired/isOptional: bool
//    child type: PropertyType

//union concept PropertyType: ConceptMemberType


//concept RefDef: PropertyDef

//concept DataField: PropertyDef
//    child type: DataType

//concept ConceptNodeType: NodeType
//    ref concept: ConceptDef

*/

import { LangBuilder, t0langGuid, BaseConcept, langDefinitionsMemberDef, languageModuleRootDef, traitDefDef, nameFieldDef, conceptStructureMemberDefDef, conceptOrTraitDefMembersDef, conceptDefDef, structureMemberTypeDef, stringTypeDef, boolTypeDef, doubleTypeDef, integerTypeDef, ofConceptFieldDef, singleChildTypeDef, childrenTypeDef, nodeRefTypeDef, conceptMemberTypeIsOptionalFieldDef, traitRefDef, traitRefTraitFieldDef, conceptOrTraitDefTraitsDef, TokenDefDef, primitiveTypeDef, baseConceptDef } from "../concept";
import { getSidx } from "../utils";
import { Mixin, mix } from "../mixins";

const lb = new LangBuilder(t0langGuid, "Structure", 50);

lb.newConceptDefNode(getSidx(baseConceptDef.uid), "BaseConcept"); //create the node only
export const tILangDefinitionDef = lb.newTraitDefNode(10, "ILangDefinition");
lb.newConceptDefNode(getSidx(languageModuleRootDef.uid), "LanguageModuleRoot"); //create the node only
export const tINamedDef = lb.newTraitDefNode(11, "INamed");
export const tIConceptMemberDef = lb.newTraitDefNode(12, "IConceptMember");
export const conceptOrTraitDefDef = lb.newConceptDefNode(13, "ConceptOrTraitDef");
lb.newConceptDefNode(getSidx(conceptStructureMemberDefDef.uid), "ConceptStructureMemberDef"); //create the node only
lb.newConceptDefNode(getSidx(conceptDefDef.uid), "ConceptDef"); //create the node only
lb.newConceptDefNode(getSidx(traitDefDef.uid), "TraitDef"); //create the node only
lb.newConceptDefNode(getSidx(traitRefDef.uid), "TraitRef");
const conceptMemberTypeDef = lb.newConceptDefNode(21, "ConceptMemberType");
lb.newConceptDefNode(getSidx(primitiveTypeDef.uid), "PrimitiveType");
lb.newConceptDefNode(getSidx(boolTypeDef.uid), "BoolType");
lb.newConceptDefNode(getSidx(stringTypeDef.uid), "StringType");
export const TokenTypeDef = lb.newConceptDefNode(24, "TokenType");
lb.newConceptDefNode(getSidx(doubleTypeDef.uid), "DoubleType");
lb.newConceptDefNode(getSidx(integerTypeDef.uid), "IntegerType");
const nodeLikeTypeDef = lb.newConceptDefNode(33, "NodeLikeType");
lb.newConceptDefNode(getSidx(nodeRefTypeDef.uid), "NodeRefType");
//const childNodeTypeDef = lb.newConceptDefNode(28, "ChildNodeType");
lb.newConceptDefNode(getSidx(singleChildTypeDef.uid), "SingleChildType");
//lb.newConceptDefNode(getSidx(zeroOrOneChildTypeDef.uid), "ZeroOrOneChildType");
lb.newConceptDefNode(getSidx(childrenTypeDef.uid), "ChildrenType");
//lb.newConceptDefNode(getSidx(oneOrMoreChildTypeDef.uid), "OneOrMoreChildType");


export const tILangDefinition = {
    M: new Mixin(tILangDefinitionDef, (sc: typeof BaseConcept) => class ILangDefinition extends sc { })
};

export class LanguageModuleRoot extends BaseConcept {
    static Def = new LanguageModuleRoot(languageModuleRootDef);
    static DefinitionsCNA = lb.childrenAccessor(languageModuleRootDef, tILangDefinitionDef, getSidx(langDefinitionsMemberDef.uid), "definitions");
}

export const tINamed = {
    M: new Mixin(tINamedDef, (sc: typeof BaseConcept) => class INamed extends sc { }),
    NameFA: lb.stringFieldAccessor(tINamedDef, getSidx(nameFieldDef.uid), "name") //  new FieldAccessor<string>(nameFieldDef, t0stringType)
};

export const tIConceptMember = {
    M: new Mixin(tIConceptMemberDef, (sc: typeof BaseConcept) => class IConceptMember extends sc { })
};

export class ConceptStructureMemberDef extends mix(BaseConcept, tIConceptMember.M, tINamed.M) {
    static Def = new ConceptStructureMemberDef(conceptStructureMemberDefDef);
    static TypeCA = lb.childAccessor(conceptStructureMemberDefDef, conceptMemberTypeDef, getSidx(structureMemberTypeDef.uid), "type");
}
lb.subTypeAsMember(tIConceptMemberDef, conceptStructureMemberDefDef);
lb.hasTrait(conceptStructureMemberDefDef, tINamedDef);

export class ConceptOrTraitDef extends mix(BaseConcept, tINamed.M, tIConceptMember.M, tILangDefinition.M) {
    static Def = new ConceptOrTraitDef(conceptOrTraitDefDef);
    static IsUnionFA = lb.boolFieldAccessor(conceptOrTraitDefDef, 15, "isUnion");
    static InheritFA = lb.refFieldAccessor(conceptOrTraitDefDef, conceptDefDef, 16, "inherit", true);
    static TraitsCNA = lb.childrenAccessor(conceptOrTraitDefDef, traitRefDef, getSidx(conceptOrTraitDefTraitsDef.uid), "traits");
    static MembersCNA = lb.childrenAccessor(conceptOrTraitDefDef, tIConceptMemberDef, getSidx(conceptOrTraitDefMembersDef.uid), "members");
}
lb.hasTrait(conceptOrTraitDefDef, tINamedDef);
lb.hasTrait(conceptOrTraitDefDef, tIConceptMemberDef);
lb.hasTrait(conceptOrTraitDefDef, tILangDefinitionDef);

export class ConceptDef extends ConceptOrTraitDef {
    static Def = new ConceptDef(conceptDefDef);
    static IsAbstractFA = lb.boolFieldAccessor(conceptDefDef, 18, "isAbstract");
}
lb.subTypeAsMember(conceptOrTraitDefDef, conceptDefDef);

export class TraitDef extends ConceptOrTraitDef {
    static Def = new TraitDef(traitDefDef);
}
lb.subTypeAsMember(conceptOrTraitDefDef, traitDefDef);

export class TraitRef extends BaseConcept {
    static Def = new TraitRef(traitRefDef);
    static TraitFA = lb.refFieldAccessor(traitRefDef, traitDefDef, getSidx(traitRefTraitFieldDef.uid), "trait");
}

export class ConceptMemberType extends BaseConcept {
    static Def = new ConceptMemberType(conceptMemberTypeDef);
    static IsOptionalFA = lb.boolFieldAccessor(conceptMemberTypeDef, getSidx(conceptMemberTypeIsOptionalFieldDef.uid), "isOptional");
}

export class PrimitiveType extends ConceptMemberType {
    static Def = new PrimitiveType(primitiveTypeDef);
}
lb.subTypeAsMember(conceptMemberTypeDef, primitiveTypeDef);

export class BoolType extends PrimitiveType {
    static Def = new BoolType(boolTypeDef);
}
lb.subTypeAsMember(primitiveTypeDef, boolTypeDef);

export class StringType extends PrimitiveType {
    static Def = new StringType(stringTypeDef);
}
lb.subTypeAsMember(primitiveTypeDef, stringTypeDef);

export class TokenType extends StringType {
    static Def = new TokenType(TokenTypeDef);
    static TokenDefFA = lb.refFieldAccessor(TokenTypeDef, TokenDefDef, 40, "tokenDef");
}
lb.subTypeAsMember(stringTypeDef, TokenTypeDef);

export class DoubleType extends PrimitiveType {
    static Def = new DoubleType(doubleTypeDef);
}
lb.subTypeAsMember(primitiveTypeDef, doubleTypeDef);

export class IntegerType extends PrimitiveType {
    static Def = new IntegerType(integerTypeDef);
}
lb.subTypeAsMember(primitiveTypeDef, integerTypeDef);


export class NodeLikeType extends ConceptMemberType {
    static Def = new NodeLikeType(nodeLikeTypeDef);
    static OfConceptFA = lb.refFieldAccessor(nodeLikeTypeDef, conceptOrTraitDefDef, getSidx(ofConceptFieldDef.uid), "ofConcept");
}
lb.subTypeAsMember(conceptMemberTypeDef, nodeLikeTypeDef);

export class NodeRefType extends NodeLikeType {
    static Def = new NodeRefType(nodeRefTypeDef);
}
lb.subTypeAsMember(nodeLikeTypeDef, nodeRefTypeDef);

export class SingleChildType extends NodeLikeType {
    static Def = new SingleChildType(singleChildTypeDef);
}
lb.subTypeAsMember(nodeLikeTypeDef, singleChildTypeDef);

// export class ExactlyOneChildType extends SingleChildType {
//     static Def = new ExactlyOneChildType(singleChildTypeDef);
// }
// lb.subTypeAsMember(childNodeTypeDef, singleChildTypeDef);

// export class ZeroOrOneChildType extends SingleChildType {
//     static Def = new ZeroOrOneChildType(zeroOrOneChildTypeDef);
// }
// lb.subTypeAsMember(childNodeTypeDef, zeroOrOneChildTypeDef);

export class ChildrenType extends NodeLikeType {
    static Def = new ChildrenType(childrenTypeDef);
}
lb.subTypeAsMember(nodeLikeTypeDef, childrenTypeDef);

// export class OneOrMoreChildType extends SingleChildType {
//     static Def = new OneOrMoreChildType(oneOrMoreChildTypeDef);
// }
// lb.subTypeAsMember(childNodeTypeDef, oneOrMoreChildTypeDef);

export const structureLangHeap = lb.langHeap;