//import { h, render, Component, JSX } from "preact";
import { For, render } from 'solid-js/web'
//import { Node, ensureGlobalNode, type INodeRef, type IReadNode, type IReadNodeInternal } from "./node";
//import * as utils from "./utils";
//import { createHeap1, createHeap2 } from "./testNodes";
//import { TypeKind, PrimitiveType, PrimitiveKind } from "./type";
//import { Heap } from "./heap";
//import { nameFieldDef, getFieldName, getNodeName, t0int32Type, t0Heap } from "./concept";
import { globalState } from "./mx/globalstate";
//import { observer } from "./mx/preact";
//import { HeapDump } from "./dump";
//import { RichText, Line, Text, Space, InLine, TextStyle, editorLangHeap } from "./editor/editorLang";
import { addStyleToHead } from "./mx/styles";
//import { AtomValue, Atom } from "./mx/atom";
//import { startBatch, endBatch } from "./mx/source";
//import { Cursor } from "./editor/Cursor";
import { structureLangHeap } from "./core/structureLang";
import { grammarLangHeap } from "./core/grammarLang";
import { tokenLangHeap } from "./core/tokenLang";
import "./core/postDefinitions";
//import { StringRenderContext } from "./editor/renderText";
import { tokenTreeLangHeap } from "./editor/tokenTreeLang";
import { ProjectionMap } from "./editor/renderUtils";
import { DomRenderingProjection } from "./editor/DomRenderingProjection";
import { grammarTriviaLangHeap } from "./core/grammarTriviaLang";
import { addTops, changeTopElementName, removeFirstTops, removeSecondTops, TestSrcHeap } from "./core/testSrc";
import { buildTokens, getAllTokens, tokenStateDiagram } from './parser/buildParser';

// function showHello(divName: string, name: string) {
//     const elt = document.getElementById(divName);
//     elt.innerText = sayHello(name);
// }

//showHello("greeting", "TypeScript");


// class Clock extends Component<any, any> {
//     render() {
//         const time =  new Date().toLocaleTimeString();
//         return <span>{ time } ha </span>;
//     }
// }

