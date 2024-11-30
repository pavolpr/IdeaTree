/* grammar lang (G lang)

T - terminals
N - nonterminals
S - symbol = T | N
SE - symbol expression - S | SE* | SE+ | SE? | (P) 
    | separated(SE, "sep")* | separated(SE, "sep")+
    | SE*(separator = "sep") | SE+(separator = "sep"[, can-have-trailing-separator = true])
    | N(priority < exp) | N(priority <= exp) 
P - production  = SE1 SE2 ... 

N ::= P1 | P2 | ...
N(priority: prio) ::=

R - peRmutation = <> instead of just " "
  - typically flags: ("public" | "private" | ...) <> "static"?{isStatic} <> "readonly"?{isReadonly} ...

{Eq1 and Eq2 and ...}
Eq - a binding equation
    - it can choose a Production
    - a Production sets values so that the choosing is satisfied
    - {} - is a default, or the rest - the same as not specified
    - bool - single alternative; when after? it is = true when present
    - union, or multi bool - multiple alternative
    - usage:
        |{Eq} - unions, bool combination - maybe we can abstract this out?
        ?{Eq} - only bool
        *{Eq} - only children
        +{Eq} - only children


union concept Visibility
    concept PublicVisibility
    concept PrivateVisibility

concept Method
    isStatic: bool
    visibility: child Visibility

Grammar for Method := 
    visibility(* Nonterminal for the child *) <> "static"?{isStatic} rest-of-method

Grammar-util Static(isStatic: bool) := "static"?{isStatic}

Grammar for Method := ... <> Static(isStatic)

formatting
    - start-new-line - start on new line
    - end-of-line - line ends
    - drop-space, no-space - no space - i.e., lexical tokens with structure
        - maybe "!_" or "~" 
    - indent
        - indent-line - before line
        - indented[ ... ] - before block ??
        - indent-start - start of idented block
        - indent-end - end of indented block
    - anchor
    - wrapping
    - alignment - pseudo table layout - a dynamic aligning space

indented blocks support
    - invisible { and }
        - automatically injected when indents change
        - it will otherwise be an optional "space", or it will not be seen as { by other recognition
        - when a whole block is recognized, it should take precedence before non-block interpretation
    - example:
        bla bla {
            item
            item }
        bla bla {
            bla {
                bla }
            bla {
                bla } }
    - empty lines auto handling
    - start-of-indented-block, end-of-indented-block, or indented-block[...]


concept Projection with IConceptMember, ILangDefinition
    concept: ConceptOrTraitDef? //only set when not in role of IConceptMember
    priority: PriorityDef?
    terms: children ProjectionTerm*
    projection
        //"projection"(style:Keyword) [concept->name(style:TypeReference)]?concept
        "projection"(style:Keyword) concept->name(style:TypeReference) // ?concept is automatic
        ["("(style: Operator, match-brace-left) drop-space
         "priority"(style:Keyword) drop-space ":"(style: Operator) priority->name(style: Reference)
         drop-space ")"(style: Operator, match-brace-right)
        ]?priority
        indented-block
            terms* //(separator: " ") - " " is the default separator for non-tokens

concept PrioritiesTable with IConceptMember
    priorities: children PriorityDef*
    projection
        "priorities"(style: Keyword)
        indented-block
            priorities*(separator: start-new-line)

concept PriorityDef with INamed
    value: UnsignedInteger
    projection
        name "="(style: Operator) value

// concept PriorityDefRef
//     priority: PriorityDef
//     projection
//         priority->name(style: Reference)

abstract concept ProjectionTerm
    priorities
        //highest = maxint   //"abc", name, name:Token, [P P], drop-space, start-new-line, indented-block
        UnaryPostfix  = 30   //P(), P*, P+ 
        ReferenceTerm = 20   //name->P ... (done)maybe switch with optional, so name->P?name will work as [name->P]?name
        OptionalTerm  = 10   //P?cond
        //lowest = 0

    concept ConstantStringTerm
        value: StringValue
        projection
            '"'(style:Quote, match-brace-left) drop-space
            value(style: String)
            drop-space '"'(style:Quote, match-brace-right)

    concept StructureMemberTerm
        member: ConceptStructureMemberDef
        projection
            member->name(style: Reference)

    concept TokenConstrainTerm
        memberTerm: child StructureMemberTerm
        tokenDef: TokenDef
        projection //(priority: highest)
            memberTerm drop-space ":"(style: Operator) drop-space
            tokenDef->name(style: TypeReference)

    concept ParenthesizedTerm
        terms: children ProjectionTerm+
        projection
            "["(style: Operator, match-brace-left) drop-space
            terms+ //(priority >= lowest, separator: " ")
            drop-space "]"(style: Operator, match-brace-right)

    concept DropSpaceTerm
        projection
            "drop-space"(style: TermKeyword)

    concept StartNewLineTerm
        projection
            "start-new-line"(style: TermKeyword)

    concept IndentedBlockTerm
        terms: children ProjectionTerm+
        projection //(priority: highest)
            start-new-line "indented-block"(style: TermKeyword)
            indented-block
                terms+ //(priority >= lowest, separator: " ")

    concept ReferenceTerm
        memberTerm: child StructureMemberTerm
        projectionTerm: child ProjectionTerm
        projection (priority: ReferenceTerm)
            memberTerm drop-space "->"(style: Operator) drop-space
            projectionTerm(priority > this)

    concept ParameterizedTerm
        term: child ProjectionTerm
        arguments: children TermArgument+
        projection (priority: UnaryPostfix)
            term(priority >= this) drop-space
            "("(style: Operator, match-brace-left) drop-space
            arguments+(separator: [drop-space ","])
            drop-space ")"(style: Operator, match-brace-right)

    concept ZeroOrMoreTerm
        term: child ProjectionTerm
        projection (priority: UnaryPostfix)
            term(priority >= this) drop-space "*"(style: Operator)

    concept OneOrMoreTerm
        term: child ProjectionTerm
        projection (priority: UnaryPostfix)
            term(priority >= this) drop-space "+"(style: Operator)

    concept OptionalTerm
        term: child ProjectionTerm
        condition: child TermConditionalExpr
        projection (priority: OptionalTerm)
            term(priority >= this) drop-space "?"(style: Operator) drop-space condition


style TermKeyword
    color: dark-blue
    font-weight: bold
    

//trait ILeftDotTCExpr

//trait IRightDotTCExpr
//    concept IsPresentRightDotTCExpr
//    concept IsAnyRightDotTCExpr
    
union TermConditionalExpr
    concept StructureMemberRefTCExpr // with ILeftDotTCExpr
        member: ConceptStructureMember
        projection
            member->name(style: Reference)
    //concept DotTCExpr with ILeftDotTCExpr
    //    left: child ILeftDotTCExpr
    //    right: child IRightDotTCExpr
    //    projection
    //        left drop-space "."(style: Operator) drop-space right
    concept NotExpr
        operand: child StructureMemberRefTCExpr //TermConditionalExpr
        projection
            "!"(style: Operator) drop-space operand
    //concept MultiTCExpr
    //    exprs: children TermConditionalExpr+
    //    projection
    //        "{"(style: Operator, match-brace-left) drop-space 
    //        exprs*(separator: [drop-space ","]) 
    //        drop-space "}"(style: Operator, match-brace-right)

//these will be more extensible
abstract concept TermArgument
    concept StyleTermArg
        style: StyleDef
        projection
            "style"(style: Keyword) drop-space ":"(style: Operator)
            style->name(style: Reference)
    concept SeparatorTermArg
        term: child ProjectionTerm
        projection
            "separator"(style: Keyword) drop-space ":"(style: Operator)
            term
    //concept PrefixTermArg
    //    term: child ProjectionTerm
    //    projection
    //        "prefix"(style: Keyword) drop-space ":"(style: Operator)
    //        term
    concept MatchBraceLeftTermArg
        projection
            "match-brace-left"(style: Keyword)
    concept MatchBraceRightTermArg
        projection
            "match-brace-right"(style: Keyword)
    //concept MapTermArg //e.g: map: member => [start-new-line member]
    concept PriorityTermArg
        priorityDef: PriorityDef?
        canBeEqual: bool
        projection
            "priority"(style: Keyword)  [">"?!canBeEqual ">="?canBeEqual](style: Operator)
            priorityDef->name(style: Reference)
            "this"(style: Keyword)?!priorityDef

// union PriorityOperator
//     concept GreaterPriority
//         projection
//             ">"(style: Operator)
//     concept GreaterOrEqualPriority
//         projection
//             ">="(style: Operator)


concept StyleDef with IName, ILangDefinition
    attributes: children StyleAttribute*
    projection
        "style"(style: Keyword) name(style: Name)
        indented-block
            attributes*(separator: start-new-line)

abstract concept StyleAttibute
    concept FontWeightStyleAttr
        weight: child FontWeight
        projection
            "font-weight"(style: Keyword) drop-space ":"(style: Operator) weight
    concept FontStyleStyleAttr
        style: child FontStyle
        projection
            "font-style"(style: Keyword) drop-space ":"(style: Operator) style
    concept ColorStyleAttr
        color: child ColorExpr
        projection
            "color"(style: Keyword) drop-space ":"(style: Operator) color

union FontWeight
    concept BoldFontWeight
        projection
            "bold"(style: Keyword)
    concept NormalFontWeight
        projection
            "normal"(style: Keyword)

union FontStyle
    concept ItalicFontStyle
        projection
            "italic"(style: Keyword)
    concept NormalFontStyle
        projection
            "normal"(style: Keyword)
    
union ColorExpr
    concept ColorDefRef
        color: ColorDef
        projection
            color->name(style: Reference)
    concept ColorRGB
        hexValue: HexColor
        projection
            hexValue

concept ColorDef with INamed
    color: HexColor
        projection
            "color"(style: Keyword) name(style: Name) "="(style: Operator) color

color Silver = #C0C0C0
color Gray   = #808080
color Black  = #000000
color Red    = #FF0000
color Maroon = #800000
color Yellow = #FFFF00
color Olive  = #808000
color Lime   = #00FF00
color Green  = #008000
color Aqua   = #00FFFF
color Teal   = #008080
color Blue   = #0000FF
color DarkBlue = #00008B
color Navy   = #000080
color Fuchsia = #FF00FF
color Purple = #800080

++priority table
Max  highest: new, constants, ... all expressions without specified priority - should be none that has a naked expr on a side of it
3000 Primary: (x) //we should be able to express a priority that is higher than anything in braces
     UnaryPostfix: f(x), a[i], x?[y], x++, x--, x!, x?
     DotAccess: x.y, x?.y, x->y //left assoc, i.e, the right side has higher priority than the left, which is Primary
2700 UnaryPrefix: +x, -x, !x, ~x, ++x, --x, ^x, (T)x, await, &x, *x
2600 Range: x..y
2500 SwitchExpression: switch
2400 WithExpression: with
2300 Multiplicative: x * y, x / y, x % y
2200 Additive: x + y, x – y
2100 Shift: x << y, x >> y
2000 RelationalAndTypeTesting: x < y, x > y, x <= y, x >= y, is, as
1900 Equality: x == y, x != y
1800 BooleanBitwiseAND: x & y
1700 BooleanBitwiseXOR: x ^ y
1600 BooleanBitwiseOR: x | y
1500 ConditionalAND: x && y
1400 ConditionalOR: x || y
1300 NullCoalescing: x ?? y
1200 ConditionalTernary: c ? t : f
1100 AssignmentAndLambdaDeclaration: x = y, x += y, x -= y, x *= y, x /= y, x %= y, x &= y, x |= y, x ^= y, x <<= y, x >>= y, x ??= y, =>
0    lowest
*/

