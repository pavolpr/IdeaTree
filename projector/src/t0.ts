/*
- primitive types
- address types
- object
- struct
- array

*/
import * as utils from "./utils";


function ua(gid: number, id: number) {
    return { 
        uid: utils.makeUid(gid, id),
        la: undefined 
    };
}

const gidT0 = 1; //TODO: some guid
// const gidTypes = 2; //TODO: some guid
const gidObj = 3; //TODO: some guid
const gidMemUnit1 = 4; //TODO: some guid
const gidObjDef = 5; //TODO: some guid
//const gidTypeHeap1 = 5; //TODO: some guid ??? do we need this one at all ?

//const typeHeap_UA = ua(gidT0, 1);
//const mainHeap_UA = ua(gidT0, 2);

//const addressTypeLocal_UA = ua(gidT0, 3);
//const addressTypeGlobal_UA = ua(gidT0, 4);

// type constructors
//const t0_T0_UA   = ua(gidT0, 1);
//const tyc_integer_UA   = ua(gidT0, 8);
//const tyc_unsigned_UA  = ua(gidT0, 9);
//const tyc_float_UA     = ua(gidT0, 10);
//const tyc_double_UA    = ua(gidT0, 11);
//const tyc_bool_UA      = ua(gidT0, 12);
//const tyc_string_UA    = ua(gidT0, 13);

//const tyc_uaRef_UA     = ua(gidT0, 14);
//const tyc_localRef_UA  = ua(gidT0, 15);

//const tyc_nodeTopType_UA    = ua(gidT0, 5);
//const tyc_objectTopType_UA  = ua(gidT0, 6);
//const tyc_object_UA  = ua(gidT0, 20);
//const tyc_node_UA    = ua(gidT0, 21);

//const tyc_struct_UA  = ua(gidT0, 22);
//const tyc_union_UA   = ua(gidT0, 23);
//const tyc_array_UA   = ua(gidT0, 24);
//const tyc_seq_UA     = ua(gidT0, 25);

//defined intrinsic types
//const t0_node_type_UA      = ua(gidT0, 7);
//const t0_type_type_UA      = ua(gidT0, 7);
//const t0_uaNodeRef_type_UA = ua(gidT0, 7);
//const t0_u8_type_UA      = ua(gidT0, 7);


//const t0_localRef_UA = ua(gidT0, 26);
//const t0_globalRef_UA = ua(gidT0, 27);

const t0_fields_UA = ua(gidT0, 40);
const t0_children_UA = ua(gidT0, 41);
const t0_field_UA  = ua(gidT0, 42);
const t0_elementType_UA = ua(gidT0, 43);
const t0_typeField_UA = ua(gidT0, 44);
const t0_metaField_UA = ua(gidT0, 45);
const t0_nField_UA = ua(gidT0, 46); //e.g. i32


const t0_meta_primitive_UA = ua(gidT0, 80);
const t0_meta_type_UA = ua(gidT0, 81);


// *** t0 heap - meta meta model
const tyc_object = {
    _type: undefined, //tyc_object
    fields: undefined //{ field: t0_fields_UA, type: t0_fields_type }
};
tyc_object._type = tyc_object;

//MAYBE: we could make localObjRef, localNodeRef and localValueRef instead
const tyc_localRef = {
    _type: tyc_object,
    fields: [
        { field: t0_typeField_UA, type: undefined /* t0_typeRef_type*/ }
    ]
};

const tyc_objectTopType = {
    _type: tyc_object,
    fields: [
        { field: t0_metaField_UA, type: undefined /* t0_uaNodeRef_type*/ }
    ]
};

const t0_type_type = {
    _type: tyc_objectTopType,
    meta: t0_meta_type_UA
};

const t0_typeRef_type = {
    _type: tyc_localRef, 
    type: t0_type_type
};

tyc_localRef.fields[0].type = t0_typeRef_type;

const tyc_uaRef = {
    _type: tyc_object,
    fields: [
        { field: t0_typeField_UA, type: t0_typeRef_type }
    ]
};

const tyc_nodeTopType = {
    _type: tyc_object,
    fields: [
        { field: t0_metaField_UA, type: undefined /* t0_uaNodeRef_type*/ }
    ]
};

const t0_node_type = {
    _type: tyc_nodeTopType, meta: t0_meta_primitive_UA
};

const t0_uaNodeRef_type = {
    _type: tyc_uaRef, 
    type: t0_node_type
};

tyc_objectTopType.fields[0].type = t0_uaNodeRef_type;
tyc_nodeTopType.fields[0].type = t0_uaNodeRef_type;

const tyc_array_low = {
    _type: tyc_object,
    fields: [
        { field: t0_elementType_UA, type: t0_typeRef_type },
    ]
};

const tyc_struct_low = {
    _type: tyc_object,
    fields: [
        { field: t0_fields_UA, type: undefined /*t0_fields_type*/ },
    ]
};