/*
function uidString(uid: number) {
    return `(${utils.getGidx(uid)}/${utils.getSidx(uid)})`;

}

interface INativeNodeProps {
    node: INodeRef;
}
@observer
class NativeNode extends Component<INativeNodeProps, any> {
    render({ node }: INativeNodeProps): JSX.Element {
        const uid = node.uid;
        const read = node.read;
        const def = read && read.def;
        const defName = getNodeName(def) || uidString(def.uid);
        const head = <span style="color:gray">[{defName}]{uidString(uid)}{(read as IReadNodeInternal)._heapContext!.changeMap.isEditable ? "E" : "R"}</span>;

        const fields = read && read.type.fields;

        if (fields && fields.length) {
            const properties = [];
            const childNodes = [];
            let name;
            for (let i = 0; i < fields.length; i++) {
                const field = fields[i];
                if (field.type.kind === TypeKind.ChildNode) {
                    childNodes.push(<NodeProperty node={node} record={read!} fieldIndex={i} />);
                } else {
                    if (field.uid === nameFieldDef.uid) {
                        name = read!.getFieldAt(i) as string;
                    } else {
                        properties.push(<NodeProperty node={node} record={read!} fieldIndex={i} />);
                    }
                }
            }
            return <div>{name}{head} {properties} {childNodes}</div>;
        }
        return <div>{head}</div>;
    }
}

interface INodePropertyProps extends INativeNodeProps {
    record: IReadNode;
    fieldIndex: number;
}
@observer
class NodeProperty extends Component<INodePropertyProps, any> {
    render({ /*node: _node,* / record, fieldIndex }: INodePropertyProps) {
    const field = record.type.fields[fieldIndex];
    const fieldName = getFieldName(field);
    const uid = field.uid;
    const rawValue = record.getFieldAt(fieldIndex);
    let value;
    switch (field.type.kind) {
        case TypeKind.String:
            value = <span style="color:green">"{rawValue}"</span>;
            break;
        case TypeKind.Primitive:
            switch ((field.type as PrimitiveType).primitiveKind) {
                case PrimitiveKind.Bool:
                    value = <span style="color:blue">{rawValue ? "true" : "false"}</span>;
                    break;
                case PrimitiveKind.Double:
                    let strValue = "" + rawValue;
                    if (!/e|\./.test(strValue)) strValue += ".0";
                    value = <span style="color:black">{strValue}</span>;
                    break;
                case PrimitiveKind.Int32:
                default:
                    value = <span style="color:black">{rawValue}</span>;
                    break;
            }
            break;
        case TypeKind.Ref:
            const name = getNodeName(rawValue as Node);
            value = <span style="color:gray"><span style="color:purple">{name}</span> ref{uidString((rawValue as Node).uid)}</span>;
            break;
        case TypeKind.ChildNode:
            const children = [];
            for (let child = rawValue as INodeRef; child !== undefined; child = child.read.next!) {
                children.push(<NativeNode node={child} />);
            }
            value = <div style="position:relative;left:20px;">{children}</div>;
            break;
    }

    return <div>&nbsp;&nbsp;<span style="color:brown">{fieldName}<span style="color:gray">{uidString(uid)}</span></span>:{value} </div>;
}
}

interface INativeHeapProps {
    heap: Heap;
    changeMap?: IChangeMap;
}
@observer
class NativeHeap extends Component<INativeHeapProps, any> {
    render({ heap }: INativeHeapProps) {
        const root = heap.root;
        const rootRead = root.readNode(undefined, true);

        const fragments = heap.fragments.filter((fragment) => fragment !== rootRead).map((fragment) => <NativeNode node={fragment} />);
        const heapDump = new HeapDump(heap, globalState.changeMap);
        const dump = heapDump.dump();
        const dumpStr = JSON.stringify(dump);
        return <div>
            {rootRead !== undefined ? <NativeNode node={root} /> : "no root"}
            {fragments}
            <div>{dumpStr}</div>
        </div>;
    }
}
*/
addStyleToHead(`.cursor { 
    position:absolute;
    border: 0 solid black;
    /*border-color:black;*/
    border-radius:0;
    color:transparent; 
    background:transparent;
    outline-width:0;
    margin:0;
    padding:0;
    resize:none;
    /*box-sizing: border-box;*/
    /*animation: blinker 1s step-start infinite; */
}`);
addStyleToHead(`@keyframes blinker { 50% { opacity: 0; } }`);
addStyleToHead(`.blink { 
    animation: blinker 1s step-start infinite;
}`);
/*
@observer
class CursorProj extends Component<{ cursor: Cursor }, any> {
    onFocus = (e: FocusEvent) => {
        console.log("focus cursor", e);
        this.props.cursor.focus();
    }
    onBlur = (e: FocusEvent) => {
        console.log("blur cursor", e);
        this.props.cursor.isVisible.set(false);
    }
    onMouseDown = (e: MouseEvent) => {
        console.log("cursor mouse down", e)
        let parent = this.props.cursor.token.get()?.read.parent;
        if (!parent) return;
        this.props.cursor.onMouseDownOnLine(e, parent);
    }
    render({ cursor }: { cursor: Cursor }) {
        let style = "opacity:0.01;left:0;top:0;width:1px;height:1px"//"visibility:hidden;";
        let className = "cursor";
        let result = cursor.cursorResult.get();
        if (cursor.isVisible.get() && result) {
            let border = result.isFromRight ? `border-width: 1px ${result.cursorWidth}px 1px 0;` : `border-left-width:${result.cursorWidth}px;`;
            let top = result.isFromRight ? result.top - 1 : result.top; //whn from right make the top border above the previous character
            style = `top:${top}px;left:${result.left}px;width:${result.width}px;height:${result.height}px;` + border;
            if (result.isBlinking.get()) className = "cursor blink";
            else cursor.planBlinkStart();
        }
        //return <div style={style} className="cursor"></div>;
        return <textarea ref={cursor.setDomRef}
            wrap="off"
            autocomplete="off"
            //spellCheck={false}
            className={className}
            style={style}
            onKeyDown={cursor.onKeyDown}
            onInput={cursor.onInput as any}
            onFocus={this.onFocus}
            onBlur={this.onBlur}
            onMouseDown={this.onMouseDown}
        />;
    }

}

class MxMap<K, V> {
    atom = new Atom();
    private map = new Map<K, AtomValue<V | null | undefined>>();
    get(k: K) {
        let av = this.map.get(k);
        if (av)
            return av.get();
        this.atom.reportRead();
        return undefined;
    }
    set(k: K, v: V | null | undefined) {
        let av = this.map.get(k);
        if (av) {
            if (v == null) {
                this.map.delete(k);
            }
            av.set(v);
            return;
        }
        this.map.set(k, new AtomValue(v));
        this.atom.reportChanged();
    }
}
export class Editor {
    cursor = new Cursor(this);
    node2dom = new MxMap<INodeRef, HTMLElement>();
    constructor(public richText: INodeRef) {
    }
}
let toAddNodes: any[] = [];
// let scheduled = false;
function addNodes2domMap() {
    startBatch();
    for (let i = 0; i < toAddNodes.length; i++) {
        const editor = (toAddNodes[i] as IEditorCtx).editor;
        const node = toAddNodes[++i] as INodeRef;
        const elem = toAddNodes[++i] as HTMLElement;
        editor.node2dom.set(node, elem);
    }
    toAddNodes.length = 0;
    endBatch();
}
function node2domRef(ctx: any, node: INodeRef) {
    return (elem: HTMLElement | null) => {
        if (!toAddNodes.length) {
            setTimeout(addNodes2domMap)
        }
        toAddNodes.push(ctx, node, elem);
        //(ctx as IEditorCtx).editor.node2dom.set(node, elem);
    };
}

interface IEditorCtx {
    editor: Editor
}

interface INodeProjProps {
    node: IReadNode;
}

@observer
class RichTextProj extends Component<INodeProjProps, IEditorCtx> {
    constructor({ node }: INodeProjProps) {
        super();
        this.state = { editor: new Editor(node.me) };
    }
    render({ node }: INodeProjProps, state: IEditorCtx) {
        //tabIndex={0}
        //onMouseDown={this.state.editor.cursor.onMouseDown}
        return <div style={`
            resize:auto;
            overflow:auto;
            width:450px;
            height:200px;
            padding:2px; /*accomodate right cursor, mainly from top* /
            `}>
            <div
                ref={node2domRef(state, node.me)}
                style="position:relative"
            >
                <RichTextLinesProj node={node} />
                <CursorProj cursor={state.editor.cursor} />
            </div>
        </div>;
    }
    getChildContext() {
        return this.state;
    }
    componentDidMount() {

    }
}
@observer
class RichTextLinesProj extends Component<INodeProjProps, any> {
    render({ node }: INodeProjProps) {
        let line = RichText.LinesCNA.getFirstChild(node)?.read;
        let lines = [];
        while (line !== undefined) {
            lines.push(<LineProj node={line} />);
            line = line.next?.read;
        }
        return <div>{lines}</div>;
    }
}

addStyleToHead(`.indent { 
    margin-right: 29px;
    /*width:0;* /
    border-left: 1px dotted gray;
}`);

@observer
class LineProj extends Component<INodeProjProps, any> {
    render({ node }: INodeProjProps) {
        let inline = Line.InLinesCNA.getFirstChild(node)?.read;
        let inlines = [];

        let indent = Line.IndentFA.get(node) || 0;
        const indLevelWidth = 30; //TODO: config, style or settings
        //const indWidth = 0; //indent * indLevelWidth;
        const wrapIndent = indent * indLevelWidth + indLevelWidth / 4;
        for (; indent > 0; indent--) {
            inlines.push(<span class="indent" />); //style={`margin-right:${indLevelWidth}px`}
        }


        while (inline !== undefined) {
            const concept = inline.type.concept;
            if (concept instanceof Text) {
                inlines.push(<TextProj node={inline} />);
            } else if (concept instanceof Space) {
                inlines.push(<SpaceProj node={inline} />);
            }
            inline = inline.next?.read;
        }

        return <div style={`margin-left:${wrapIndent}px;text-indent:${-wrapIndent}px;`}
            ref={node2domRef(this.context, node.me)}
            onMouseDown={this.onMouseDown}
        >
            {inlines}
        </div>;
    }
    onMouseDown = (e: MouseEvent) => {
        (this.context as IEditorCtx).editor.cursor.onMouseDownOnLine(e, this.props.node.me);
    }
}

@observer
class TextProj extends Component<INodeProjProps, any> {
    render({ node }: INodeProjProps) {
        const text = Text.TextFA.get(node);
        const style = InLine.StyleFA.get(node);
        const ref = node2domRef(this.context, node.me);
        if (style) {
            const className = TextStyle.getClassName(style);
            return <span ref={ref} class={className}>{text}</span>;
        }
        return <span ref={ref}>{text}</span>;
    }
}

addStyleToHead(`.space { 
    white-space:pre-wrap;
}`);

@observer
class SpaceProj extends Component<INodeProjProps, any> {
    render({ node }: INodeProjProps) {
        //const text = Text.TextFA.get(node);
        //TODO: space style
        //style="background:gray"
        return <span className="space" ref={node2domRef(this.context, node.me)}> </span>;
    }
}

class TextAreaInput extends Component<any, any> {
    render() {
        //autocapitalize', 'off'
        //autocorrect="off"

        return <textarea wrap="off"
            autocomplete="off"
            //spellCheck={false}
            class="inputarea"
            style="color: transparent; border-width:0;outline-width:0;resize:none;"
            onKeyDown={this.onKeyDown}
            onInput={this.onInput}
        />;


    }
    onInput = (e: Event) => {

        console.log("input", (e.target as any).value, e);
        //e.preventDefault();
        (e.target as any).value = "";
    }
    onKeyDown = (e: KeyboardEvent) => {
        //e.preventDefault();
        if (!e.repeat) console.log("key", e.key, e);
    }
}

class EditorArea extends Component<any, any> {
    render() {
        return <div>
            <TextAreaInput />
        </div>;
    }
}
*/