import { LangBuilder, BaseConcept, conceptStructureMemberDefDef, grammarLangGuid, StyleTermArgDef, TokenDefDef, singleChildTypeDef, childrenTypeDef, stringTypeDef, nodeRefTypeDef } from "../concept";
import { tINamedDef, tIConceptMemberDef, tILangDefinition, tINamed, tILangDefinitionDef, tIConceptMember, conceptOrTraitDefDef, ConceptStructureMemberDef, TokenTypeDef } from "./structureLang";
import { mix } from "../mixins";
import { getSidx } from "../utils";
import { IReadNode, INodeRef } from "../node";
import { IRenderContext } from "../editor/renderUtils";
import { hasStyle, setStyle } from "../mx/styles";

const lb = new LangBuilder(grammarLangGuid, "Grammar", 90);

export const ProjectionDef = lb.newConceptDefNode(1, "Projection");
export const PrioritiesTableDef = lb.newConceptDefNode(2, "PrioritiesTable");
export const PriorityDefDef = lb.newConceptDefNode(3, "PriorityDef");
//export const PriorityDefRefDef = lb.newConceptDefNode(4, "PriorityDefRef");
export const ProjectionTermDef = lb.newConceptDefNode(5, "ProjectionTerm");
export const ConstantStringTermDef = lb.newConceptDefNode(6, "ConstantStringTerm");
export const StructureMemberTermDef = lb.newConceptDefNode(7, "StructureMemberTerm");
export const TokenConstrainTermDef = lb.newConceptDefNode(8, "TokenConstrainTerm");
export const ParenthesizedTermDef = lb.newConceptDefNode(9, "ParenthesizedTerm");
export const DropSpaceTermDef = lb.newConceptDefNode(10, "DropSpaceTerm");
export const StartNewLineTermDef = lb.newConceptDefNode(11, "StartNewLineTerm");
export const IndentedBlockTermDef = lb.newConceptDefNode(12, "IndentedBlockTerm");
export const ReferenceTermDef = lb.newConceptDefNode(13, "ReferenceTerm");
export const ParameterizedTermDef = lb.newConceptDefNode(14, "ParameterizedTerm");
export const ZeroOrMoreTermDef = lb.newConceptDefNode(15, "ZeroOrMoreTerm");
export const OneOrMoreTermDef = lb.newConceptDefNode(16, "OneOrMoreTerm");
export const OptionalTermDef = lb.newConceptDefNode(17, "OptionalTerm");
export const TermConditionalExprDef = lb.newConceptDefNode(18, "TermConditionalExpr");
export const StructureMemberRefTCExprDef = lb.newConceptDefNode(19, "StructureMemberRefTCExpr");
export const NotExprDef = lb.newConceptDefNode(20, "NotExpr");
export const TermArgumentDef = lb.newConceptDefNode(21, "TermArgument");
lb.newConceptDefNode(getSidx(StyleTermArgDef.uid), "StyleTermArg");
export const SeparatorTermArgDef = lb.newConceptDefNode(23, "SeparatorTermArg");
export const MatchBraceLeftTermArgDef = lb.newConceptDefNode(24, "MatchBraceLeftTermArg");
export const MatchBraceRightTermArgDef = lb.newConceptDefNode(25, "MatchBraceRightTermArg");
export const PriorityTermArgDef = lb.newConceptDefNode(26, "PriorityTermArg");
export const StyleDefDef = lb.newConceptDefNode(27, "StyleDef");
export const StyleAttributeDef = lb.newConceptDefNode(28, "StyleAttibute");
export const FontWeightStyleAttrDef = lb.newConceptDefNode(29, "FontWeightStyleAttr");
export const FontStyleStyleAttrDef = lb.newConceptDefNode(30, "FontStyleStyleAttr");
export const ColorStyleAttrDef = lb.newConceptDefNode(31, "ColorStyleAttr");
export const FontWeightDef = lb.newConceptDefNode(32, "FontWeight");
export const BoldFontWeightDef = lb.newConceptDefNode(33, "BoldFontWeight");
export const NormalFontWeightDef = lb.newConceptDefNode(34, "NormalFontWeight");
export const FontStyleDef = lb.newConceptDefNode(35, "FontStyle");
export const ItalicFontStyleDef = lb.newConceptDefNode(36, "ItalicFontStyle");
export const NormalFontStyleDef = lb.newConceptDefNode(37, "NormalFontStyle");
export const ColorExprDef = lb.newConceptDefNode(38, "ColorExpr");
export const ColorDefRefDef = lb.newConceptDefNode(39, "ColorDefRef");
export const ColorRGBDef = lb.newConceptDefNode(40, "ColorRGB");
export const ColorDefDef = lb.newConceptDefNode(41, "ColorDef");

