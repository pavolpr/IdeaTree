/*
concept TokenDef with INamed, ILangDefinition
    term: child TokenTerm
    projection
        "token"(style:Keyword) name(style:Name)
        indented-block
            term

abstract concept TokenTerm
    priorities
        //highest // "abc", 'a', 'a'..'b', TokenRef, [T]
                  // !['a' | '\n' | 'a'..'b']
        Quantified   = 40  // T{3}, T{2,}, T{1,5} ... forbidden T{3} (*|+|?)
                           // T?, T*, T+
        UnaryPostfix = 30  // T()
        Sequence     = 20  // T T T
        Alternative  = 10  // T | T | T

    concept ConstantStringTokenTerm
        value: StringValue
        projection
            '"'(style:Quote, match-brace-left) drop-space
            value(style: String)
            drop-space '"'(style: Quote, match-brace-right)

    trait ISingleCharTokenTerm

    concept ConstantCharTokenTerm with ISingleCharTokenTerm
        value: CharValue
        projection
            '\''(style:Quote, match-brace-left) drop-space
            value(style: String)
            drop-space '\''(style:Quote, match-brace-right)

    concept CharRangeTokenTerm with ISingleCharTokenTerm
        from: ConstantCharTokenTerm
        to: ConstantCharTokenTerm
        projection
            from drop-space ".." drop-space to
        //from: CharValue
        //to: CharValue
        //projection
        //    '\''(style:Quote, match-brace-left) drop-space from(style: String) drop-space '\''(style:Quote, match-brace-right)
        //    drop-space ".."(style: Operator) drop-space
        //    '\''(style:Quote, match-brace-left) drop-space to(style: String) drop-space '\''(style:Quote, match-brace-right)

    concept NotTokenTerm
        chars: children ISingleCharTokenTerm+
        //term: child TokenTerm
        projection //(priority: highest)
            "!["(style: Operator, match-brace-left) drop-space
            chars+(separator: "|")
            drop-space "]"(style: Operator, match-brace-right)
            //"!"(style: Operator) term(priority >= this)

    concept TokenDefRefTokenTerm
        token: TokenDef
        projection
            token->name(style: Reference)

    concept ParenthesizedTokenTerm
        term: child TokenTerm
        projection //(priority: highest)
            "["(style: Operator, match-brace-left) drop-space
            term //(priority >= lowest) by default
            drop-space "]"(style: Operator, match-brace-right)

    concept QuantizedTokenTerm
        term: child TokenTerm
        min: UnsignedInteger
        isRange: bool
        max: UnsignedInteger?
        projection (priority: Quantified)
            term(priority > this) drop-space
            "{"(style: Operator, match-brace-left) drop-space
            min(style: Number)
            [drop-space ","(style: Operator) max(style: Number)?max]?isRange
            drop-space "}"(style: Operator, match-brace-right)

    concept OptionalTokenTerm
        term: child TokenTerm
        projection (priority: Quantified)
            term(priority > this) "?"(style: Operator)

    concept ZeroOrMoreTokenTerm
        term: child TokenTerm
        projection (priority: Quantified)
            term(priority > this) "*"(style: Operator)

    concept OneOrMoreTokenTerm
        term: child TokenTerm
        projection (priority: Quantified)
            term(priority > this) "+"(style: Operator)
    
    concept ParameterizedTokenTerm
        term: child TokenTerm
        params: children StyleTermArg+
        projection (priority: UnaryPostfix)
            term(priority >= this) drop-space
            "("(style: Operator, match-brace-left) drop-space
            params*(separator: [drop-space ","])
            drop-space ")"(style: Operator, match-brace-right)
    
    concept SequenceTokenTerm
        //terms: children TokenTerm{2,}
        left: child TokenTerm
        right: child TokenTerm
        projection (priority: Sequence)
            left(priority >= this) right(priority > this)
            //terms{2,}(priority > this) //separator: " "

    concept AlternativeTokenTerm //maybe as a sequence of lower priority than SequenceTokenTerm
        //alternatives: children TokenTerm{2,}
        left: child TokenTerm
        right: child TokenTerm
        projection (priority: Alternative)
            left(priority >= this) "|"(style: Operator) right(priority > this)
            //alternatives{2,}(priority > this, separator: "|"(style: Operator))

style Quote
    font-weight: bold
style String
    color: gray

style HexNumber
    color: Purple

style EscapedBackslash
    font-weight: bold
style EscapedChar
    font-weight: bold
    color: red

token UnsignedInteger
    Digit+(style: Number) //uint check after parsing

token HexChar
    Digit | 'a'..'f' | 'A'..'F'
token HexColor
    '#'(style: Operator) [HexChar{6} HexChar{2}?](style: HexNumber)

token EscapedChar
    '\\'(style: EscapedBackslash)
    ['\\' | '"' | '\'' | '0' | 'n' | 't' 
    | 'u' HexChar{4}(style: HexNumber) 
    | 'u{' HexChar{1,6}(style: HexNumber) '}'
    ](style: EscapedChar)

token StringValue
    [!['\\' | '"'] | EscapedChar]*
token CharValue
    !['\\' | '\''] | EscapedChar


*/
import { LangBuilder, BaseConcept, tokenLangGuid, TokenDefDef, StyleTermArgDef } from "../concept";
import { tINamedDef, tILangDefinitionDef } from "./structureLang";
import { mix, Mixin } from "../mixins";
import { getSidx } from "../utils";