const t0_field_type = {
    _type: tyc_struct_low,
    fields: [
        { field: t0_field_UA, type: t0_uaNodeRef_type },
        { field: t0_typeField_UA, type: t0_typeRef_type }
    ]
};

const t0_fields_type = {
    _type: tyc_array_low,
    elementType: t0_field_type
};

tyc_struct_low.fields[0].type = t0_fields_type as any;
tyc_object.fields = [
    { field: t0_fields_UA, type: t0_fields_type }
];

const tyc_struct = {
    _type: tyc_object,
    fields: [
        { field: t0_fields_UA, type: t0_fields_type },
        { field: t0_metaField_UA, type: t0_uaNodeRef_type }
    ]
};

const tyc_array = {
    _type: tyc_object,
    fields: [
        { field: t0_elementType_UA, type: t0_typeRef_type },
        { field: t0_metaField_UA, type: t0_uaNodeRef_type }
    ]
};

const t0_child_type = {
    _type: tyc_struct_low,
    fields: [
        { field: t0_field_UA, type: t0_uaNodeRef_type },
        //{ field: t0_typeField_UA, type: t0_typeRef_type }
    ]
};

const t0_children_type = {
    _type: tyc_array_low,
    elementType: t0_child_type
};

const tyc_node = {
    _type: tyc_object,
    fields: [
        { field: t0_fields_UA, type: t0_fields_type },
        { field: t0_children_UA, type: t0_children_type },
        { field: t0_metaField_UA, type: t0_uaNodeRef_type }        
    ]
};

const tyc_unsigned = {
    _type: tyc_object,
    fields: [
        { field: t0_nField_UA, type: undefined /*t0_u8_type*/ },
        { field: t0_metaField_UA, type: t0_uaNodeRef_type }
    ]
};

const t0_u8_type = {
    _type: tyc_unsigned, n: 8, meta: t0_meta_primitive_UA
};
tyc_unsigned.fields[0].type = t0_u8_type as any;

const tyc_integer = {
    ...tyc_unsigned
};

//tyc_integer_UA.la =
//tyc_unsigned_UA.la = tyc_unsigned;

const tyc_float = {
    _type: tyc_object,
    fields: [
        { field: t0_metaField_UA, type: t0_uaNodeRef_type }
    ]
};

const tyc_double = { ...tyc_float };
const tyc_bool = { ...tyc_float };
const tyc_string = { ...tyc_float };

// tyc_float_UA.la = 
// tyc_double_UA.la =
// tyc_bool_UA.la =
// tyc_string_UA.la = {
//     _type: tyc_object,
//     fields: [
//         { field: t0_metaField_UA, type: t0_uaNodeRef_type }
//     ]
// };

const t0_i32_type = {
    _type: tyc_integer, 
    n: 32, 
    meta: t0_meta_primitive_UA
};
const t0_bool_type = {
    _type: tyc_bool, meta: t0_meta_primitive_UA
};
const t0_double_type = {
    _type: tyc_double, meta: t0_meta_primitive_UA
};
const t0_string_type = {
    _type: tyc_string, meta: t0_meta_primitive_UA
};


const typeSystem = [
    tyc_object,
    tyc_localRef,
    tyc_objectTopType,
    tyc_uaRef,
    tyc_nodeTopType,
    tyc_array,
    tyc_array_low,
    tyc_struct,
    tyc_struct_low,
    tyc_node,
    tyc_unsigned,
    tyc_integer,
    tyc_double,
    tyc_bool,
    tyc_string,

    t0_i32_type,
    t0_bool_type,
    t0_double_type,
    t0_string_type,
    t0_u8_type,

    t0_type_type,
    t0_typeRef_type,
    t0_node_type,
    t0_uaNodeRef_type,
    t0_field_type,
    t0_fields_type,
    t0_child_type,
    t0_children_type
];




// const t0_node_type = {
//     _type: tyc_nodeTopType, meta: t0_meta_primitive_UA
// };
// const t0_uaNodeRef_type = {
//     _type: tyc_uaRef, ofType: t0_node_type, meta: t0_meta_primitive_UA
// };



//tyc_uaRef_UA.la = tyc_uaRef;
//tyc_localRef_UA.la = tyc_localRef;

//tyc_nodeTopType_UA.la = tyc_nodeTopType;
//tyc_objectTopType_UA.la = tyc_objectTopType;

//tyc_object_UA.la = tyc_object;
//tyc_node_UA.la = tyc_node;
//tyc_struct_UA.la = tyc_struct;
//t0_union_UA
//tyc_array_UA.la = tyc_array;
//t0_seq_UA

//t0_node_type_UA.la = t0_node_type;
//t0_type_type_UA.la = t0_type_type;
//t0_uaNodeRef_type_UA.la = t0_uaNodeRef_type;