export class Projection extends mix(BaseConcept, tIConceptMember.M, tILangDefinition.M) {
    static Def = new Projection(ProjectionDef);
    static ConceptFA = lb.refFieldAccessor(ProjectionDef, conceptOrTraitDefDef, 42, "concept", /*isOptional*/true);
    static PriorityFA = lb.refFieldAccessor(ProjectionDef, PriorityDefDef, 43, "priority", /*isOptional*/true);
    static TermsCNA = lb.childrenAccessor(ProjectionDef, ProjectionTermDef, 44, "terms");
}
lb.hasTrait(ProjectionDef, tIConceptMemberDef);
lb.hasTrait(ProjectionDef, tILangDefinitionDef);
export class PrioritiesTable extends BaseConcept {
    static Def = new PrioritiesTable(PrioritiesTableDef);
    static PrioritiesCNA = lb.childrenAccessor(PrioritiesTableDef, PriorityDefDef, 45, "priorities");
}
export class PriorityDef extends mix(BaseConcept, tINamed.M) {
    static Def = new PriorityDef(PriorityDefDef);
    static ValueFA = lb.stringFieldAccessor(PriorityDefDef, 46, "value"); //TODO token UnsignedInteger
}
lb.hasTrait(PriorityDefDef, tINamedDef);

