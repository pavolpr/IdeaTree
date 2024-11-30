

import { PrioritiesTable, PriorityDef, grammarLangHeap, ProjectionTermDef, Projection, DropSpaceTerm, ParameterizedTermDef, ParameterizedTerm, ConstantStringTerm, StructureMemberTerm, ParenthesizedTerm, StartNewLineTerm, IndentedBlockTerm, ReferenceTerm, ZeroOrMoreTerm, OneOrMoreTerm, OptionalTerm, StructureMemberRefTCExpr, NotExpr, StyleTermArg, SeparatorTermArg, MatchBraceLeftTermArg, MatchBraceRightTermArg, PriorityTermArg, StyleDef, FontWeightStyleAttr, BoldFontWeight, NormalFontWeight, FontStyleStyleAttr, ItalicFontStyle, NormalFontStyle, ColorStyleAttr, ColorDefRef, ColorDef, ProjectionDef, PrioritiesTableDef, PriorityDefDef, ConstantStringTermDef, StructureMemberTermDef, TokenConstrainTermDef, TokenConstrainTerm, ParenthesizedTermDef, DropSpaceTermDef, StartNewLineTermDef, IndentedBlockTermDef, ReferenceTermDef, ZeroOrMoreTermDef, OneOrMoreTermDef, OptionalTermDef, StructureMemberRefTCExprDef, NotExprDef, SeparatorTermArgDef, MatchBraceLeftTermArgDef, MatchBraceRightTermArgDef, PriorityTermArgDef, StyleDefDef, FontWeightStyleAttrDef, FontStyleStyleAttrDef, ColorStyleAttrDef, BoldFontWeightDef, NormalFontWeightDef, ItalicFontStyleDef, NormalFontStyleDef, ColorDefRefDef, ColorRGBDef, ColorRGB, ColorDefDef } from "./grammarLang";
import { globalState } from "../mx/globalstate";
import { TokenTermDef, tokenLangHeap, ConstantStringTokenTermDef, ConstantCharTokenTerm, TokenDef, ConstantStringTokenTerm, CharRangeTokenTerm, NotTokenTerm, TokenDefRefTokenTerm, ParenthesizedTokenTerm, QuantizedTokenTerm, OptionalTokenTerm, ZeroOrMoreTokenTerm, OneOrMoreTokenTerm, ParameterizedTokenTerm, SequenceTokenTerm, AlternativeTokenTerm, CharRangeTokenTermDef, NotTokenTermDef, TokenDefRefTokenTermDef, ParenthesizedTokenTermDef, QuantizedTokenTermDef, OptionalTokenTermDef, ZeroOrMoreTokenTermDef, OneOrMoreTokenTermDef, ParameterizedTokenTermDef, SequenceTokenTermDef, AlternativeTokenTermDef, ConstantCharTokenTermDef } from "./tokenLang";
import { ConceptOrTraitDef, tINamed, LanguageModuleRoot, structureLangHeap, ConceptStructureMemberDef, TokenType, TokenTypeDef, ConceptDef, TraitRef, NodeRefType, SingleChildType, ChildrenType, conceptOrTraitDefDef } from "./structureLang";
import { IWriteNode, INodeRef } from "../node";
import { IFieldAccessor } from "../type";
import { TokenDefDef, conceptStructureMemberDefDef, conceptDefDef, traitDefDef, traitRefDef, boolTypeDef, stringTypeDef, doubleTypeDef, integerTypeDef, nodeRefTypeDef, singleChildTypeDef, childrenTypeDef, StyleTermArgDef, languageModuleRootDef } from "../concept";
import { CommentToEOL, CommentToEOLDef, DeleteCharsTrivia, DropSpaceTrivia, grammarTriviaLangHeap, InsertNodeTrivia, InsertTextTrivia, SeparatorTrivia, StartNewLineTrivia, Trivia, tTriviaAttr } from "./grammarTriviaLang";

const origChangeMap = globalState.changeMap;
globalState.setupEditMode();

//StructureLang
let heap = structureLangHeap;

const Silver = def(colorDef("Silver", "#C0C0C0"));
const Gray   = def(colorDef("Gray", "#808080"));
const Black  = def(colorDef("Black", "#000000"));
const Red    = def(colorDef("Red", "#FF0000"));
const Maroon = def(colorDef("Maroon", "#800000"));
const Yellow = def(colorDef("Yellow", "#FFFF00"));
const Olive  = def(colorDef("Olive", "#808000"));
const Lime   = def(colorDef("Lime", "#00FF00"));
const Green  = def(colorDef("Green", "#008000"));
const Aqua   = def(colorDef("Aqua", "#00FFFF"));
const Teal   = def(colorDef("Teal", "#008080"));
const Blue   = def(colorDef("Blue", "#0000FF"));
const DarkBlue = def(colorDef("DarkBlue", "#00008B"));
const Navy   = def(colorDef("Navy", "#000080"));
const Fuchsia = def(colorDef("Fuchsia", "#FF00FF"));
const Purple = def(colorDef("Purple", "#800080"));

// style Operator
//     font-weight: bold
const OperatorStyle = def(styleDef("Operator", [fontWeightBold()]));
// style Reference
//     font-style: italic
//     color: Green
const ReferenceStyle = def(styleDef("Reference", [fontStyleItalic(), colorStyle(Green)]));
// style TypeReference
//     font-style: italic
//     color: Blue
const TypeReferenceStyle = def(styleDef("TypeReference", [fontStyleItalic(), colorStyle(Maroon)]));
// style Type
//     color: Blue
const TypeStyle = def(styleDef("Type", [colorStyle(Blue)]));
// style Name
//     color: Yellow
const NameStyle = def(styleDef("Name", [colorStyle(Maroon)]));
// style MemberName
//     color: Yellow
const MemberNameStyle = def(styleDef("MemberName", [colorStyle(Maroon)]));
// style Keyword
//     color: DarkBlue
//     font-weight: bold
const KeywordStyle = def(styleDef("Keyword", [colorStyle(DarkBlue), fontWeightBold()]));
// style Number
//     color: DarkBlue
const NumberStyle = def(styleDef("Number", [colorStyle(DarkBlue)]));

// token Digit
//     '0'..'9'
const DigitTDef = def(tokenDef("Digit", charRangeTT('0', '9')));
// token Alpha
//     'a'..'z' | 'A'..'Z'
const AlphaTDef = def(tokenDef("Alpha", altsTT(charRangeTT('a', 'z'), charRangeTT('A', 'Z'))));
// token AlphaNum
//     Alpha | Digit
const AlphaNumTDef = def(tokenDef("AlphaNum", altsTT(tokenDefRefTT(AlphaTDef), tokenDefRefTT(DigitTDef))));
// token Name
//     [Alpha | '_'] [AlphaNum | '_']*
const NameTDef = def(tokenDef("Name", seqTT(
    parensTT(altsTT(tokenDefRefTT(AlphaTDef), charTT('_'))),
    zeroOrMoreTT(parensTT(altsTT(tokenDefRefTT(AlphaNumTDef), charTT('_'))))
)));

// trait INamed
//     name: Name
setTokenType(tINamed.NameFA, NameTDef);

