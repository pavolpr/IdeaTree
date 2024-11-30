import { conceptOrTraitDefMembersDef, LangBuilder } from "../concept";
import { endBatch, startBatch } from "../mx/source";
import { tINamed } from "./structureLang";

export const langGuid = "7c91303f-155d-495a-a855-1256e6b10e61";
const lb = new LangBuilder(langGuid, "TestSrc", 100);

export const TestSrcHeap = lb.langHeap;

const TopElementDef = lb.newConceptDefNode(1, "TopElement");

const SubTypeDef = lb.newConceptDefNode(2, "SubType");


lb.childrenAccessor(TopElementDef, SubTypeDef, 15, "subs")

//ChangeSubType();
let i = 16;
//addTops();
//addTops();
//addTops();
export function addTops() {
    startBatch();
    lb.childrenAccessor(SubTypeDef, TopElementDef, i, "tops"+i);
    i++;
    endBatch();
}

export function removeFirstTops() {
    startBatch();
    const child = SubTypeDef.read.getFirstChild(conceptOrTraitDefMembersDef);
    if(child) child.write.detach();
    
    endBatch();
}

export function removeSecondTops() {
    startBatch();
    const child = SubTypeDef.read.getFirstChild(conceptOrTraitDefMembersDef)?.read.next;
    if(child) child.write.detach();
    
    endBatch();
}

export function changeTopElementName() {
    startBatch();
    tINamed.NameFA.set(TopElementDef.write, "TopElement" + i++);
    
    endBatch();
}