// export class PriorityDefRef extends Concept {
//     static Def = new PriorityDefRef(PriorityDefRefDef);
// }
/*abstract*/
export class ProjectionTerm extends BaseConcept {
    static Def = new ProjectionTerm(ProjectionTermDef);

    static render(thisTerm: IReadNode, node: IReadNode, ctx: IRenderContext) {
        return (thisTerm.type.concept as ProjectionTerm).renderVirt(thisTerm, node, ctx);
    }
    renderVirt(_thisTerm: IReadNode, _node: IReadNode, _ctx: IRenderContext) { throw "abstract"; }
}
export class ConstantStringTerm extends ProjectionTerm {
    static Def = new ConstantStringTerm(ConstantStringTermDef);
    static ValueFA = lb.stringFieldAccessor(ConstantStringTermDef, 47, "value"); //TODO token StringValue

    renderVirt(thisTerm: IReadNode, _node: IReadNode, ctx: IRenderContext) {
        const value = ConstantStringTerm.ValueFA.get(thisTerm);
        ctx.addToken(value ?? "<<no value>>", thisTerm.me);
    }
}
lb.subTypeAsMember(ProjectionTermDef, ConstantStringTermDef);
export class StructureMemberTerm extends ProjectionTerm {
    static Def = new StructureMemberTerm(StructureMemberTermDef);
    static MemberFA = lb.refFieldAccessor(StructureMemberTermDef, conceptStructureMemberDefDef, 48, "member");