// concept LanguageModuleRoot
//     definitions: children ILangDefinition*
//     projection
//         definitions*(separator: start-new-line)
addProjection(languageModuleRootDef, undefined, [
    para(zeroOrMore(member(LanguageModuleRoot.DefinitionsCNA)),
         separator(parens([startNewLine(), token("\u00A0"), startNewLine()])))
]);

// concept ConceptStructureMemberDef with INamed
//     type: child ConceptMemberType
//     projection
//         name(style: MemberName) drop-space 
//         ":"(style: Operator) type
addProjection(conceptStructureMemberDefDef, undefined, [
    styledMember(tINamed.NameFA, MemberNameStyle), dropSpace(),
    styledToken(':', OperatorStyle), member(ConceptStructureMemberDef.TypeCA)
]);

// const insertTrivia = InsertTextTrivia.new(heap);
// InsertTextTrivia.TextFA.set(insertTrivia, ";");

// const delTrivia = DeleteCharsTrivia.new(heap);
// DeleteCharsTrivia.DeletedLengthFA.set(delTrivia, 3);

// const sepTrivia = SeparatorTrivia.new(heap);
// SeparatorTrivia.TriviaCNA.insertLast(sepTrivia, delTrivia.me);
// SeparatorTrivia.TriviaCNA.insertLast(sepTrivia, insertTrivia.me);
// const iface = ConceptDef.TraitsCNA.getLastChild(conceptOrTraitDefDef.read)
// tTriviaAttr.TriviaCNA.insertLast(iface?.write!, sepTrivia.me);

// const dropSp = DropSpaceTrivia.new(heap);
// tTriviaAttr.TriviaCNA.insertLast(iface?.write!, dropSp.me);

// const insertTrivia2 = InsertTextTrivia.new(heap);
// InsertTextTrivia.TextFA.set(insertTrivia2, "mnh");
// tTriviaAttr.TriviaCNA.insertLast(iface?.write!, insertTrivia2.me);


// concept ConceptDef
//     isAbstract: bool
//     projection
//         "abstract"(style: Keyword)?isAbstract //semantically only {isAbstract, !isUnion}
//         "union"(style: Keyword)?isUnion // "union"(Keyword)?isUnion
//         "concept"(style: Keyword) name(style: Name)
//         [drop-space ":"(style: Operator) inherit->name(style: Reference))]?inherit //.isPresent
//         ["with"(style: Keyword) traits+(separator: [drop-space ","])]?traits //.isAny
//         indented-block
//             members*(separator: start-new-line)
addProjection(conceptDefDef, undefined, [
    optional(styledToken("abstract", KeywordStyle), ConceptDef.IsAbstractFA),
    optional(styledTokenOnNewLine("union", KeywordStyle), ConceptDef.IsUnionFA, false, "bla bla"),
    styledTokenOnNewLine("concept", KeywordStyle), styledMember(tINamed.NameFA, NameStyle),
    optional(parensOnNewLine([dropSpace(), styledToken(":", OperatorStyle), 
        reference(ConceptDef.InheritFA, styledMember(tINamed.NameFA, ReferenceStyle))
    ]), ConceptDef.InheritFA),
    optional(parensOnNewLine([styledToken("with", KeywordStyle),
        para(oneOrMore(member(ConceptDef.TraitsCNA)), separator(parens([dropSpace(), token(",")])))
    ]), ConceptDef.TraitsCNA),
    indentedBlock([
        para(zeroOrMore(member(ConceptDef.MembersCNA)), separator(startNewLine()))
    ])
]);

// concept TraitDef
//     projection
//         "union"(style: Keyword)?isUnion // "union"(Keyword)?isUnion
//         "trait"(style: Keyword) name(style: Name)
//         [drop-space ":"(style: Operator) inherit->name(style: Reference))]?inherit //.isPresent
//         ["with"(style: Keyword) traits+(separator: [drop-space ","])]?traits //.isAny
//         indented-block
//             members*(separator: start-new-line)
addProjection(traitDefDef, undefined, [
    optional(styledToken("union", KeywordStyle), ConceptDef.IsUnionFA),
    styledToken("trait", KeywordStyle), styledMember(tINamed.NameFA, NameStyle),
    optional(parens([dropSpace(), styledToken(":", OperatorStyle), 
        reference(ConceptDef.InheritFA, styledMember(tINamed.NameFA, ReferenceStyle))
    ]), ConceptDef.InheritFA),
    optional(parens([styledToken("with", KeywordStyle),
        para(oneOrMore(member(ConceptDef.TraitsCNA)), separator(parens([dropSpace(), token(",")])))
    ]), ConceptDef.TraitsCNA),
    indentedBlock([
        para(zeroOrMore(member(ConceptDef.MembersCNA)), separator(startNewLine()))
    ])
]);

// concept TraitRef
//     trait: TraitDef
//     projection
//         trait->name(style: Reference)
addProjection(traitRefDef, undefined, [
    reference(TraitRef.TraitFA, styledMember(tINamed.NameFA, ReferenceStyle))
]);

// concept BoolType
//     projection
//         "bool"(style: Type)
//         [drop-space "?"(style: Operator)]?isOptional
addProjection(boolTypeDef, undefined, [
    styledToken("bool", TypeStyle),
    optional(parens([dropSpace(), styledToken("?", OperatorStyle)]) , NodeRefType.IsOptionalFA)
]);
// concept StringType
//     projection
//         "string"(style: Type)
//         [drop-space "?"(style: Operator)]?isOptional
addProjection(stringTypeDef, undefined, [
    styledToken("string", TypeStyle),
    optional(parens([dropSpace(), styledToken("?", OperatorStyle)]) , NodeRefType.IsOptionalFA)
]);
//concept TokenType 
//         tokenDef: TokenDef
//         projection
//             token->name(style: TypeReference)
//             [drop-space "?"(style: Operator)]?isOptional
addProjection(TokenTypeDef, undefined, [
    reference(TokenType.TokenDefFA, styledMember(tINamed.NameFA, TypeReferenceStyle)),
    optional(parens([dropSpace(), styledToken("?", OperatorStyle)]) , NodeRefType.IsOptionalFA)
]);
// concept DoubleType
//     projection
//         "double"(style: Type)
//         [drop-space "?"(style: Operator)]?isOptional
addProjection(doubleTypeDef, undefined, [
    styledToken("double", TypeStyle),
    optional(parens([dropSpace(), styledToken("?", OperatorStyle)]) , NodeRefType.IsOptionalFA)
]);
// concept IntegerType
//     projection
//         "int"(style: Type)
//         [drop-space "?"(style: Operator)]?isOptional
addProjection(integerTypeDef, undefined, [
    styledToken("int", TypeStyle),
    optional(parens([dropSpace(), styledToken("?", OperatorStyle)]) , NodeRefType.IsOptionalFA)
]);
// concept NodeRefType: 
//     isOptional: bool
//     projection
//         ofConcept->name(style: TypeReference)
//         [drop-space "?"(style: Operator)]?isOptional
addProjection(nodeRefTypeDef, undefined, [
    reference(NodeRefType.OfConceptFA, styledMember(tINamed.NameFA, TypeReferenceStyle)),
    optional(parens([dropSpace(), styledToken("?", OperatorStyle)]) , NodeRefType.IsOptionalFA)
]);
// concept SingleChildType
//     projection
//         "child"(style: Keyword) ofConcept->name(style: TypeReference)
//         [drop-space "?"(style: Operator)]?isOptional
addProjection(singleChildTypeDef, undefined, [
    styledToken("child", KeywordStyle),
    reference(SingleChildType.OfConceptFA, styledMember(tINamed.NameFA, TypeReferenceStyle)),
    optional(parens([dropSpace(), styledToken("?", OperatorStyle)]) , SingleChildType.IsOptionalFA)
]);
// concept ChildrenType //*, +
//     projection
//         "children"(style: Keyword) ofConcept->name(style: TypeReference)
//         drop-space ["*"?isOptional "+"?!isOptional](style: Operator)
addProjection(childrenTypeDef, undefined, [
    styledToken("children", KeywordStyle),
    reference(SingleChildType.OfConceptFA, styledMember(tINamed.NameFA, TypeReferenceStyle)),
    dropSpace(), para(parens([
        optional(token("*"), ChildrenType.IsOptionalFA),
        optional(token("+"), ChildrenType.IsOptionalFA, true)
    ]), style(OperatorStyle))
]);