/*
addStyleToHead(`.cursor { 
    position:absolute;
    border: 0 solid black;
    /*border-color:black;* /
    border-radius:0;
    color:transparent; 
    background:transparent;
    outline-width:0;
    margin:0;
    padding:0;
    resize:none;
    / *box-sizing: border-box;* /
    / *animation: blinker 1s step-start infinite; * /
}`);
addStyleToHead(`@keyframes blinker { 50% { opacity: 0; } }`);
addStyleToHead(`.blink { 
    animation: blinker 1s step-start infinite;
}`);
*/
// const heap1 = createHeap1();
// const heap2 = createHeap2();
// const root1 = heap1.root;

// const nodeDefGidx = globalState.guidMap.gidxFromString("dada1000-94c1-42d7-b609-f2f5da36666b");
// const fld32Def = ensureGlobalNode(utils.makeUid(nodeDefGidx, 2));
globalState.setupEditMode();

let projectionMap = new ProjectionMap();
projectionMap.addToProjectionMap(structureLangHeap);
projectionMap.addToProjectionMap(tokenLangHeap);
projectionMap.addToProjectionMap(grammarLangHeap);
projectionMap.addToProjectionMap(tokenTreeLangHeap);
projectionMap.addToProjectionMap(grammarTriviaLangHeap);