//a little hack, as styleTermArgDefNodeRef is the only one node circling between grammar and token langs


const lb = new LangBuilder(tokenLangGuid, "Token", 60);

lb.newConceptDefNode(getSidx(TokenDefDef.uid), "TokenDef");
export const TokenTermDef = lb.newConceptDefNode(2, "TokenTerm");
export const ConstantStringTokenTermDef = lb.newConceptDefNode(3, "ConstantStringTokenTerm");
export const tISingleCharTokenTermDef = lb.newTraitDefNode(4, "ISingleCharTokenTerm");
export const ConstantCharTokenTermDef = lb.newConceptDefNode(5, "ConstantCharTokenTerm");
export const CharRangeTokenTermDef = lb.newConceptDefNode(6, "CharRangeTokenTerm");
export const NotTokenTermDef = lb.newConceptDefNode(7, "NotTokenTerm");
export const TokenDefRefTokenTermDef = lb.newConceptDefNode(8, "TokenDefRefTokenTerm");
export const ParenthesizedTokenTermDef = lb.newConceptDefNode(9, "ParenthesizedTokenTerm");
export const QuantizedTokenTermDef = lb.newConceptDefNode(10, "QuantizedTokenTerm");
export const OptionalTokenTermDef = lb.newConceptDefNode(11, "OptionalTokenTerm");
export const ZeroOrMoreTokenTermDef = lb.newConceptDefNode(12, "ZeroOrMoreTokenTerm");
export const OneOrMoreTokenTermDef = lb.newConceptDefNode(13, "OneOrMoreTokenTerm");
export const ParameterizedTokenTermDef = lb.newConceptDefNode(14, "ParameterizedTokenTerm");
export const SequenceTokenTermDef = lb.newConceptDefNode(15, "SequenceTokenTerm");
export const AlternativeTokenTermDef = lb.newConceptDefNode(16, "AlternativeTokenTerm");

// concept TokenDef with INamed, ILangDefinition
//     term: child TokenTerm
//     projection
//         "token"(style:Keyword) name(style:Name)
//         indented-block
//             term
export class TokenDef extends BaseConcept {
    static Def = new TokenDef(TokenDefDef);
    static TermCA = lb.childAccessor(TokenDefDef, TokenTermDef, 17, "term");
}
lb.hasTrait(TokenDefDef, tINamedDef);
lb.hasTrait(TokenDefDef, tILangDefinitionDef);

// abstract concept TokenTerm
export class TokenTerm extends BaseConcept {
    static Def = new TokenTerm(TokenTermDef);
}
//     priorities
//         //highest // "abc", 'a', 'a'..'b', TokenRef, [T]
//                   // !['a' | '\n' | 'a'..'b']
//         Quantified   = 40  // T{3}, T{2,}, T{1,5} ... forbidden T{3} (*|+|?)
//                            // T?, T*, T+
//         UnaryPostfix = 30  // T()
//         Sequence     = 20  // T T T
//         Alternative  = 10  // T | T | T

//     concept ConstantStringTokenTerm
//         value: StringValue
//         projection
//             '"'(style:Quote, match-brace-left) drop-space
//             value(style: String)
//             drop-space '"'(style: Quote, match-brace-right)
export class ConstantStringTokenTerm extends TokenTerm {
    static Def = new ConstantStringTokenTerm(ConstantStringTokenTermDef);
    static ValueFA = lb.stringFieldAccessor(ConstantStringTokenTermDef, 28, "value"); //TODO token StringValue
}
lb.subTypeAsMember(TokenTermDef, ConstantStringTokenTermDef);