function styledToken(tokenStr: string, styleDef: INodeRef) {
    return para(token(tokenStr), style(styleDef));
}
function styledTokenOnNewLine(tokenStr: string, styleDef: INodeRef) {
    return para(onNewLine(token(tokenStr)), style(styleDef));
}
function styledMember(memberAcc: IFieldAccessor, styleDef: INodeRef) {
    return para(member(memberAcc), style(styleDef));
}

//TokenLang
heap = tokenLangHeap;
// abstract concept TokenTerm
//     priorities
//         //highest // "abc", 'a', 'a'..'b', TokenRef, [T]
//                   // !['a' | '\n' | 'a'..'b']
//         Quantified   = 40  // T{3}, T{2,}, T{1,5} ... forbidden T{3} (*|+|?)
//                            // T?, T*, T+
//         UnaryPostfix = 30  // T()
//         Sequence     = 20  // T T T
//         Alternative  = 10  // T | T | T
const tokenPriorities = PrioritiesTable.new(heap); //heap.createNode(PrioritiesTable.Def.nodeType);
ConceptOrTraitDef.MembersCNA.insertFirst(TokenTermDef.write, tokenPriorities.me);
const quantifiedPrio = addPriority(tokenPriorities, "Quantified", "40");
const unaryPostfixPrio = addPriority(tokenPriorities, "UnaryPostfix", "30");
const sequencePrio = addPriority(tokenPriorities, "Sequence", "20");
const alternativePrio = addPriority(tokenPriorities, "Alternative", "10");

// style Quote
//     font-weight: bold
// style String
//     color: gray
// style HexNumber
//     color: Purple
// style EscapedBackslash
//     font-weight: bold
// style EscapedChar
//     font-weight: bold
//     color: red
const QuoteStyle = def(styleDef("Quote", [fontWeightBold()]));
const StringStyle = def(styleDef("String", [colorStyle(Gray)]));
const HexNumberStyle = def(styleDef("HexNumber", [colorStyle(Purple)]));
const EscapedBackslashStyle = def(styleDef("EscapedBackslash", [fontWeightBold()]));
const EscapedCharStyle = def(styleDef("EscapedChar", [fontWeightBold(), colorStyle(Red)]));

// token UnsignedInteger
//     Digit+(style: Number) //uint check after parsing
const UnsignedIntegerTD = def(tokenDef("UnsignedInteger", 
    paraTT(oneOrMoreTT(tokenDefRefTT(DigitTDef)), style(NumberStyle))
));
// token HexChar
//     Digit | 'a'..'f' | 'A'..'F'
const HexCharTD = def(tokenDef("HexChar", 
    altsTT(tokenDefRefTT(DigitTDef), charRangeTT('a', 'f'), charRangeTT('A', 'F')) 
));
// token HexColor
//     '#'(style: Operator) [HexChar{6} HexChar{2}?](style: HexNumber)
const HexColorTD = def(tokenDef("HexColor", seqTT(
    paraTT(charTT('#'), style(OperatorStyle)),
    paraTT(parensTT(seqTT(quantTT(tokenDefRefTT(HexCharTD), 6), optionalTT(quantTT(tokenDefRefTT(HexCharTD), 2)))),
        style(HexNumberStyle))
)));
// token EscapedChar
//     '\\'(style: EscapedBackslash)
//     ['\\' | '"' | '\'' | '0' | 'n' | 't' 
//     | 'u' HexChar{4}(style: HexNumber) 
//     | 'u{' HexChar{1,6}(style: HexNumber) '}'
//     ](style: EscapedChar)
const EscapedCharTD = def(tokenDef("EscapedChar", seqTT(
    paraTT(charTT('\\'), style(EscapedBackslashStyle)),
    paraTT(parensTT(altsTT(
        charTT('\\'), charTT('"'), charTT('\''), charTT('0'), charTT('n'), charTT('t'),
        seqTT(charTT('u'), paraTT(quantTT(tokenDefRefTT(HexCharTD), 4), style(HexNumberStyle))),
        seqTT(charTT('u{'), paraTT(quantTT(tokenDefRefTT(HexCharTD), 1,6), style(HexNumberStyle)), charTT('}')),
    )), style(EscapedCharStyle))
)));
// token StringValue
//     [!['\\' | '"'] | EscapedChar]*
const StringValueTD = def(tokenDef("StringValue", 
    zeroOrMoreTT(parensTT(altsTT(
        notTT(charTT('\\'), charTT('"')),
        tokenDefRefTT(EscapedCharTD)
    )))
));
// token CharValue
//     !['\\' | '\''] | EscapedChar
const CharValueTD = def(tokenDef("CharValue", 
    altsTT(
        notTT(charTT('\\'), charTT('\'')),
        tokenDefRefTT(EscapedCharTD)
    )
));

// concept TokenDef with INamed, ILangDefinition
//     term: child TokenTerm
//     projection
//         "token"(style:Keyword) name(style:Name)
//         indented-block
//             term
addProjection(TokenDefDef, undefined, [
    styledToken("token", KeywordStyle), styledMember(tINamed.NameFA, NameStyle),
    indentedBlock([
        member(TokenDef.TermCA)
    ])
]);

// concept ConstantStringTokenTerm
//         value: StringValue
//         projection
//             '"'(style:Quote, match-brace-left) drop-space
//             value(style: String)
//             drop-space '"'(style: Quote, match-brace-right)
setTokenType(ConstantStringTokenTerm.ValueFA, StringValueTD);
addProjection(ConstantStringTokenTermDef, undefined, [
    para(token('"'), style(QuoteStyle), matchBraceLeft()), dropSpace(), 
    styledMember(ConstantStringTerm.ValueFA, StringStyle),  
    dropSpace(), para(token('"'), style(QuoteStyle), matchBraceRight())
]);

