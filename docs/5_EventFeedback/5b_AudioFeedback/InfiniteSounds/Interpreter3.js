import {parse} from "./Parser2.js";
import {Random} from "./LibRandom.js";
import {MathOps1, MathOps2} from "./LibMath.js";
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
/*
  if (fun /!*&& (table.topDown[node.type] || table.topDownAndBottomUp[node.type])*!/) {
    const res = fun(node, ctx);   //if the result is a new node, this node too must be interpreted.
    if (res !== node)
      return await interpretNode(res, table);     //if the ltr operation triggers, then the result of that operation needs to be interpreted from scratch as it might contain a new ltr
    //if its the same, then the arguments needs to be processed
  }
*/
  if (node.left || node.right)
    node = await interpretExpressionArgs(node, table, ctx);
  if (node.body)
    node = await interpretBody(node, table, ctx);
  let fun = table[node.type];
  return (fun /*&& !table.topDown[node.type]*/) ? (await fun(node, ctx)) : node;
}

export async function staticInterpret(str) {
  let node = parse(str);
  //todo merge tables. Because I need to process the operators in the correct order.
  //todo, when I have operator graph, I should rearrange it grammatically, so that the bottom nodes are the ones being processed first.
  //todo, then, I can just run a bottom up pass on everything.
  //todo, yes, keep the structure smart.
  node = await interpretNode(node, ListOps);
  node = await interpretNode(node, MathOps1);
  // node = await interpretNode(node, MathOps2);
  node = await interpretNode(node, Music, {activeKeys: new Set()});
  //variables: declare and replace
  //cache temporarily
  return node;
}

export async function interpret(str, ctx) {
  let node = await staticInterpret(str);
  //todo no, cannot merge tables. Because I need to process the operators in the correct order.
  //todo, when I have operator graph, I should rearrange it grammatically, so that the bottom nodes are the ones being processed first.
  //todo, then, I can just run a bottom up pass on everything.
  //todo, yes, keep the structure smart.
  node = await interpretNode(node, Random);
  node = await interpretNode(node, MathOps1);
  // node = await interpretNode(node, MathOps2);
  node = await interpretNode(node, InterpreterFunctions, ctx);
  node = await interpretNode(node, AudioPiping);
  return node;
}