//     trait ISingleCharTokenTerm
export const tISingleCharTokenTerm = {
    M: new Mixin(tISingleCharTokenTermDef, (sc: typeof BaseConcept) => class ISingleCharTokenTerm extends sc { })
};
lb.subTypeAsMember(TokenTermDef, tISingleCharTokenTermDef);

//     concept ConstantCharTokenTerm with ISingleCharTokenTerm
//         value: CharValue
//         projection
//             '\''(style:Quote, match-brace-left) drop-space
//             value(style: String)
//             drop-space '\''(style:Quote, match-brace-right)
export class ConstantCharTokenTerm extends mix(TokenTerm, tISingleCharTokenTerm.M) {
    static Def = new ConstantCharTokenTerm(ConstantCharTokenTermDef);
    static ValueFA = lb.stringFieldAccessor(ConstantCharTokenTermDef, 29, "value"); //TODO token CharValue
}
lb.subTypeAsMember(tISingleCharTokenTermDef, ConstantCharTokenTermDef);

//     concept CharRangeTokenTerm with ISingleCharTokenTerm
//         from: child ConstantCharTokenTerm
//         to: child ConstantCharTokenTerm
//         projection
//             from drop-space ".." drop-space to
//         //from: CharValue
//         //to: CharValue
//         //projection
//         //    '\''(style:Quote, match-brace-left) drop-space from(style: String) drop-space '\''(style:Quote, match-brace-right)
//         //    drop-space ".." drop-space
//         //    '\''(style:Quote, match-brace-left) drop-space to(style: String) drop-space '\''(style:Quote, match-brace-right)
export class CharRangeTokenTerm extends mix(TokenTerm, tISingleCharTokenTerm.M) {
    static Def = new CharRangeTokenTerm(CharRangeTokenTermDef);
    static FromCA = lb.childAccessor(CharRangeTokenTermDef, ConstantCharTokenTermDef, 30, "from");
    static ToCA = lb.childAccessor(CharRangeTokenTermDef, ConstantCharTokenTermDef, 31, "to");
}
lb.subTypeAsMember(tISingleCharTokenTermDef, CharRangeTokenTermDef);

//     concept NotTokenTerm
//         chars: children ISingleCharTokenTerm+
//         //term: child TokenTerm
//         projection //(priority: highest)
//             "!["(style: Operator, match-brace-left) drop-space
//             chars+(separator: "|")
//             drop-space "]"(style: Operator, match-brace-right)
//             //"!"(style: Operator) term(priority >= this)
export class NotTokenTerm extends TokenTerm {
    static Def = new NotTokenTerm(NotTokenTermDef);
    static CharsCNA = lb.childrenAccessor(NotTokenTermDef, tISingleCharTokenTermDef, 32, "chars", true);
}
lb.subTypeAsMember(TokenTermDef, NotTokenTermDef);

//     concept TokenDefRefTokenTerm
//         token: TokenDef
//         projection
//             token->name(style: Reference)
export class TokenDefRefTokenTerm extends TokenTerm {
    static Def = new TokenDefRefTokenTerm(TokenDefRefTokenTermDef);
    static TokenFA = lb.refFieldAccessor(TokenDefRefTokenTermDef, TokenDefDef, 33, "token");
}
lb.subTypeAsMember(TokenTermDef, TokenDefRefTokenTermDef);

//     concept ParenthesizedTokenTerm
//         term: child TokenTerm
//         projection //(priority: highest)
//             "["(style: Operator, match-brace-left) drop-space
//             term //(priority >= lowest) by default
//             drop-space "]"(style: Operator, match-brace-right)
export class ParenthesizedTokenTerm extends TokenTerm {
    static Def = new ParenthesizedTokenTerm(ParenthesizedTokenTermDef);
    static TermCA = lb.childAccessor(ParenthesizedTokenTermDef, TokenTermDef, 18, "term");
}
lb.subTypeAsMember(TokenTermDef, ParenthesizedTokenTermDef);

//     concept QuantizedTokenTerm
//         term: child TokenTerm
//         min: UnsignedInteger
//         isRange: bool
//         max: UnsignedInteger?
//         projection (priority: Quantified)
//             term(priority > this) drop-space
//             "{"(style: Operator, match-brace-left) drop-space
//             min(style: Number)
//             [drop-space ","(style: Operator) max(style: Number)?max]?isRange
//             drop-space "}"(style: Operator, match-brace-right)
export class QuantizedTokenTerm extends TokenTerm {
    static Def = new QuantizedTokenTerm(QuantizedTokenTermDef);
    static TermCA = lb.childAccessor(QuantizedTokenTermDef, TokenTermDef, 19, "term");
    static MinFA = lb.stringFieldAccessor(QuantizedTokenTermDef, 34, "min");
    static IsRangeFA = lb.boolFieldAccessor(QuantizedTokenTermDef, 35, "isRange");
    static MaxFA = lb.stringFieldAccessor(QuantizedTokenTermDef, 36, "max", /*isOptional*/true);
}
lb.subTypeAsMember(TokenTermDef, QuantizedTokenTermDef);

