import {parse, isPrimitive} from "./Parser2.js";
import {Random} from "./LibRandom.js";
import {MathOps} from "./LibMath.js";
import {ListOps, AudioPiping} from "./LibSyntax.js";
import {InterpreterFunctions} from "./LibAudio.js";
import {Music} from "./LibMusic.js";

async function interpretArray(node, table, ctx) {
  if (node.isPrimitive)
    return node;
  const res = [];
  let onlyNumbers = true;
  let mutated = false;
  for (let item of node) {
    let interpretedItem = await interpretNode(item, table, ctx);
    if (interpretedItem !== item)
      mutated = true;
    res.push(interpretedItem);
    if (!isPrimitive(interpretedItem))
      onlyNumbers = false;
  }
  if (onlyNumbers)
    res.isPrimitive = 1;
  return mutated ? res : node;
}

//todo add parent!
export async function interpretNode(node, table, ctx/*, parent*/) {
  if (isPrimitive(node))
    return node;
  if (node instanceof Array){
    let newAr = await interpretArray(node, table, ctx/*, parent*/);
    //newAr.parent = node;
    return newAr; //todo, here we will always return a new object.
  }
  if (!node.type)      //number with unit, tone, etc.
    return node;       //todo clone and add parent
  let body = await interpretArray(node.body, table, ctx/*, parent*/);     //todo, here we will always return a new object.
  node = {type: node.type, body/*, parent*/}; //todo and add parent to the array object
  let fun = table[node.type];
  return fun ? (await fun(node, ctx)) : node;
}

//todo units "MHz", "dB", "ms" can be processed statically.
const staticTable = Object.assign({}, ListOps, MathOps, Music);

//todo units such as "b" (beats), and tones must be processed dynamically.
//todo, should I convert types into functions? b, being an operator?? C# being a function??
const dynamicTable = Object.assign({}, Random, MathOps, InterpreterFunctions, AudioPiping);

export async function staticInterpret(str) {
  let node = parse(str);
  node = await interpretNode(node, staticTable);
  //variables: declare and replace
  //cache temporarily
  return node;
}

export async function interpret(str, ctx) {
  let node = await staticInterpret(str);
  node = await interpretNode(node, dynamicTable, ctx);
  return node;
}