    renderVirt(thisTerm: IReadNode, node: IReadNode, ctx: IRenderContext) {
        const member = StructureMemberTerm.MemberFA.get(thisTerm);
        const type = ConceptStructureMemberDef.TypeCA.getChild(member?.read!)?.read;
        if(type?.def == singleChildTypeDef) {
            ctx.renderNode(node.getFirstChild(member!)!);
        }
        else if(type?.def == childrenTypeDef) {
            ctx.renderChildren(node.getFirstChild(member!)!);
        }
        else if(type?.def == stringTypeDef || type?.def == TokenTypeDef) {
            ctx.renderField(node, member!, thisTerm.me);
        }
        else {
            ctx.addToken("<<bad member>>", thisTerm.me);
        }
    }
}
lb.subTypeAsMember(ProjectionTermDef, StructureMemberTermDef);
export class TokenConstrainTerm extends ProjectionTerm {
    static Def = new TokenConstrainTerm(TokenConstrainTermDef);
    static MemberTermCA = lb.childAccessor(TokenConstrainTermDef, StructureMemberTermDef, 49, "member");
    static TokenDefFA = lb.refFieldAccessor(TokenConstrainTermDef, TokenDefDef, 50, "tokenDef");

    renderVirt(_thisTerm: IReadNode, _node: IReadNode, _ctx: IRenderContext) { throw "not implemented"; }
}
lb.subTypeAsMember(ProjectionTermDef, TokenConstrainTermDef);
export class ParenthesizedTerm extends ProjectionTerm {
    static Def = new ParenthesizedTerm(ParenthesizedTermDef);
    static TermsCNA = lb.childrenAccessor(ParenthesizedTermDef, ProjectionTermDef, 51, "terms", true);

    renderVirt(thisTerm: IReadNode, node: IReadNode, ctx: IRenderContext) {
        let term = ParenthesizedTerm.TermsCNA.getFirstChild(thisTerm)?.read;
        for(; term != undefined; term = term.next?.read) {
            ProjectionTerm.render(term, node, ctx);
        }
    }
}
lb.subTypeAsMember(ProjectionTermDef, ParenthesizedTermDef);
export class DropSpaceTerm extends ProjectionTerm {
    static Def = new DropSpaceTerm(DropSpaceTermDef);

    renderVirt(_thisTerm: IReadNode, _node: IReadNode, ctx: IRenderContext) { 
        ctx.dropSpace();
    }
}
lb.subTypeAsMember(ProjectionTermDef, DropSpaceTermDef);
export class StartNewLineTerm extends ProjectionTerm {
    static Def = new StartNewLineTerm(StartNewLineTermDef);

    renderVirt(_thisTerm: IReadNode, _node: IReadNode, ctx: IRenderContext) { 
        ctx.startNewLine();
    }
}
lb.subTypeAsMember(ProjectionTermDef, StartNewLineTermDef);
export class IndentedBlockTerm extends ProjectionTerm {
    static Def = new IndentedBlockTerm(IndentedBlockTermDef);
    static TermsCNA = lb.childrenAccessor(IndentedBlockTermDef, ProjectionTermDef, 52, "terms", true);
    
    renderVirt(thisTerm: IReadNode, node: IReadNode, ctx: IRenderContext) {
        ctx.startNewLine();
        ctx.addIndent();
        let term = IndentedBlockTerm.TermsCNA.getFirstChild(thisTerm)?.read;
        for(; term != undefined; term = term.next?.read) {
            ProjectionTerm.render(term, node, ctx);
        }
        ctx.subIndent();
        ctx.startNewLine();
    }
}
lb.subTypeAsMember(ProjectionTermDef, IndentedBlockTermDef);
export class ReferenceTerm extends ProjectionTerm {
    static Def = new ReferenceTerm(ReferenceTermDef);
    static MemberTermCA = lb.childAccessor(ReferenceTermDef, StructureMemberTermDef, 53, "memberTerm");
    static ProjectionTermCA = lb.childAccessor(ReferenceTermDef, ProjectionTermDef, 54, "projectionTerm");

