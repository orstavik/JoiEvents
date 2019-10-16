import {parse} from "./Parser2.js";

export const ListOps = Object.create(null);

ListOps["()"] = function ({body}) {
  return {type: "()", body: ListOps["[]"](node, body)};
};


function commaTreeToArray(body) {
  const res = [];
  let ops = [];
  for (let root = body; root !== undefined; root = root.right) {
    ops.push(root);
    if (root.type === ",") {
      res.push(ops);
      ops = [];
    }
  }
  res.push(ops);
  return res;
}

ListOps["[]"] = function ({body}) {
  if (!body)
    return [];
  if (!body.left && !body.right)            //no operators, single body
    return [body];
  const res = commaTreeToArray(body);
  for (let i = 0; i < res.length - 1; i++) {
    const row = res[i].map(node => Object.assign({}, node));
    if (row[row.length - 1].type === ",")                   //replace the comma with the left side of the comma
      row[row.length - 1] = row[row.length - 1].left;
    for (let j = 0; j < row.length - 1; j++)                //update the links in the clone that is needed to avoid mutations
      row[j].right = row[j + 1];
    res[i] = row;
  }
  return res.map(row => row[0]);
};

ListOps[":"] = function ({left, right}) {
  if (!right || !(right instanceof Array))
    return [left, right];
  right.unshift(left);
  return right;
};

export const MathOps = Object.create(null);
MathOps["+"] = function (n) {
  if (typeof n.left === "number" && typeof n.right === "number")
    return n.left + n.right;
  if (typeof n.left === "string" && typeof n.right === "string")
    return n.left + n.right;
  //if there are two quotes, then merge it into a single quote.
  //if there are two notes?
  //if there are two names without body, merge into a single name
  return n;
};

//priorities, first the setting of musical keys
//1. ~= setting the key
//2. ^^ morphing the scale
//2. ^~ morphing the key circle of fifth
//2. ^~~ morphing the mode
//3. up a tone in the scale of

MathOps["-"] = function (n) {
  if (typeof n.left === "number" && typeof n.right === "number")
    return n.left - n.right;
  //todo research regex for strings -, do a replace //g with the right side argument?
  //if there are two notes?
  return n;
};

MathOps["*"] = function (n) {
  if (typeof n.left === "number" && typeof n.right === "number")
    return n.left * n.right;
  //if there are two notes?
  return n;
};

MathOps["/"] = function (n) {
  if (typeof n.left === "number" && typeof n.right === "number")
    return n.left / n.right;
  //if there are two notes?
  return n;
};

MathOps["^"] = function (n) {
  if (typeof n.left === "number" && typeof n.right === "number")
    return Math.pow(n.left, n.right);
  //if there are two notes?
  return n;
};

MathOps["^^"] = function (n) {
  if (typeof n.left === "number" && typeof n.right === "number")
    return n.left * Math.pow(2, n.right);
  // if (typeof n.left.type === "note" && typeof n.right.type === "number") //todo
  //   return left up right octaves;                                        //todo
  return n;
};
MathOps["^*"] = function (n) {
  if (typeof n.left === "number" && typeof n.right === "number")
    return n.left * Math.pow(1.5, n.right);
  // if (typeof n.left.type === "note" && typeof n.right.type === "number") //todo
  //   return note left turned right on the circle of fifth;                //todo
  return n;
};
/*
MathOps["^~"] = function (n) {
  // if (typeof n.left.type === "note" && typeof n.right.type === "number") //todo
  //   return note left turned right on the mode scale;                //todo
  return n;
};

MathOps["^+"] = function (n) {
  if (typeof n.left === "number" && typeof n.right === "number")
    return n.left * Math.pow(1.5, n.right);
  // if (typeof n.left.type === "note" && typeof n.right.type === "number") //todo
  //   return note left turned right on the mode scale;                //todo
  return n;
};
*/

function interpretExpressionArgs(node, table) {
  const left = interpretNode(node.left, table);
  const right = interpretNode(node.right, table);
  return left === node.left && right === node.right ?
    node :
    {type: node.type, left, right};
}

function interpretBody(node, table) {
  const body = interpretNode(node.body, table);
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
  if (node.left || node.right)
    node = interpretExpressionArgs(node, table);
  if (node.body)
    node = interpretBody(node, table);
  const fun = table[node.type];
  return fun ? fun(node) : node;
}

export function staticInterpret(str) {
  let node = parse(str);
  for (let table of [ListOps, MathOps])
    node = interpretNode(node, table);
  return node;
}