// concept ConstantCharTokenTerm with ISingleCharTokenTerm
//     value: CharValue
//     projection
//         '\''(style:Quote, match-brace-left) drop-space
//         value(style: String)
//         drop-space '\''(style:Quote, match-brace-right)
setTokenType(ConstantCharTokenTerm.ValueFA, CharValueTD);
addProjection(ConstantCharTokenTermDef, undefined, [
    para(token('\''), style(QuoteStyle), matchBraceLeft()), dropSpace(), 
    styledMember(ConstantCharTokenTerm.ValueFA, StringStyle),  
    dropSpace(), para(token('\''), style(QuoteStyle), matchBraceRight())
]);


// concept CharRangeTokenTerm with ISingleCharTokenTerm
//     from: ConstantCharTokenTerm
//     to: ConstantCharTokenTerm
//     projection
//         from drop-space ".."(style: Operator) drop-space to
addProjection(CharRangeTokenTermDef, undefined, [
    member(CharRangeTokenTerm.FromCA), dropSpace(),
    styledToken("..", KeywordStyle),
    dropSpace(), member(CharRangeTokenTerm.ToCA)
]);

// concept NotTokenTerm
//     chars: children ISingleCharTokenTerm+
//     //term: child TokenTerm
//     projection //(priority: highest)
//         "!["(style: Operator, match-brace-left) drop-space
//         chars+(separator: "|")
//         drop-space "]"(style: Operator, match-brace-right)
addProjection(NotTokenTermDef, undefined, [
    para(token("!["), style(OperatorStyle), matchBraceLeft()), dropSpace(),
    para(oneOrMore(member(NotTokenTerm.CharsCNA)), separator(token("|"))),
    dropSpace(), para(token("]"), style(OperatorStyle), matchBraceRight())
]);

// concept TokenDefRefTokenTerm
//     token: TokenDef
//     projection
//         token->name(style: Reference)
addProjection(TokenDefRefTokenTermDef, undefined, [
    reference(TokenDefRefTokenTerm.TokenFA, styledMember(tINamed.NameFA, ReferenceStyle))
]);

// concept ParenthesizedTokenTerm
//     term: child TokenTerm
//     projection //(priority: highest)
//         "["(style: Operator, match-brace-left) drop-space
//         term //(priority >= lowest) by default
//         drop-space "]"(style: Operator, match-brace-right)
addProjection(ParenthesizedTokenTermDef, undefined, [
    para(token("["), style(OperatorStyle), matchBraceLeft()), dropSpace(),
    member(ParenthesizedTokenTerm.TermCA),
    dropSpace(), para(token("]"), style(OperatorStyle), matchBraceRight())
]);

// concept QuantizedTokenTerm
//     term: child TokenTerm
//     min: UnsignedInteger
//     isRange: bool
//     max: UnsignedInteger?
//     projection (priority: Quantified)
//         term(priority > this) drop-space
//         "{"(style: Operator, match-brace-left) drop-space
//         min(style: Number)
//         [drop-space ","(style: Operator) max(style: Number)?max]?isRange
//         drop-space "}"(style: Operator, match-brace-right)
setTokenType(QuantizedTokenTerm.MinFA, UnsignedIntegerTD);
setTokenType(QuantizedTokenTerm.MaxFA, UnsignedIntegerTD);
addProjection(QuantizedTokenTermDef, quantifiedPrio, [
    para(member(QuantizedTokenTerm.TermCA), priority(undefined, false)), dropSpace(),
    para(token("{"), style(OperatorStyle), matchBraceLeft()), dropSpace(),
    styledMember(QuantizedTokenTerm.MinFA, NumberStyle),
    optional(parens([dropSpace(), styledToken(",", OperatorStyle),
        optional(styledMember(QuantizedTokenTerm.MaxFA, NumberStyle), QuantizedTokenTerm.MaxFA)
    ]), QuantizedTokenTerm.IsRangeFA),
    dropSpace(), para(token("}"), style(OperatorStyle), matchBraceRight())
]);

// concept OptionalTokenTerm
//     term: child TokenTerm
//     projection (priority: Quantified)
//         term(priority > this) "?"(style: Operator)
addProjection(OptionalTokenTermDef, quantifiedPrio, [
    para(member(OptionalTokenTerm.TermCA), priority(undefined, false)),
    dropSpace(), styledToken("?", OperatorStyle)
]);

// concept ZeroOrMoreTokenTerm
//     term: child TokenTerm
//     projection (priority: Quantified)
//         term(priority > this) drop-space "*"(style: Operator)
addProjection(ZeroOrMoreTokenTermDef, quantifiedPrio, [
    para(member(ZeroOrMoreTokenTerm.TermCA), priority(undefined, false)),
    dropSpace(), styledToken("*", OperatorStyle)
]);

// concept OneOrMoreTokenTerm
//     term: child TokenTerm
//     projection (priority: Quantified)
//         term(priority > this) drop-space "+"(style: Operator)
addProjection(OneOrMoreTokenTermDef, quantifiedPrio, [
    para(member(OneOrMoreTokenTerm.TermCA), priority(undefined, false)),
    dropSpace(), styledToken("+", OperatorStyle)
]);

// concept ParameterizedTokenTerm
//     term: child TokenTerm
//     params: children StyleTermArg+
//     projection (priority: UnaryPostfix)
//         term(priority >= this) drop-space
//         "("(style: Operator, match-brace-left) drop-space
//         params*(separator: [drop-space ","])
//         drop-space ")"(style: Operator, match-brace-right)
addProjection(ParameterizedTokenTermDef, unaryPostfixPrio, [
    para(member(ParameterizedTokenTerm.TermCA), priority(undefined, true)), dropSpace(),
    para(token("("), style(OperatorStyle), matchBraceLeft()), dropSpace(),
    para(zeroOrMore(member(ParameterizedTokenTerm.ParamsCNA)), separator(parens([dropSpace(), token(",")]))),
    dropSpace(), para(token(")"), style(OperatorStyle), matchBraceRight())
]);

// concept SequenceTokenTerm
//     //terms: children TokenTerm{2,}
//     left: child TokenTerm
//     right: child TokenTerm
//     projection (priority: Sequence)
//         left(priority >= this) right(priority > this)
addProjection(SequenceTokenTermDef, sequencePrio, [
    para(member(SequenceTokenTerm.LeftCA), priority(undefined, true)),
    para(member(SequenceTokenTerm.RightCA), priority(undefined, false))
]);


// concept AlternativeTokenTerm //maybe as a sequence of lower priority than SequenceTokenTerm
//     //alternatives: children TokenTerm{2,}
//     left: child TokenTerm
//     right: child TokenTerm
//     projection (priority: Alternative)
//         left(priority >= this) "|"(style: Operator) right(priority > this)
addProjection(AlternativeTokenTermDef, alternativePrio, [
    para(member(AlternativeTokenTerm.LeftCA), priority(undefined, true)),
    styledToken("|", OperatorStyle),
    para(member(AlternativeTokenTerm.RightCA), priority(undefined, false))
]);



//GrammarLang
heap = grammarLangHeap;

