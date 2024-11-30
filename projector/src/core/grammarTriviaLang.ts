/*
attribute trait TriviaAttr
    trivia: children Trivia*

abstract concept Trivia
    tokenPosition: int //child/children takes just one place  //not for now- when children, the childrenPosition specifies in a more detail
    //childrenPosition: int? //nor for now, trivia will be sticked to single nodes only  //0 - before 0. child, 1 - before 1. child, ... length - after the last child
    //0 - before space, 1 - start of the token
    charPosition: int //do we need "from the end"? //or "skip chars"?
    
    concept DeleteCharsTrivia //when on SNL, deletes its effect
        deletedChars: int 
        //dropSpaceOverride: bool?

    concept StartNewLineTrivia
        //startNewLine: bool? //when false, it drops a SNL, when it is on it

    concept DropSpaceTrivia

    concept InsertTextTrivia
        text: string
        //?textStyle

    concept InsertNodeTrivia
        node: child BaseConcept?
    
    concept SeparatorTrivia
        trivia: children Trivia*

concept CommentToEOL
    text: string
    projection
      "//"(style: Comment) drop-space text(style: Comment) start-new-line

style Comment
    color: green
*/

import { BaseConcept, baseConceptDef, LangBuilder } from "../concept";
import { Mixin } from "../mixins";

export const grammarTriviaLangGuid = "01e98a09-fe4c-4024-93d8-7d75036306a6";
const lb = new LangBuilder(grammarTriviaLangGuid, "GrammarTrivia", 20);

export const tTriviaAttrDef = lb.newTraitDefNode(1, "TriviaAttr");
export const TriviaDef = lb.newConceptDefNode(2, "Trivia");
export const DeleteCharsTriviaDef = lb.newConceptDefNode(3, "DeleteCharsTrivia");
export const InsertTextTriviaDef = lb.newConceptDefNode(4, "InsertTextTrivia");
export const StartNewLineTriviaDef = lb.newConceptDefNode(5, "StartNewLineTrivia");
export const DropSpaceTriviaDef = lb.newConceptDefNode(15, "DropSpaceTrivia");
export const InsertNodeTriviaDef = lb.newConceptDefNode(6, "InsertNodeTrivia");
export const SeparatorTriviaDef = lb.newConceptDefNode(16, "SeparatorTrivia");
export const CommentToEOLDef = lb.newConceptDefNode(7, "CommentToEOL");

export const tTriviaAttr = {
    M: new Mixin(tTriviaAttrDef, (sc: typeof BaseConcept) => class TriviaAttr extends sc { }),
    TriviaCNA: lb.childrenAccessor(tTriviaAttrDef, TriviaDef, 8, "trivia")
};

export class Trivia extends BaseConcept {
    static Def = new Trivia(TriviaDef);
    
    static TokenPositionFA = lb.intFieldAccessor(TriviaDef, 9, "tokenPosition");
    static CharPositionFA = lb.intFieldAccessor(TriviaDef, 10, "charPosition");
}

export class DeleteCharsTrivia extends Trivia {
    static Def = new DeleteCharsTrivia(DeleteCharsTriviaDef);
    static DeletedLengthFA = lb.intFieldAccessor(DeleteCharsTriviaDef, 11, "deletedLength");
}
lb.subTypeAsMember(TriviaDef, DeleteCharsTriviaDef);

export class InsertTextTrivia extends Trivia {
    static Def = new InsertTextTrivia(InsertTextTriviaDef);
    static TextFA = lb.stringFieldAccessor(InsertTextTriviaDef, 12, "text");
}
lb.subTypeAsMember(TriviaDef, InsertTextTriviaDef);

export class StartNewLineTrivia extends Trivia {
    static Def = new StartNewLineTrivia(StartNewLineTriviaDef);
}
lb.subTypeAsMember(TriviaDef, StartNewLineTriviaDef);

export class DropSpaceTrivia extends Trivia {
    static Def = new DropSpaceTrivia(DropSpaceTriviaDef);
}
lb.subTypeAsMember(TriviaDef, DropSpaceTriviaDef);

export class InsertNodeTrivia extends Trivia {
    static Def = new InsertNodeTrivia(InsertNodeTriviaDef);
    static NodeCA = lb.childAccessor(InsertNodeTriviaDef, baseConceptDef, 13, "node");
}
lb.subTypeAsMember(TriviaDef, InsertNodeTriviaDef);

export class SeparatorTrivia extends Trivia {
    static Def = new SeparatorTrivia(SeparatorTriviaDef);
    static TriviaCNA = lb.childrenAccessor(SeparatorTriviaDef, TriviaDef, 17, "trivia")
}
lb.subTypeAsMember(TriviaDef, SeparatorTriviaDef);

export class CommentToEOL extends BaseConcept {
    static Def = new CommentToEOL(CommentToEOLDef);
    
    static TextFA = lb.stringFieldAccessor(CommentToEOLDef, 14, "text");
}

export const grammarTriviaLangHeap = lb.langHeap;