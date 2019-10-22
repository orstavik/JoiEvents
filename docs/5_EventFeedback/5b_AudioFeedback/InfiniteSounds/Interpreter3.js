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

//todo process unit functions such as "MHz", "dB", "ms". "b" (beats), and tones must be processed dynamically.
const staticTable = Object.assign({}, ListOps, MathOps, Music);
//todo I do a static pass bottom up for the music operators.
//todo here I only register the properties that the children will look for later.
//todo during the dynamic pass/hookup, I need to get nodes that are not yet added.

//a) static pass up: each clef node is given a ".clef = []" table.
//b) dynamic pass up:
// A) clef nodes look at their .clef table. If this clef table only contains one other element,
// the clef node adds its mathematics to the child clef/note and return its child (ie. removes itself).
// and returns
// the clef table has twelve rows. one for each tone in the scale. It will only create as many gainNodes as it needs.

// B1) notes AND clefs with more than two dependencies create their own GainNode.
//   They set the value of this gain node to be the mathematical alteration of the notes.
//   they add their GainNode as the ".toneNode".
// B2) they then go to their .clef table and connect their ".toneNode" to all their tone children's ".toneNode"s.
// B3) they then search up the tree to find their parent clef. If a clef is found, they register themselves.
//    If not found, they create their own constant node and then fill it with their ConstantSourceNode with the given key as source, or C4 if
//    no key is given.
const dynamicTable = Object.assign({}, Random, MathOps, InterpreterFunctions, AudioPiping);

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