// style TermKeyword
//     color: dark-blue
//     font-weight: bold
const TermKeywordStyle = def(styleDef("TermKeyword", [
    colorStyle(DarkBlue),
    fontWeightBold()
]));

// abstract concept ProjectionTerm
//     priorities
//         //highest = maxint   //"abc", name, name:Token, [P P], drop-space, start-new-line, indented-block
//         ReferenceTerm = 30   //name->P ... (done)maybe switch with optional, so name->P?name will work as [name->P]?name
//         UnaryPostfix  = 20   //P(), P*, P+ 
//         OptionalTerm  = 10   //P?cond
//         //lowest = 0
const projectionPriorities = PrioritiesTable.new(heap);
ConceptOrTraitDef.MembersCNA.insertFirst(ProjectionTermDef.write, projectionPriorities.me);
const UnaryPostfixPrio = addPriority(projectionPriorities, "UnaryPostfix", "30");
const ReferenceTermPrio = addPriority(projectionPriorities, "ReferenceTerm", "20");
const OptionalTermPrio = addPriority(projectionPriorities, "OptionalTerm", "10");

// concept Projection with IConceptMember, ILangDefinition
//     concept: ConceptOrTraitDef? //only set when not in role of IConceptMember
//     priority: PriorityDef?
//     terms: children ProjectionTerm*
//     projection
//         "projection"(style:Keyword) concept->name(style:TypeReference) // ?concept is automatic
//         ["("(style: Operator, match-brace-left) drop-space
//          "priority"(style:Keyword) drop-space ":"(style: Operator) priority->name(style: Reference)
//          drop-space ")"(style: Operator, match-brace-right)
//         ]?priority
//         indented-block
//             terms* //(separator: " ") - " " is the default separator for non-tokens
addProjection(ProjectionDef, undefined, [
    styledToken("projection", KeywordStyle),
    reference(Projection.ConceptFA, styledMember(tINamed.NameFA, TypeReferenceStyle)),
    optional(parens([
        para(token("("), style(OperatorStyle), matchBraceLeft()), dropSpace(),
        styledToken("priority", KeywordStyle),
        dropSpace(), styledToken(":", OperatorStyle),
        reference(Projection.PriorityFA, styledMember(tINamed.NameFA, ReferenceStyle)),
        dropSpace(), para(token(")"), style(OperatorStyle), matchBraceRight())
    ]), Projection.PriorityFA),
    indentedBlock([
        zeroOrMore(member(Projection.TermsCNA))
    ])    
]);

// concept PrioritiesTable with IConceptMember
//     priorities: children PriorityDef*
//     projection
//         "priorities"(style: Keyword)
//         indented-block
//             priorities*(separator: start-new-line)
addProjection(PrioritiesTableDef, undefined, [
    styledToken("priorities", KeywordStyle),
    indentedBlock([
        para(zeroOrMore(member(PrioritiesTable.PrioritiesCNA)), separator(startNewLine()))
    ])    
]);

// concept PriorityDef with INamed
//     value: UnsignedInteger
//     projection
//         name(style: Name) "="(style: Operator) value
setTokenType(PriorityDef.ValueFA, UnsignedIntegerTD);
addProjection(PriorityDefDef, undefined, [
    styledMember(tINamed.NameFA, NameStyle),
    styledToken("=", OperatorStyle),
    member(PriorityDef.ValueFA)
]);

// concept ConstantStringTerm
//     value: StringValue
//     projection
//         '"'(style:Quote, match-brace-left) drop-space
//         value(style: String)
//         drop-space '"'(style:Quote, match-brace-right)
setTokenType(ConstantStringTerm.ValueFA, StringValueTD);
addProjection(ConstantStringTermDef, undefined, [
    para(token("\""), style(QuoteStyle), matchBraceLeft()), dropSpace(),
    styledMember(ConstantStringTerm.ValueFA, StringStyle),
    dropSpace(), para(token("\""), style(QuoteStyle), matchBraceRight())
]);

// concept StructureMemberTerm
//     member: ConceptStructureMemberDef
//     projection
//         member->name(style: Reference)
addProjection(StructureMemberTermDef, undefined, [
    reference(StructureMemberTerm.MemberFA, styledMember(tINamed.NameFA, ReferenceStyle)),
]);

// concept TokenConstrainTerm
//     memberTerm: child StructureMemberTerm
//     tokenDef: TokenDef
//     projection //(priority: highest)
//         memberTerm drop-space ":"(style: Operator) drop-space
//         tokenDef->name(style: TypeReference)
addProjection(TokenConstrainTermDef, undefined, [
    member(TokenConstrainTerm.MemberTermCA), dropSpace(),
    styledToken(":", OperatorStyle), dropSpace(),
    reference(TokenConstrainTerm.TokenDefFA, styledMember(tINamed.NameFA, TypeReferenceStyle)),
]);

// concept ParenthesizedTerm
//     terms: children ProjectionTerm+
//     projection
//         "["(style: Operator, match-brace-left) drop-space
//         terms+ //(priority >= lowest, separator: " ")
//         drop-space "]"(style: Operator, match-brace-right)
addProjection(ParenthesizedTermDef, undefined, [
    para(token("["), style(OperatorStyle), matchBraceLeft()), dropSpace(),
    oneOrMore(member(ParenthesizedTerm.TermsCNA)),
    dropSpace(), para(token("]"), style(OperatorStyle), matchBraceRight())
]);

// concept DropSpaceTerm
//     projection
//         "drop-space"(style: TermKeyword)
addProjection(DropSpaceTermDef, undefined, [
    styledToken("drop-space", TermKeywordStyle)
]);

// concept StartNewLineTerm
//     projection
//         "start-new-line"(style: TermKeyword)
addProjection(StartNewLineTermDef, undefined, [
    styledToken("start-new-line", TermKeywordStyle)
]);

// concept IndentedBlockTerm
//     terms: children ProjectionTerm+
//     projection //(priority: highest)
//         start-new-line "indented-block"(style: TermKeyword)
//         indented-block
//             terms+ //(priority >= lowest, separator: " ")
addProjection(IndentedBlockTermDef, undefined, [
    startNewLine(), styledToken("indented-block", TermKeywordStyle),
    indentedBlock([
        oneOrMore(member(IndentedBlockTerm.TermsCNA))
    ])
]);

// concept ReferenceTerm
//     memberTerm: child StructureMemberTerm
//     projectionTerm: child ProjectionTerm
//     projection (priority: ReferenceTerm)
//         memberTerm drop-space "->"(style: Operator) drop-space
//         projectionTerm(priority > this)
addProjection(ReferenceTermDef, ReferenceTermPrio, [
    member(ReferenceTerm.MemberTermCA), dropSpace(),
    styledToken("->", OperatorStyle), dropSpace(),
    para(member(ReferenceTerm.ProjectionTermCA), priority(undefined, false))
]);