    renderVirt(thisTerm: IReadNode, node: IReadNode, ctx: IRenderContext) {
        const structureMemberTerm = ReferenceTerm.MemberTermCA.getChild(thisTerm)?.read;
        const member = StructureMemberTerm.MemberFA.get(structureMemberTerm!);
        const type = ConceptStructureMemberDef.TypeCA.getChild(member?.read!)?.read;
        if(type?.def == nodeRefTypeDef) {
            const field = node.getField(member!) as INodeRef | undefined;
            if(field != undefined) {
                const refedNode = field.read;
                const projTerm = ReferenceTerm.ProjectionTermCA.getChild(thisTerm)?.read;
                ProjectionTerm.render(projTerm!, refedNode, ctx);
            }
        }
        else {
            ctx.addToken("<<bad ref member>>", thisTerm.me);
        }
    }
}
lb.subTypeAsMember(ProjectionTermDef, ReferenceTermDef);
export class ParameterizedTerm extends ProjectionTerm {
    static Def = new ParameterizedTerm(ParameterizedTermDef);
    static TermCA = lb.childAccessor(ParameterizedTermDef, ProjectionTermDef, 55, "term");
    static ArgumentsCNA = lb.childrenAccessor(ParameterizedTermDef, TermArgumentDef, 56, "arguments", true);

    renderVirt(thisTerm: IReadNode, node: IReadNode, ctx: IRenderContext) {
        let arg = ParameterizedTerm.ArgumentsCNA.getFirstChild(thisTerm)?.read;
        const prevStyles = ctx.styles;
        for(; arg != undefined; arg = arg.next?.read) {
            if(arg.def == StyleTermArgDef) {
                ctx.pushStyle(StyleTermArg.StyleFA.get(arg)!);
            }
            else if(arg.def == SeparatorTermArgDef) {
                ctx.setSeparator(SeparatorTermArg.TermCA.getChild(arg)!);
            }
        }
        const term = ParameterizedTerm.TermCA.getChild(thisTerm)?.read;
        ProjectionTerm.render(term!, node, ctx);   
        ctx.popStyle(prevStyles);
        ctx.clearSeparator();
    }
}
lb.subTypeAsMember(ProjectionTermDef, ParameterizedTermDef);
export class ZeroOrMoreTerm extends ProjectionTerm {
    static Def = new ZeroOrMoreTerm(ZeroOrMoreTermDef);
    static TermCA = lb.childAccessor(ZeroOrMoreTermDef, ProjectionTermDef, 57, "term");

    renderVirt(thisTerm: IReadNode, node: IReadNode, ctx: IRenderContext) {
        let term = ZeroOrMoreTerm.TermCA.getChild(thisTerm)?.read;
        if(term?.def == StructureMemberTermDef) {
            const member = StructureMemberTerm.MemberFA.get(term)?.read;
            const type = ConceptStructureMemberDef.TypeCA.getChild(member!)?.read;
            if(type?.def == childrenTypeDef) {
                ctx.renderChildren(node.getFirstChild(member?.me!));
                return;
            }
        }
        ctx.addToken("<<wrong member for *>>", thisTerm.me);
    }
}
lb.subTypeAsMember(ProjectionTermDef, ZeroOrMoreTermDef);
export class OneOrMoreTerm extends ProjectionTerm {
    static Def = new OneOrMoreTerm(OneOrMoreTermDef);
    static TermCA = lb.childAccessor(OneOrMoreTermDef, ProjectionTermDef, 58, "term");

    renderVirt(thisTerm: IReadNode, node: IReadNode, ctx: IRenderContext) {
        let term = OneOrMoreTerm.TermCA.getChild(thisTerm)?.read;
        if(term?.def == StructureMemberTermDef) {
            const member = StructureMemberTerm.MemberFA.get(term)?.read;
            const type = ConceptStructureMemberDef.TypeCA.getChild(member!)?.read;
            if(type?.def == childrenTypeDef) {
                ctx.renderChildren(node.getFirstChild(member?.me!));
                return;
            }
        }
        ctx.addToken("<<wrong member for +>>", thisTerm.me);
    }
}
lb.subTypeAsMember(ProjectionTermDef, OneOrMoreTermDef);
export class OptionalTerm extends ProjectionTerm {
    static Def = new OptionalTerm(OptionalTermDef);
    static TermCA = lb.childAccessor(OptionalTermDef, ProjectionTermDef, 59, "term");
    static ConditionCA = lb.childAccessor(OptionalTermDef, TermConditionalExprDef, 72, "condition");

