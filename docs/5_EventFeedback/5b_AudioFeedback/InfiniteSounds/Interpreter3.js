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
  const res = [];
  let mutated = false;
  for (let item of node) {
    let interpretedItem = await interpretNode(item, table, ctx);
    if (interpretedItem !== item)
      mutated = true;
    res.push(interpretedItem);
  }
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

export async function staticInterpret(str) {
  let node = parse(str);
  node = await interpretNode(node, Object.assign({}, ListOps, MathOps, Music));
  //variables: declare and replace
  //cache temporarily
  return node;
}

export async function interpret(str, ctx) {
  let node = await staticInterpret(str);
  node = await interpretNode(node, Random);
  node = await interpretNode(node, MathOps);
  node = await interpretNode(node, InterpreterFunctions, ctx);
  node = await interpretNode(node, AudioPiping);
  return node;
}