import {parse, isPrimitive} from "./Parser.js";
import {Random} from "./LibRandom.js";
import {MathOps} from "./LibMath.js";
import {ListOps, AudioPiping} from "./LibSyntax.js";
import {InterpreterFunctions} from "./LibAudio.js";
// import {MusicStatic, MusicDynamic} from "./LibMusic.js";
import {MusicStatic} from "./LibMusic2.js";
import {Units} from "./LibUnits.js";

async function interpretArray(node, table, ctx) {
  const clone = new Array(node.length);
  for (let i = 0; i < node.length; i++) {
    clone[i] = await interpretNode(node[i], table, [i].concat(ctx));
    if (!isPrimitive(clone[i]))
      clone.isDirty = 1;
  }
  return clone;
}

export async function interpretNode(node, table, ctx) {
  if (isPrimitive(node))
    return node;
  if (node instanceof Array)                                                //todo this would be a primitive
    return await interpretArray(node, table, [node].concat(ctx));
  //todo here I can do a topDown pass
  const clone = Object.assign({}, node);
  if (clone.body)
    clone.body = await interpretArray(clone.body, table, [node].concat(ctx)); //todo the body would need to be marked as a list of primitives
  const fun = table[clone.type];
  return fun ? (await fun(clone, ctx)) : clone;
}

//todo process units such as "b" (beats) dynamically, and tones needs the context to create their gain node. what to do with dB?
const staticTable = Object.assign({}, ListOps, Units, MathOps, MusicStatic);
const dynamicTable = Object.assign({}, Random, MathOps, InterpreterFunctions, AudioPiping);
// const dynamicTable = Object.assign({}, Random, MathOps, MusicDynamic, InterpreterFunctions, AudioPiping);

export async function staticInterpret(str) {
  let node = parse(str);
  node = await interpretNode(node, staticTable, []);
  //variables: declare and replace
  //cache temporarily
  return node;
}

export async function interpret(str, ctx) {
  let node = await staticInterpret(str);
  node = await interpretNode(node, dynamicTable, [ctx]);
  return node;
}