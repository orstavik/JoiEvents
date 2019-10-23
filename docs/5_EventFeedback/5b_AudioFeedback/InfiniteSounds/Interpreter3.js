import {parse, isPrimitive} from "./Parser2.js";
import {Random} from "./LibRandom.js";
import {MathOps} from "./LibMath.js";
import {ListOps, AudioPiping} from "./LibSyntax.js";
import {InterpreterFunctions} from "./LibAudio.js";
import {Music} from "./LibMusic.js";
import {Units} from "./LibUnits.js";

async function interpretArray(node, table, ctx) {
  const clone = node.slice(0);
  for (let i = 0; i < clone.length; i++) {
    clone[i] = await interpretNode(clone[i], table, ctx);
    if (!isPrimitive(clone[i]))
      clone.isDirty = 1;
  }
  return clone;
}

export async function interpretNode(node, table, ctx) {
  if (isPrimitive(node))
    return node;
  if (node instanceof Array)
    return await interpretArray(node, table, ctx.concat([node]));
  //todo here I can do a topDown pass
  const clone = Object.assign({}, node);
  clone.body = await interpretArray(clone.body, table, ctx.concat([node]));
  const fun = table[clone.type];
  return fun ? (await fun(clone, ctx[0])) : clone;
}

//todo should all the function names in the language be small caps??
//todo This is what I am doing here.
//todo If this remains, then it would be much more efficient to lowerCase every function name in the parser.
var getInLowerCaseEveryWhere = {
  get: function (obj, prop) {
    return obj[prop.toLowerCase()];
  }
};

//todo process unit functions such as "MHz", "dB", "ms". "b" (beats), and tones must be processed dynamically.
const table1 = Object.assign({}, ListOps, Units, MathOps, Music);
const staticTable = new Proxy(table1, getInLowerCaseEveryWhere);
const table2 = Object.assign({}, Random, MathOps, InterpreterFunctions, AudioPiping);
const dynamicTable = new Proxy(table2, getInLowerCaseEveryWhere);

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