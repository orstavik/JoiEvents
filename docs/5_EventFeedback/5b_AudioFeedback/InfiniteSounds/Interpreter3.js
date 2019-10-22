import {parse, isPrimitive} from "./Parser2.js";
import {Random} from "./LibRandom.js";
import {MathOps} from "./LibMath.js";
import {ListOps, AudioPiping} from "./LibSyntax.js";
import {InterpreterFunctions} from "./LibAudio.js";
import {Music} from "./LibMusic.js";

async function interpretArray(node, table, ctx) {
  const clone = [];
  clone.isPrimitive = 1;
  for (let item of node) {
    let newNode = await interpretNode(item, table, ctx, clone);
    clone.push(newNode);
    if (!isPrimitive(newNode))
      clone.isPrimitive = 0;
  }
  return clone;
}

async function interpretFunction(node, table, ctx) {
  const clone = Object.assign({}, node);
  if (!clone.body.isPrimitive)
    clone.body = await interpretArray(clone.body, table, ctx, clone);
  let fun = table[node.type];
  return fun ? (await fun(clone, ctx)) : clone;
}

function interpretOther(node, table, ctx) {
  return Object.assign({}, node);
}

export async function interpretNode(node, table, ctx) {
  if (isPrimitive(node))
    return node;
  if (node instanceof Array)
    return await interpretArray(node, table, ctx);
  else if (node.type)
    return await interpretFunction(node, table, ctx);
  else
    return interpretOther(node, table, ctx);
}

//todo units "MHz", "dB", "ms" can be processed statically.
const staticTable = Object.assign({}, ListOps, MathOps, Music);

//todo units such as "b" (beats), and tones must be processed dynamically.
//todo, should I convert types into functions? b, being an operator?? C# being a function??
const dynamicTable = Object.assign({}, Random, MathOps, InterpreterFunctions, AudioPiping);

export async function staticInterpret(str) {
  let node = parse(str);
  node = await interpretNode(node, staticTable, undefined);
  //variables: declare and replace
  //cache temporarily
  return node;
}

export async function interpret(str, ctx) {
  let node = await staticInterpret(str);
  node = await interpretNode(node, dynamicTable, ctx);
  return node;
}