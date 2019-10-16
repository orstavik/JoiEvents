import {parse} from "./Parser2.js";

export const ListOps = Object.create(null);

ListOps["()"] = function (node, body) {
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

ListOps["[]"] = function (node, body) {
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

ListOps[":"] = function (node, left, right) {
  if (!right || !(right instanceof Array))
    return [left, right];
  right.unshift(left);
  return right;
};

export const MathOps = Object.create(null);
MathOps["+"] = function (node, left, right) {
  if (typeof left === "number" && typeof right === "number")
    return left + right;
  return node;
};

function interpretExpression(node, table) {
  const type = node.type;
  const left = interpretNode(node.left, table);
  const right = interpretNode(node.right, table);
  const fun = table[type];
  if (fun)
    return fun(node, left, right);
  return right === node.right ? node : {type, left, right};
}

function interpretBody(node, table) {
  const type = node.type;
  const fun = table[type];
  let body = interpretNode(node.body, table);
  if (fun)
    return fun(node, body);
  return body === node.body ? body : {type, body};
}

function interpretArray(node, table) {
  const res = [];
  let mutated = false;
  for (let item of node) {
    const interpretedItem = interpretNode(item, table);
    if (interpretedItem !== item)
      mutated = true;
    res.push(interpretedItem);
  }
  return mutated ? res : node;
}

export function interpretNode(node, table) {
  if (!node)
    return;
  if (node instanceof Array)
    return interpretArray(node, table);
  if (node.left || node.right)
    return interpretExpression(node, table);
  if (node.body)
    return interpretBody(node, table);
  const fun = table[node.type];
  return fun ? fun(node) : node;
}

export function staticInterpret(str) {
  let node = parse(str);
  for (let table of [ListOps, MathOps])
    node = interpretNode(node, table);
  return node;
}