// const ctx = new StringRenderContext(projectionMap);
// const structureString = ctx.renderHeap(structureLangHeap);
// const tokenString = ctx.renderHeap(tokenLangHeap);
// const grammarString = ctx.renderHeap(grammarLangHeap);
// const tokenTreeString = ctx.renderHeap(tokenTreeLangHeap);

const { tokenDefs, tokenDefNames, constantTokens } = getAllTokens();
const tokens = buildTokens(tokenDefs, constantTokens);
const tokenDiagram = tokenStateDiagram(tokens.mainStart);
const tokenDFADiagram = tokenStateDiagram(tokens.mainStart.dfa());

//ChangeSubType()
const dctxE = new DomRenderingProjection(projectionMap);
const domE = dctxE.renderHeap(TestSrcHeap);

const dctx1 = new DomRenderingProjection(projectionMap);
const dom1 = dctx1.renderHeap(structureLangHeap);

const dctx2 = new DomRenderingProjection(projectionMap);
const dom2 = dctx2.renderHeap(tokenLangHeap);

const dctx3 = new DomRenderingProjection(projectionMap);
const dom3 = dctx3.renderHeap(grammarLangHeap);

const dctx4 = new DomRenderingProjection(projectionMap);
const dom4 = dctx4.renderHeap(tokenTreeLangHeap);