// concept ParameterizedTerm
//     term: child ProjectionTerm
//     arguments: children TermArgument+
//     projection (priority: UnaryPostfix)
//         term(priority >= this) drop-space
//         "("(style: Operator, match-brace-left) drop-space
//         arguments+(separator: [drop-space ","])
//         drop-space ")"(style: Operator, match-brace-right)
addProjection(ParameterizedTermDef, UnaryPostfixPrio, [
    para(member(ParameterizedTerm.TermCA), priority(undefined, true)), dropSpace(),
    para(token("("), style(OperatorStyle), matchBraceLeft()), dropSpace(),
    para(oneOrMore(member(ParameterizedTerm.ArgumentsCNA)), separator(parens([dropSpace(), token(",")]))),
    dropSpace(), para(token(")"), style(OperatorStyle), matchBraceRight())
]);

// concept ZeroOrMoreTerm
//     term: child ProjectionTerm
//     projection (priority: UnaryPostfix)
//         term(priority >= this) drop-space "*"(style: Operator)
addProjection(ZeroOrMoreTermDef, UnaryPostfixPrio, [
    para(member(ZeroOrMoreTerm.TermCA), priority(undefined, true)),
    dropSpace(), styledToken("*", OperatorStyle)
]);

// concept OneOrMoreTerm
//     term: child ProjectionTerm
//     projection (priority: UnaryPostfix)
//         term(priority >= this) drop-space "+"(style: Operator)
addProjection(OneOrMoreTermDef, UnaryPostfixPrio, [
    para(member(OneOrMoreTerm.TermCA), priority(undefined, true)),
    dropSpace(), styledToken("+", OperatorStyle)
]);

// concept OptionalTerm
//     term: child ProjectionTerm
//     condition: child TermConditionalExpr
//     projection (priority: OptionalTerm)
//         term(priority >= this) drop-space "?"(style: Operator) drop-space condition
addProjection(OptionalTermDef, OptionalTermPrio, [
    para(member(OptionalTerm.TermCA), priority(undefined, true)),
    dropSpace(), styledToken("?", OperatorStyle),
    dropSpace(), member(OptionalTerm.ConditionCA)
]);

// concept StructureMemberRefTCExpr // with ILeftDotTCExpr
//     member: ConceptStructureMember
//     projection
//         member->name(style: Reference)
addProjection(StructureMemberRefTCExprDef, undefined, [
    reference(StructureMemberRefTCExpr.MemberFA, styledMember(tINamed.NameFA, ReferenceStyle))
]);

// concept NotExpr
//     operand: child StructureMemberRefTCExpr //TermConditionalExpr
//     projection
//         "!"(style: Operator) drop-space operand
addProjection(NotExprDef, undefined, [
    styledToken("!", OperatorStyle), dropSpace(),
    member(NotExpr.OperandCA)
]);

// concept StyleTermArg
//     style: StyleDef
//     projection
//         "style"(style: Keyword) drop-space ":"(style: Operator)
//         style->name(style: Reference)
addProjection(StyleTermArgDef, undefined, [
    styledToken("style", KeywordStyle), dropSpace(),
    styledToken(":", OperatorStyle),
    reference(StyleTermArg.StyleFA, styledMember(tINamed.NameFA, ReferenceStyle))
]);

// concept SeparatorTermArg
//     term: child ProjectionTerm
//     projection
//         "separator"(style: Keyword) drop-space ":"(style: Operator)
//         term
addProjection(SeparatorTermArgDef, undefined, [
    styledToken("separator", KeywordStyle), dropSpace(),
    styledToken(":", OperatorStyle),
    member(SeparatorTermArg.TermCA)
]);

// concept MatchBraceLeftTermArg
//     projection
//         "match-brace-left"(style: Keyword)
addProjection(MatchBraceLeftTermArgDef, undefined, [
    styledToken("match-brace-left", KeywordStyle)
]);

// concept MatchBraceRightTermArg
//     projection
//         "match-brace-right"(style: Keyword)
addProjection(MatchBraceRightTermArgDef, undefined, [
    styledToken("match-brace-right", KeywordStyle)
]);

// concept PriorityTermArg
//     priorityDef: PriorityDef?
//     canBeEqual: bool
//     projection
//         "priority"(style: Keyword)  [">"?!canBeEqual ">="?canBeEqual](style: Operator)
//         priorityDef->name(style: Reference)
//         "this"(style: Keyword)?!priorityDef
addProjection(PriorityTermArgDef, undefined, [
    styledToken("priority", KeywordStyle),
    para(parens([
        optional(token(">"), PriorityTermArg.CanBeEqualFA, true),
        optional(token(">="), PriorityTermArg.CanBeEqualFA),
    ]), style(OperatorStyle)),
    reference(PriorityTermArg.PriorityDefFA, styledMember(tINamed.NameFA, ReferenceStyle)),
    optional(styledToken("this", KeywordStyle), PriorityTermArg.PriorityDefFA, true)
]);

// concept StyleDef with IName, ILangDefinition
//     attributes: children StyleAttribute*
//     projection
//         "style"(style: Keyword) name(style: Name)
//         indented-block
//             attributes*(separator: start-new-line)
addProjection(StyleDefDef, undefined, [
    styledToken("style", KeywordStyle),
    styledMember(tINamed.NameFA, NameStyle),
    indentedBlock([
        para(zeroOrMore(member(StyleDef.AttributesCNA)), separator(startNewLine()))
    ])
]);

// concept FontWeightStyleAttr
//     weight: child FontWeight
//     projection
//         "font-weight"(style: Keyword) drop-space ":"(style: Operator) weight
addProjection(FontWeightStyleAttrDef, undefined, [
    styledToken("font-weight", KeywordStyle), dropSpace(),
    styledToken(":", OperatorStyle),
    member(FontWeightStyleAttr.WeightCA)
]);
// concept FontStyleStyleAttr
//     style: child FontStyle
//     projection
//         "font-style"(style: Keyword) drop-space ":"(style: Operator) style
addProjection(FontStyleStyleAttrDef, undefined, [
    styledToken("font-style", KeywordStyle), dropSpace(),
    styledToken(":", OperatorStyle),
    member(FontStyleStyleAttr.StyleCA)
]);

// concept ColorStyleAttr
//     color: child ColorExpr
//     projection
//         "color"(style: Keyword) drop-space ":"(style: Operator) color
addProjection(ColorStyleAttrDef, undefined, [
    styledToken("color", KeywordStyle), dropSpace(),
    styledToken(":", OperatorStyle),
    member(ColorStyleAttr.ColorCA)
]);

// concept BoldFontWeight
//     projection
//         "bold"(style: Keyword)
addProjection(BoldFontWeightDef, undefined, [
    styledToken("bold", KeywordStyle)
]);

// concept NormalFontWeight
//     projection
//         "normal"(style: Keyword)
addProjection(NormalFontWeightDef, undefined, [
    styledToken("normal", KeywordStyle)
]);

// concept ItalicFontStyle
//     projection
//         "italic"(style: Keyword)
addProjection(ItalicFontStyleDef, undefined, [
    styledToken("italic", KeywordStyle)
]);

// concept NormalFontStyle
//     projection
//         "normal"(style: Keyword)
addProjection(NormalFontStyleDef, undefined, [
    styledToken("normal", KeywordStyle)
]);

