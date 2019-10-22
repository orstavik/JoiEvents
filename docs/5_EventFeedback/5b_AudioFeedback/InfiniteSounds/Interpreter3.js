import {parse, isPrimitive} from "./Parser2.js";
import {Random} from "./LibRandom.js";
import {MathOps} from "./LibMath.js";
import {ListOps, AudioPiping} from "./LibSyntax.js";
import {InterpreterFunctions} from "./LibAudio.js";
import {Music} from "./LibMusic.js";

async function interpretArray(clone, table, ctx) {
  clone.isPrimitive = 1;
  for (let i = 0; i < clone.length; i++) {
    clone[i] = await interpretNode(clone[i], table, ctx);
    if (!isPrimitive(clone[i]))
      clone.isPrimitive = 0;
  }
  return clone;
}

async function interpretFunction(clone, table, ctx) {
  if (!isPrimitive(clone.body))
    clone.body = await interpretArray(clone.body, table, ctx);
  let fun = table[clone.type];
  return fun ? (await fun(clone, ctx)) : clone;
}

export async function interpretNode(node, table, ctx) {
  if (isPrimitive(node))
    return node;
  const clone = node instanceof Array ? node.slice(0) : Object.assign({}, node);
  if (node instanceof Array)
    return await interpretArray(clone, table, ctx);
  else if (node.type)
    return await interpretFunction(clone, table, ctx);
  else
    return clone;     //units and tones
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