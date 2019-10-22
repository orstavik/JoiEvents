import {parse, isPrimitive} from "./Parser2.js";
import {Random} from "./LibRandom.js";
import {MathOps} from "./LibMath.js";
import {ListOps, AudioPiping} from "./LibSyntax.js";
import {InterpreterFunctions} from "./LibAudio.js";
import {Music} from "./LibMusic.js";

async function interpretArray(node, table, ctx) {
  const clone = node.slice(0);
  for (let i = 0; i < clone.length; i++) {
    clone[i] = await interpretNode(clone[i], table, ctx);
    if (!isPrimitive(clone[i]))
      clone.isDirty = 1;
  }
  return clone;
}

//todo
//1. what about the isPrimitive property on arrays.. first, invert the setting to check if it is primitive or not, and then try to make it into an object instead?
//2. then pass in the parents as the root context, as an array of context nodes?

export async function interpretNode(node, table, ctx) {
  if (isPrimitive(node))
    return node;
  if (node instanceof Array)
    return await interpretArray(node, table, ctx);
  const clone = Object.assign({}, node);
  if (!isPrimitive(clone.body))
    clone.body = await interpretArray(clone.body, table, ctx);
  const fun = table[clone.type];
  return fun ? (await fun(clone, ctx)) : clone;
}

//todo process unit functions such as "MHz", "dB", "ms". "b" (beats), and tones must be processed dynamically.
const staticTable = Object.assign({}, ListOps, MathOps, Music);
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