// concept ColorDefRef
//     color: ColorDef
//     projection
//         color->name(style: Reference)
addProjection(ColorDefRefDef, undefined, [
    reference(ColorDefRef.ColorFA, styledMember(tINamed.NameFA, ReferenceStyle))
]);

// concept ColorRGB
//     hexValue: HexColor
//     projection
//         hexValue
setTokenType(ColorRGB.HexValueFA, HexColorTD);
addProjection(ColorRGBDef, undefined, [
    member(ColorRGB.HexValueFA)
]);

// concept ColorDef with INamed
//     color: HexColor
//         projection
//             "color"(style: Keyword) name(style: Name) "="(style: Operator) color
setTokenType(ColorDef.ColorFA, HexColorTD);
addProjection(ColorDefDef, undefined, [
    styledToken("color", KeywordStyle),
    styledMember(tINamed.NameFA, NameStyle),
    styledToken("=", OperatorStyle),
    member(ColorDef.ColorFA)
]);

//GrammarTrivia
heap = grammarTriviaLangHeap;
const CommentStyle = def(styleDef("Comment", [colorStyle(Green)]));

// concept CommentToEOL
//     text: string
//     projection
//       "//"(style: Comment) drop-space text(style: Comment) start-new-line
addProjection(CommentToEOLDef, undefined, [
    styledToken('//', CommentStyle), dropSpace(),
    styledMember(CommentToEOL.TextFA, CommentStyle), startNewLine()
]);

function addProjection(parent: INodeRef, priority: INodeRef | undefined, terms: INodeRef[]) {
    const proj = Projection.new(heap);
    ConceptOrTraitDef.MembersCNA.insertLast(parent.write, proj.me);
    if(priority != undefined) {
        Projection.PriorityFA.set(proj, priority);
    }
    for (const term of terms) {
        Projection.TermsCNA.insertLast(proj, term);
    }
    return proj;
}
function def(definition: INodeRef) {
    const root = heap.root.write;
    LanguageModuleRoot.DefinitionsCNA.insertLast(root, definition);
    return definition;
}

function token(str: string) {
    const token = ConstantStringTerm.new(heap);
    ConstantStringTerm.ValueFA.set(token, str);
    return token.me;
}

function member(memberAcc: IFieldAccessor) {
    const term = StructureMemberTerm.new(heap);
    StructureMemberTerm.MemberFA.set(term, memberAcc.fieldDefNode);
    return term.me;
}

function parens(terms: INodeRef[]) {
    const n = ParenthesizedTerm.new(heap);
    for (const term of terms) {
        ParenthesizedTerm.TermsCNA.insertLast(n, term);
    }
    return n.me;
}
function parensOnNewLine(terms: INodeRef[]) {
    return onNewLine(parens(terms));
}

function dropSpace() {
    return DropSpaceTerm.new(heap).me;
}
function startNewLine() {
    return StartNewLineTerm.new(heap).me;
}
function indentedBlock(terms: INodeRef[]) {
    const n = IndentedBlockTerm.new(heap);
    for (const term of terms) {
        IndentedBlockTerm.TermsCNA.insertLast(n, term);
    }
    return n.me;
}
function reference(memberAcc: IFieldAccessor, proj: INodeRef) {
    const memberTerm = member(memberAcc);
    const term = ReferenceTerm.new(heap);
    ReferenceTerm.MemberTermCA.setChild(term, memberTerm);
    ReferenceTerm.ProjectionTermCA.setChild(term, proj);
    return term.me;
}
function para(term: INodeRef, ...args: INodeRef[]) {
    const n = ParameterizedTerm.new(heap);
    ParameterizedTerm.TermCA.setChild(n, term);
    for (const arg of args) {
        ParameterizedTerm.ArgumentsCNA.insertLast(n, arg);
    }
    return n.me;
}
function zeroOrMore(term: INodeRef) {
    const n = ZeroOrMoreTerm.new(heap);
    ZeroOrMoreTerm.TermCA.setChild(n, term);
    return n.me;
}
function oneOrMore(term: INodeRef) {
    const n = OneOrMoreTerm.new(heap);
    OneOrMoreTerm.TermCA.setChild(n, term);
    return n.me;
}
function onNewLine(term: INodeRef) {
    const n = StartNewLineTrivia.new(heap);
    Trivia.TokenPositionFA.set(n, 0);
    tTriviaAttr.TriviaCNA.insertLast(term.write, n.me);
    return term;
}
function optional(term: INodeRef, memberAcc: IFieldAccessor, isNegated = false, comment?: string) {
    const n = OptionalTerm.new(heap);
    OptionalTerm.TermCA.setChild(n, term);
    let cond = StructureMemberRefTCExpr.new(heap);
    if(comment) {

        // const delTrivia = DeleteCharsTrivia.new(heap);
        // Trivia.TokenPositionFA.set(delTrivia, 0);
        // Trivia.CharPositionFA.set(delTrivia, 2);
        // DeleteCharsTrivia.DeletedLengthFA.set(delTrivia, 3);
        // tTriviaAttr.TriviaCNA.insertLast(cond, delTrivia.me);

        const space = InsertTextTrivia.new(heap);
        InsertNodeTrivia.TokenPositionFA.set(space, 0);
        InsertNodeTrivia.CharPositionFA.set(space, Infinity);
        InsertTextTrivia.TextFA.set(space, " ");
        tTriviaAttr.TriviaCNA.insertLast(cond, space.me);

        const commentEOL = CommentToEOL.new(heap);
        CommentToEOL.TextFA.set(commentEOL, comment);
        const commentTrivia = InsertNodeTrivia.new(heap);
        InsertNodeTrivia.TokenPositionFA.set(commentTrivia, 0);
        InsertNodeTrivia.CharPositionFA.set(commentTrivia, Infinity);
        InsertNodeTrivia.NodeCA.setChild(commentTrivia, commentEOL.me);
        tTriviaAttr.TriviaCNA.insertLast(cond, commentTrivia.me);
        //tTriviaAttr.TriviaCNA.insertLast(cond, space.me);

    }
    StructureMemberRefTCExpr.MemberFA.set(cond, memberAcc.fieldDefNode);
    if(isNegated) {
        const ncond = NotExpr.new(heap);
        NotExpr.OperandCA.setChild(ncond, cond.me);
        cond = ncond;
    }
    OptionalTerm.ConditionCA.setChild(n, cond.me);
    return n.me;
}
function style(styleDef: INodeRef) {
    const n = StyleTermArg.new(heap);

    // const dsTrivia = DropSpaceTrivia.new(heap);
    // Trivia.TokenPositionFA.set(dsTrivia, 2);
    // Trivia.CharPositionFA.set(dsTrivia, 0);
    // tTriviaAttr.TriviaCNA.insertLast(n, dsTrivia.me);

    // const space = InsertTextTrivia.new(heap);
    // InsertNodeTrivia.TokenPositionFA.set(space, Infinity);
    // InsertNodeTrivia.CharPositionFA.set(space, 0);
    // InsertTextTrivia.TextFA.set(space, "X-X");
    // tTriviaAttr.TriviaCNA.insertLast(n, space.me);
      

    StyleTermArg.StyleFA.set(n, styleDef);
    return n.me;
}
function separator(term: INodeRef) {
    const n = SeparatorTermArg.new(heap);
    SeparatorTermArg.TermCA.setChild(n, term);
    return n.me;
}
function matchBraceLeft() {
    const n = MatchBraceLeftTermArg.new(heap);
    return n.me;
}
function matchBraceRight() {
    const n = MatchBraceRightTermArg.new(heap);
    return n.me;
}
function priority(prioDef?: INodeRef, canBeEqual = true) {
    const n = PriorityTermArg.new(heap);
    if(prioDef != undefined)
        PriorityTermArg.PriorityDefFA.set(n, prioDef);
    if(canBeEqual) PriorityTermArg.CanBeEqualFA.set(n, true);
    return n.me;
}
function styleDef(name: string, attributes: INodeRef[]) {
    const n = StyleDef.new(heap);
    tINamed.NameFA.set(n, name);
    for (const attr of attributes) {
        StyleDef.AttributesCNA.insertLast(n, attr);
    }
    return n.me;
}
function fontWeightBold() {
    const n = FontWeightStyleAttr.new(heap);
    FontWeightStyleAttr.WeightCA.setChild(n, BoldFontWeight.new(heap).me);
    return n.me;
}
function fontWeightNormal() {
    const n = FontWeightStyleAttr.new(heap);
    FontWeightStyleAttr.WeightCA.setChild(n, NormalFontWeight.new(heap).me);
    return n.me;
}
function fontStyleItalic() {
    const n = FontStyleStyleAttr.new(heap);
    FontStyleStyleAttr.StyleCA.setChild(n, ItalicFontStyle.new(heap).me);
    return n.me;
}
function fontStyleNormal() {
    const n = FontStyleStyleAttr.new(heap);
    FontStyleStyleAttr.StyleCA.setChild(n, NormalFontStyle.new(heap).me);
    return n.me;
}
function colorStyle(colorDef: INodeRef) {
    const n = ColorStyleAttr.new(heap);
    const cr = ColorDefRef.new(heap);
    ColorDefRef.ColorFA.set(cr, colorDef);
    ColorStyleAttr.ColorCA.setChild(n, cr.me);
    return n.me;
}
function colorDef(name: string, hexColor: string) {
    const n = ColorDef.new(heap);
    tINamed.NameFA.set(n, name);
    ColorDef.ColorFA.set(n, hexColor);
    return n.me;
}