//     concept OptionalTokenTerm
//         term: child TokenTerm
//         projection (priority: Quantified)
//             term(priority > this) drop-space "?"(style: Operator)
export class OptionalTokenTerm extends TokenTerm {
    static Def = new OptionalTokenTerm(OptionalTokenTermDef);
    static TermCA = lb.childAccessor(OptionalTokenTermDef, TokenTermDef, 20, "term");
}
lb.subTypeAsMember(TokenTermDef, OptionalTokenTermDef);

//     concept ZeroOrMoreTokenTerm
//         term: child TokenTerm
//         projection (priority: Quantified)
//             term(priority > this) drop-space "*"(style: Operator)
export class ZeroOrMoreTokenTerm extends TokenTerm {
    static Def = new ZeroOrMoreTokenTerm(ZeroOrMoreTokenTermDef);
    static TermCA = lb.childAccessor(ZeroOrMoreTokenTermDef, TokenTermDef, 21, "term");
}
lb.subTypeAsMember(TokenTermDef, ZeroOrMoreTokenTermDef);

//     concept OneOrMoreTokenTerm
//         term: child TokenTerm
//         projection (priority: Quantified)
//             term(priority > this) drop-space "+"(style: Operator)
export class OneOrMoreTokenTerm extends TokenTerm {
    static Def = new OneOrMoreTokenTerm(OneOrMoreTokenTermDef);
    static TermCA = lb.childAccessor(OneOrMoreTokenTermDef, TokenTermDef, 22, "term");
}
lb.subTypeAsMember(TokenTermDef, OneOrMoreTokenTermDef);

//     concept ParameterizedTokenTerm
//         term: child TokenTerm
//         params: children StyleTermArg+
//         projection (priority: UnaryPostfix)
//             term(priority >= this) drop-space
//             "("(style: Operator, match-brace-left) drop-space
//             params*(separator: [drop-space ","])
//             drop-space ")"(style: Operator, match-brace-right)
export class ParameterizedTokenTerm extends TokenTerm {
    static Def = new ParameterizedTokenTerm(ParameterizedTokenTermDef);
    static TermCA = lb.childAccessor(ParameterizedTokenTermDef, TokenTermDef, 23, "term");
    static ParamsCNA = lb.childrenAccessor(ParameterizedTokenTermDef, StyleTermArgDef, 37, "params", true);
}
lb.subTypeAsMember(TokenTermDef, ParameterizedTokenTermDef);

//     concept SequenceTokenTerm
//         //terms: children TokenTerm{2,}
//         left: child TokenTerm
//         right: child TokenTerm
//         projection (priority: Sequence)
//             left(priority >= this) right(priority > this)
//             //terms{2,}(priority > this) //separator: " "
export class SequenceTokenTerm extends TokenTerm {
    static Def = new SequenceTokenTerm(SequenceTokenTermDef);
    static LeftCA = lb.childAccessor(SequenceTokenTermDef, TokenTermDef, 24, "left");
    static RightCA = lb.childAccessor(SequenceTokenTermDef, TokenTermDef, 25, "right");
}
lb.subTypeAsMember(TokenTermDef, SequenceTokenTermDef);

//     concept AlternativeTokenTerm //maybe as a sequence of lower priority than SequenceTokenTerm
//         //alternatives: children TokenTerm{2,}
//         left: child TokenTerm
//         right: child TokenTerm
//         projection (priority: Alternative)
//             left(priority >= this) "|"(style: Operator) right(priority > this)
//             //alternatives{2,}(priority > this, separator: "|"(style: Operator))
export class AlternativeTokenTerm extends TokenTerm {
    static Def = new AlternativeTokenTerm(AlternativeTokenTermDef);
    static LeftCA = lb.childAccessor(AlternativeTokenTermDef, TokenTermDef, 26, "left");
    static RightCA = lb.childAccessor(AlternativeTokenTermDef, TokenTermDef, 27, "right");
}
lb.subTypeAsMember(TokenTermDef, AlternativeTokenTermDef);

// token UnsignedInteger
//     Digit+(style: Number) //uint check after parsing

export const tokenLangHeap = lb.langHeap;