    renderVirt(thisTerm: IReadNode, node: IReadNode, ctx: IRenderContext) {
        let condition = OptionalTerm.ConditionCA.getChild(thisTerm)?.read;
        const isNot = condition?.def == NotExprDef;
        if(isNot) {
            condition = NotExpr.OperandCA.getChild(condition!)?.read;
        }

        //let term = StructureMemberRefTCExpr.MemberFA.getChild(thisTerm)?.read;
        if(condition?.def == StructureMemberRefTCExprDef) {
            const member = StructureMemberRefTCExpr.MemberFA.get(condition)?.read;
            const type = ConceptStructureMemberDef.TypeCA.getChild(member!)?.read;
            const isChild = type?.def == singleChildTypeDef || type?.def == childrenTypeDef;
            const hasMember = node.getField(member?.me!, isChild) != undefined;
            if(hasMember != isNot) {
                const term = OptionalTerm.TermCA.getChild(thisTerm)?.read;
                ProjectionTerm.render(term!, node, ctx);
            }
            return;
        }
        ctx.addToken("<<wrong condition>>", thisTerm.me);
    }
}
lb.subTypeAsMember(ProjectionTermDef, OptionalTermDef);


export class TermConditionalExpr extends BaseConcept {
    static Def = new TermConditionalExpr(TermConditionalExprDef);
}
export class StructureMemberRefTCExpr extends TermConditionalExpr {
    static Def = new StructureMemberRefTCExpr(StructureMemberRefTCExprDef);
    static MemberFA = lb.refFieldAccessor(StructureMemberRefTCExprDef, conceptStructureMemberDefDef, 60, "member");
}
lb.subTypeAsMember(TermConditionalExprDef, StructureMemberRefTCExprDef);
export class NotExpr extends TermConditionalExpr {
    static Def = new NotExpr(NotExprDef);
    static OperandCA = lb.childAccessor(NotExprDef, StructureMemberRefTCExprDef, 61, "operand");
}
lb.subTypeAsMember(TermConditionalExprDef, NotExprDef);


export class TermArgument extends BaseConcept {
    static Def = new TermArgument(TermArgumentDef);
}
export class StyleTermArg extends TermArgument {
    static Def = new StyleTermArg(StyleTermArgDef);
    static StyleFA = lb.refFieldAccessor(StyleTermArgDef, StyleDefDef, 62, "style");
}
lb.subTypeAsMember(TermArgumentDef, StyleTermArgDef);
export class SeparatorTermArg extends TermArgument {
    static Def = new SeparatorTermArg(SeparatorTermArgDef);
    static TermCA = lb.childAccessor(SeparatorTermArgDef, ProjectionTermDef, 63, "term");
}
lb.subTypeAsMember(TermArgumentDef, SeparatorTermArgDef);
export class MatchBraceLeftTermArg extends TermArgument {
    static Def = new MatchBraceLeftTermArg(MatchBraceLeftTermArgDef);
}
lb.subTypeAsMember(TermArgumentDef, MatchBraceLeftTermArgDef);
export class MatchBraceRightTermArg extends TermArgument {
    static Def = new MatchBraceRightTermArg(MatchBraceRightTermArgDef);
}
lb.subTypeAsMember(TermArgumentDef, MatchBraceRightTermArgDef);
export class PriorityTermArg extends TermArgument {
    static Def = new PriorityTermArg(PriorityTermArgDef);
    static PriorityDefFA = lb.refFieldAccessor(PriorityTermArgDef, PriorityDefDef, 64, "priorityDef");
    static CanBeEqualFA = lb.boolFieldAccessor(PriorityTermArgDef, 73, "canBeEqual");
}


lb.subTypeAsMember(TermArgumentDef, PriorityTermArgDef);
export class StyleDef extends mix(BaseConcept, tINamed.M, tILangDefinition.M) {
    static Def = new StyleDef(StyleDefDef);
    static AttributesCNA = lb.childrenAccessor(StyleDefDef, StyleAttributeDef, 65, "attributes");

    static getClassName(node: IReadNode) {
        let key = tINamed.NameFA.get(node) + "_" + node.uid;
        if(hasStyle(key)) return key;

        let style = {};
        let attr = this.AttributesCNA.getFirstChild(node)?.read;
        for(; attr != undefined; attr = attr.next?.read) {
            (attr.type.concept as StyleAttribute).setStyleAttrVirt(attr, style);
        }

        setStyle(key, style);
        return key;
    }

}
lb.hasTrait(StyleDefDef, tINamedDef);
lb.hasTrait(StyleDefDef, tILangDefinitionDef);

