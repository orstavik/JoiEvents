import {parse} from "./Parser2.js";
import {Random} from "./LibRandom.js";
import {MathOps1, MathOps2} from "./LibMath.js";
import {ListOps} from "./LibSyntax.js";

function interpretExpressionArgs(node, table) {
  const left = interpretNode(node.left, table);
  const right = interpretNode(node.right, table);
  return left === node.left && right === node.right ?
    node :
    {type: node.type, left, right};
}

function interpretBody(node, table) {
  let body = interpretNode(node.body, table);
  if (body.type === "()")
    body = body.body;
  return body === node.body ? node : {type: node.type, body};
}

function interpretArray(node, table) {
  const res = [];
  let mutated = false;
  for (let item of node) {
    let interpretedItem = interpretNode(item, table);
    if (interpretedItem !== item)
      mutated = true;
    res.push(interpretedItem);
  }
  return mutated ? res : node;
}

export function interpretNode(node, table) {
  if (!node)
    return node;
  if (node instanceof Array)
    return interpretArray(node, table);
  let fun = table[node.type];
  if (fun && table.topDown[node.type]) {
    const res = fun(node);   //todo this might produce a new node, even a new node type to be interpreted
    if (res !== node)
      return interpretNode(res, table);     //if the ltr operation triggers, then the result of that operation needs to be interpreted from scratch as it might contain a new ltr
    //if its the same, then the arguments needs to be processed
    node = res;
  }
  if (node.left || node.right)
    node = interpretExpressionArgs(node, table);
  if (node.body)
    node = interpretBody(node, table);
  return fun ? fun(node) : node;
}

export function staticInterpret(str) {
  let node = parse(str);
  for (let table of [ListOps, MathOps1, MathOps2])
    node = interpretNode(node, table);
  //variables
  //cache
  for (let table of [Random])
    node = interpretNode(node, table);

  return node;
}