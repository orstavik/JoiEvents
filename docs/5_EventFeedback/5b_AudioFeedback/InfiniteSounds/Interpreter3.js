import {parse} from "./Parser2.js";
import {Random} from "./LibRandom.js";
import {MathOps} from "./LibMath.js";
import {ListOps, AudioPiping} from "./LibSyntax.js";
import {InterpreterFunctions} from "./LibAudio.js";
import {Music} from "./LibMusic.js";

async function interpretExpressionArgs(node, table, ctx) {
  const left = await interpretNode(node.left, table, ctx);
  const right = await interpretNode(node.right, table, ctx);
  return left === node.left && right === node.right ?
    node :
    {type: node.type, left, right};
}

async function interpretBody(node, table, ctx) {
  let body = await interpretNode(node.body, table, ctx);
  if (body.type === "()")
    body = body.body;
  return body === node.body ? node : {type: node.type, body};
}

async function interpretArray(node, table, ctx) {
  // if (node.onlyNumbers)
  //   return node;
  const res = [];
  // let onlyNumbers = true;
  let mutated = false;
  for (let item of node) {
    let interpretedItem = await interpretNode(item, table, ctx);
    if (interpretedItem !== item)
      mutated = true;
    res.push(interpretedItem);
    // if (typeof interpretedItem !== "number" && !(interpretedItem instanceof Array && interpretedItem.onlyNumbers))
    //   onlyNumbers = false;
  }
  // if (onlyNumbers)
  //   res["onlyNumbers"] = 1;
  return mutated ? res : node;
}

export async function interpretNode(node, table, ctx) {
  if (!node)
    return node;
  if (node instanceof Array)
    return await interpretArray(node, table, ctx);
  if (node.left || node.right)
    node = await interpretExpressionArgs(node, table, ctx);
  if (node.body)
    node = await interpretBody(node, table, ctx);
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