type StyleRecord = Record<string, any>; 

export class StyleAttribute extends BaseConcept {
    static Def = new StyleAttribute(StyleAttributeDef);
    
    setStyleAttrVirt(_node: IReadNode, _style: StyleRecord): void { 
        //throw "abstract"; 
    }
}
export class FontWeightStyleAttr extends StyleAttribute {
    static Def = new FontWeightStyleAttr(FontWeightStyleAttrDef);
    static WeightCA = lb.childAccessor(FontWeightStyleAttrDef, FontWeightDef, 66, "weight");

    setStyleAttrVirt(node: IReadNode, style: StyleRecord): void { 
        let weight = FontWeightStyleAttr.WeightCA.getChild(node)?.read;
        if(weight?.def === BoldFontWeightDef) {
            style.fontWeight = "bold";
        } else if(weight?.def === NormalFontWeightDef) {
            style.fontWeight = "normal";
        }
    }
}
lb.subTypeAsMember(StyleAttributeDef, FontWeightStyleAttrDef);
export class FontStyleStyleAttr extends StyleAttribute {
    static Def = new FontStyleStyleAttr(FontStyleStyleAttrDef);
    static StyleCA = lb.childAccessor(FontStyleStyleAttrDef, FontStyleDef, 67, "style");

    setStyleAttrVirt(node: IReadNode, style: StyleRecord): void { 
        let fontStyle = FontStyleStyleAttr.StyleCA.getChild(node)?.read;
        if(fontStyle?.def === ItalicFontStyleDef) {
            style.fontStyle = "italic";
        } else if(fontStyle?.def === NormalFontStyleDef) {
            style.fontStyle = "normal";
        }
    }
}
lb.subTypeAsMember(StyleAttributeDef, FontStyleStyleAttrDef);
export class ColorStyleAttr extends StyleAttribute {
    static Def = new ColorStyleAttr(ColorStyleAttrDef);
    static ColorCA = lb.childAccessor(ColorStyleAttrDef, ColorExprDef, 68, "color");

    setStyleAttrVirt(node: IReadNode, style: StyleRecord): void { 
        let color = ColorStyleAttr.ColorCA.getChild(node)?.read;
        if(color?.def === ColorDefRefDef) {
            let colorDef = ColorDefRef.ColorFA.get(color)?.read;
            let rgb = ColorDef.ColorFA.get(colorDef!);
            style.color = rgb;
        } else if(color?.def === ColorRGBDef) {
            let rgb = ColorRGB.HexValueFA.get(color);
            style.color = rgb;
        }
    }
}
lb.subTypeAsMember(StyleAttributeDef, ColorStyleAttrDef);


export class FontWeight extends BaseConcept {
    static Def = new FontWeight(FontWeightDef);
}
export class BoldFontWeight extends FontWeight {
    static Def = new BoldFontWeight(BoldFontWeightDef);
}
lb.subTypeAsMember(FontWeightDef, BoldFontWeightDef);
export class NormalFontWeight extends FontWeight {
    static Def = new NormalFontWeight(NormalFontWeightDef);
}
lb.subTypeAsMember(FontWeightDef, NormalFontWeightDef);


export class FontStyle extends BaseConcept {
    static Def = new FontStyle(FontStyleDef);
}
export class ItalicFontStyle extends FontStyle {
    static Def = new ItalicFontStyle(ItalicFontStyleDef);
}
lb.subTypeAsMember(FontStyleDef, ItalicFontStyleDef);
export class NormalFontStyle extends FontStyle {
    static Def = new NormalFontStyle(NormalFontStyleDef);
}
lb.subTypeAsMember(FontStyleDef, NormalFontStyleDef);

export class ColorExpr extends BaseConcept {
    static Def = new ColorExpr(ColorExprDef);
}
export class ColorDefRef extends ColorExpr {
    static Def = new ColorDefRef(ColorDefRefDef);
    static ColorFA = lb.refFieldAccessor(ColorDefRefDef, ColorDefDef, 69, "color");
}
lb.subTypeAsMember(ColorExprDef, ColorDefRefDef);
export class ColorRGB extends ColorExpr {
    static Def = new ColorRGB(ColorRGBDef);
    static HexValueFA = lb.stringFieldAccessor(ColorRGBDef, 70, "hexValue"); //TODO token HexColor
}
lb.subTypeAsMember(ColorExprDef, ColorRGBDef);
export class ColorDef extends BaseConcept {
    static Def = new ColorDef(ColorDefDef);
    static ColorFA = lb.stringFieldAccessor(ColorDefDef, 71, "color"); //TODO token HexColor
}


export const grammarLangHeap = lb.langHeap;