const dctx5 = new DomRenderingProjection(projectionMap);
const dom5 = dctx5.renderHeap(grammarTriviaLangHeap);


function App() {
    //return <RichTextProj node={heap2.heap.root.read} />;
    //<RichTextProj node={heap2.heap.root.read} />
    //<NativeHeap heap={heap2.heap} />
    //<button onClick={() => TextStyle.FontSizeFA.set(heap2.style2, 20)}>change style</button>
    return (
        <div>
            <h3>Tokens</h3>
            <pre style={{ "white-space": "pre-wrap", "word-break": "break-word" }}>
                <For each={tokenDefNames}>
                    {(token, i) => i() > 0 ? " '" + token + "'" : "'" + token + "'"}
                </For>
            </pre>
            <pre style={{ "white-space": "pre-wrap", "word-break": "break-word" }}>
                <For each={Array.from(constantTokens)}>
                    {(token, i) => i() > 0 ? " '" + token + "'" : "'" + token + "'"}
                </For>
            </pre>
            <h3>Token Diagram</h3>
            <pre style={{ "white-space": "pre-wrap", "word-break": "break-word" }}>
                {tokenDiagram}
            </pre>
            <h3>Token DFA Diagram</h3>
            <pre style={{ "white-space": "pre-wrap", "word-break": "break-word" }}>
                {tokenDFADiagram}
            </pre>
            <h3>Test Src  DOM</h3>
            <button onClick={() => addTops()}>Change SubType</button>
            <button onClick={() => removeFirstTops()}>Remove SubType first child</button>
            <button onClick={() => removeSecondTops()}>Remove SubType second child</button>
            <button onClick={() => changeTopElementName()}>Change TopElementName</button>
            <div id="domE"></div>


            <h3>trivia lang DOM</h3>
            <div id="dom5"></div>

            <h3>structure DOM</h3>
            <div id="dom1"></div>

            <h3>token lang DOM</h3>
            <div id="dom2"></div>

            <h3>grammar lang DOM</h3>
            <div id="dom3"></div>

            <h3>token tree lang DOM</h3>
            <div id="dom4"></div>

            {/* <h3>token tree text</h3>
            <pre>{tokenTreeString}</pre>

            <h3>structure text</h3>
            <pre>{structureString}</pre>

            <h3>token text</h3>
            <pre>{tokenString}</pre>
            
            <h3>grammar text</h3>
            <pre>{grammarString}</pre>

            <h3>grammar heap</h3>
            <NativeHeap heap={grammarLangHeap} />

            <h3>token heap</h3>
            <NativeHeap heap={tokenLangHeap} />

            <h3>t0 heap</h3>
            <NativeHeap heap={structureLangHeap} />
            
            <h3>editor lang</h3>
            <NativeHeap heap={editorLangHeap} />

            <h3>heap 1</h3>
            <NativeHeap heap={heap1} />
            <button onClick={() => {
                root1.write!.setField(fld32Def, 5, t0int32Type);
            }}>change fld32</button>

            <h3>heap 2</h3>
            <NativeHeap heap={heap2.heap} />
            <button onClick={() => TextStyle.FontSizeFA.set(heap2.style2, 20)}>change style</button>
            <button onClick={() => this.forceUpdate()}>force update</button>
            <RichTextProj node={heap2.heap.root.read} />
            
            <EditorArea /> */}
        </div>
    );

}

//const _ = structureLangHeap;

globalState.setupEditMode();

render(() => <App />, document.getElementById("nodeRoot")!);

document.getElementById("domE")?.appendChild(domE);
document.getElementById("dom1")?.appendChild(dom1);
document.getElementById("dom2")?.appendChild(dom2);
document.getElementById("dom3")?.appendChild(dom3);
document.getElementById("dom4")?.appendChild(dom4);
document.getElementById("dom5")?.appendChild(dom5);