//t0_u8_type_UA.la = t0_u8_type;

// const t0Heap = {
//     typeHeap: undefined, //t0Heap
//     //heapDescr: typeHeap_UA,
//     // typeHeap: { 
//     //     memUnitGid: gidT0/*self*/, //default
//     //     heapUA: typeHeap_UA/*self*/, //default
//     //     //?? or addressTypeGlobal_UA
//     //     //typeAddressType: addressTypeLocal_UA 
//     // },
//     // uaMaps: [
//     //     {   
//     //         type: t0_type_type_UA, //we could do it with t0_object_UA, too
//     //         uas: [
//     //             tyc_objectTopType_UA,
//     //             t0_type_type_UA
//     //         ]
//     //     }
//     // ],
//     heap: [
//         ...typeSystem
//     ]
// };
// t0Heap.typeHeap = t0Heap;

const memUnitT0 = {
    gid: gidT0,
    typeSystemGid: gidT0,
    types: [], //typeSystem, ... bootstrapped
    objects: [
        ...typeSystem
        //all the nodes here ?
    ]//typeSystem
};

// *** type heap - meta model
const fldI32_UA       = ua(gidObjDef, 1);
const fldBool_UA      = ua(gidObjDef, 2);
const fldDouble_UA    = ua(gidObjDef, 3);
const fldString_UA    = ua(gidObjDef, 4);
const fldUANodeRef_UA   = ua(gidObjDef, 5);

const fldSingleChild_UA = ua(gidObjDef, 15);
const fldMultiChild_UA  = ua(gidObjDef, 16);

const node1_def_UA  = ua(gidObjDef, 30);



const node1_type = {
    _type: tyc_node,
    fields: [
        { field: fldI32_UA, type: t0_i32_type },
        { field: fldBool_UA, type: t0_bool_type },
        { field: fldDouble_UA, type: t0_double_type },
        { field: fldString_UA, type: t0_string_type },
        { field: fldUANodeRef_UA, type: t0_uaNodeRef_type },
    ],
    children: [
        { field: fldSingleChild_UA },
        { field: fldMultiChild_UA },
    ],
    meta: node1_def_UA
};

// const typeHeap = {
//     typeSystemUA: t0_T0_UA,
//     importedTypesCount: 50, //may have default of 50
//     //gid: gidTypeHeap1, // ?? do we need this
//     //heapDescr: typeHeap_UA,
//     // typeHeap: { 
//     //     memUnitGid: gidT0, 
//     //     heapUA: typeHeap_UA, //default
//     //     //typeAddressType: addressTypeGlobal_UA //default
//     // },
//     // referencedMUs: [ 
//     //     gidT0 //may be omitted
//     // ],
//     types: [
//         // t0_bool_type,
//         // t0_i32_type,
//         // t0_double_type,
//         // t0_string_type,
        
//         // t0_node_type,
//         // t0_uaNodeRef_type,

//         node1_type,
//     ]
// };

const types = [
    node1_type,
];

// *** object heap - model

const node1_UA     = ua(gidObj, 1);
const node2_UA     = ua(gidObj, 2);
const childSingleNode_UA = ua(gidObj, 3);
const childMulti1Node_UA = ua(gidObj, 4);
const childMulti2Node_UA = ua(gidObj, 5);

node1_UA.la = {
    _type: node1_type, //local address of type "Type"
    fldI32: 100,
    fldBool: true,
    fldDouble: 42.14,
    fldUANodeRef: node2_UA,
    fldString: "bla bla",
    //children
    fldSingleChild: childSingleNode_UA,
    fldMultiChild: [ 
        childMulti1Node_UA, 
        childMulti2Node_UA 
    ]
};

childSingleNode_UA.la = {};
childMulti1Node_UA.la = {};
childMulti2Node_UA.la = {};

node2_UA.la = {};


const memUnit1 = {
    gid: gidMemUnit1,
    
    typeSystemGid: gidT0,
    //importedTypesCount: 50, //may have default of 50
    types: types,
    //gid: gidMemUnit1, //main heap can reuse the guid of its MU
    //heapDescr: mainHeap_UA,
    // typeHeap: { // this is the default, can be omitted
    //     memUnitGid: gidMemUnit1/*self*/, //default
    //     heapUA: typeHeap_UA, //default
    //     //typeAddressType: addressTypeLocal_UA //default
    // },
    uaMaps: [
        {   type: t0_node_type,
            uas: [
                node1_UA,
                node2_UA,
                childSingleNode_UA
            ]
        }
    ],
    referencedMUs: [ ], //default is empty + typeHeap's memUnitGid
    objects: [
        node1_UA.la,
        node2_UA.la,
        childSingleNode_UA.la
    ]
};


// const memUnit1 = {
//     gid: gidMemUnit1,
//     heap: mainHeap
// };