function addPriority(prioritiesTable: IWriteNode, name: string, value: string) {
    const priority = PriorityDef.new(heap);
    tINamed.NameFA.set(priority, name);
    PriorityDef.ValueFA.set(priority, value);
    PrioritiesTable.PrioritiesCNA.insertLast(prioritiesTable, priority.me);
    return priority.me;
}
function tokenDef(name: string, tokenTerm: INodeRef) {
    const n = TokenDef.new(heap);
    tINamed.NameFA.set(n, name);
    TokenDef.TermCA.setChild(n, tokenTerm);
    return n.me;
}
function stringTT(str: string) {
    const token = ConstantStringTokenTerm.new(heap);
    ConstantStringTokenTerm.ValueFA.set(token, str);
    return token.me;
}
function charTT(char: string) {
    const token = ConstantCharTokenTerm.new(heap);
    ConstantCharTokenTerm.ValueFA.set(token, char);
    return token.me;
}
function charRangeTT(from: string, to: string) {
    const token = CharRangeTokenTerm.new(heap);
    CharRangeTokenTerm.FromCA.setChild(token, charTT(from));
    CharRangeTokenTerm.ToCA.setChild(token, charTT(to));
    return token.me;
}
function notTT(...singleCharTTs: INodeRef[]) {
    const token = NotTokenTerm.new(heap);
    for (const tt of singleCharTTs) {
        NotTokenTerm.CharsCNA.insertLast(token, tt);
    }
    return token.me;
}
function tokenDefRefTT(tokenDef: INodeRef) {
    const token = TokenDefRefTokenTerm.new(heap);
    TokenDefRefTokenTerm.TokenFA.set(token, tokenDef);
    return token.me;
}
function parensTT(tt: INodeRef) {
    const token = ParenthesizedTokenTerm.new(heap);
    ParenthesizedTokenTerm.TermCA.setChild(token, tt);
    return token.me;
}
function quantTT(tt: INodeRef, min: number, max?: number|"inf") {
    const token = QuantizedTokenTerm.new(heap);
    QuantizedTokenTerm.TermCA.setChild(token, tt);
    QuantizedTokenTerm.MinFA.set(token, Math.trunc(min).toString());
    if(max !== undefined) {
        QuantizedTokenTerm.IsRangeFA.set(token, true);
        if(typeof(max) == "number")
            QuantizedTokenTerm.MaxFA.set(token, Math.trunc(max).toString());
    }
    return token.me;
}
function optionalTT(tt: INodeRef) {
    const token = OptionalTokenTerm.new(heap);
    OptionalTokenTerm.TermCA.setChild(token, tt);
    return token.me;
}
function zeroOrMoreTT(tt: INodeRef) {
    const token = ZeroOrMoreTokenTerm.new(heap);
    ZeroOrMoreTokenTerm.TermCA.setChild(token, tt);
    return token.me;
}
function oneOrMoreTT(tt: INodeRef) {
    const token = OneOrMoreTokenTerm.new(heap);
    OneOrMoreTokenTerm.TermCA.setChild(token, tt);
    return token.me;
}
function paraTT(tt: INodeRef, ...args: INodeRef[]) {
    const token = ParameterizedTokenTerm.new(heap);
    ParameterizedTokenTerm.TermCA.setChild(token, tt);
    for (const arg of args) {
        ParameterizedTokenTerm.ParamsCNA.insertLast(token, arg);
    }
    return token.me;
}
function seqTT(...tts: INodeRef[]) {
    if(!(tts.length >= 2)) throw Error("at least two tts are needed for seqTT");
    const token = SequenceTokenTerm.new(heap);
    SequenceTokenTerm.RightCA.setChild(token, tts[tts.length-1])
    const left = tts.length == 2 ? tts[0] : seqTT(...tts.slice(0, tts.length-1));
    SequenceTokenTerm.LeftCA.setChild(token, left);
    return token.me;
}
function altsTT(...tts: INodeRef[]) {
    if(!(tts.length >= 2)) throw Error("at least two tts are needed for altsTT");
    const token = AlternativeTokenTerm.new(heap);
    AlternativeTokenTerm.RightCA.setChild(token, tts[tts.length-1])
    const left = tts.length == 2 ? tts[0] : altsTT(...tts.slice(0, tts.length-1));
    AlternativeTokenTerm.LeftCA.setChild(token, left);
    return token.me;
}

function setTokenType(memberAcc: IFieldAccessor, tokenDef: INodeRef) {
    const stringMemberType = ConceptStructureMemberDef.TypeCA.getChild(memberAcc.fieldDefNode.read)?.write;
    stringMemberType!.setDef(TokenTypeDef);
    TokenType.TokenDefFA.set(stringMemberType!, tokenDef);
}

globalState.changeMap = origChangeMap;
