import {isPrimitive} from "./Parser.js";

export const ListOps = Object.create(null);

function reduceList(left, right, isLast) {
  if (left.todo) {
    left.push(right);
    if (!isPrimitive(right))
      left.isDirty = 1;
    if (isLast)
      delete left.todo;
    return left;
  }
  const res = [left, right];
  if (!isLast)
    res.todo = 1;
  if (!isPrimitive(left) || !isPrimitive(right))
    res.isDirty = 1;
  return res;
}

ListOps[":"] = function ({body: [left, right]}, ctx) {
  return reduceList(left, right, !(ctx.length>1 && ctx[1].type === ":"));
};

ListOps["|"] = function ({body: [left, right]}, ctx) {
  return reduceList(left, right, !(ctx.length>1 && ctx[1].type === "|"));
};

function connectMtoN(a, b) {
  if (a instanceof Array) {
    for (let x of a)
      connectMtoN(x, b);
    return;
  }
  if (b instanceof Array) {
    for (let y of b)
      connectMtoN(a, y);
    return;
  }
  a.connect(b);
}

export const AudioPiping = Object.create(null);

function extractAudioArray(node, outputInput) {
  return node.flat(Infinity).map(node => {
    if (node[outputInput])
      return node[outputInput];
    throw new SyntaxError(`Cannot > pipe from something that doesn't have an audio ${outputInput} stream.`, node);
  });
}

//Arrays are flattened
//   [[a,b],c] > d
//   equals
//   [a,b,c] > d
AudioPiping[">"] = function (node, ctx) {
  if (!node.body[0])
    throw new SyntaxError("'>' pipe must have an input. ", node);
  if (!node.body[1])
    throw new SyntaxError("'>' pipe must have an input. ", node);
  const left = (node.body[0] instanceof Array) ? extractAudioArray(node.body[0], "output") : node.body[0].output;
  const right = (node.body[1] instanceof Array) ? extractAudioArray(node.body[1], "input") : node.body[1].input;
  connectMtoN(left, right);
  const ogInput = node.body[0].ogInput || left;
  return {graph: node, input: left, output: right, ogInput};
};

//this doesn't really mean anything special, as the > is normally processed ltr
// a > (b > c > d).
//You can write it, no problem, but it will just run the same as if you wrote
// a > b > c > d.

//this doesn't really mean anything either.
// (a > b ) > c.
//You can write it, no problem, but it will just produce the same output as if you wrote
// a > b > c.

//If you try to "x >(y, z)" or "(x, y) > z", the piping function will throw an error.
//todo should this error be moved to the Parser? Likely yes..
AudioPiping["()"] = function (node, ctx) {
  if (node.body.length !== 1)
    throw new SyntaxError("Cannot pipe audio into a ()-block with commas.");
  return {graph: node, input: node.body[0].input, output: node.body[0].output};
};

//todo parse body here..
//todo fix handle ()-blocks

//todo untested
// function addDelay(ctx, count, beat, left) {
//   if (count === 0)
//     return left;
//   const delay = ctx.createDelay(count * beat);
//   connectMtoN(left, delay);
//   return delay;
// }

//todo untested
// AudioPiping["bpm"] = function (ctx, bpm, heavy, barTree) {
//   if (barTree.type !== "|")
//     throw new SyntaxError("bpm must have a bar-tree: " + barTree);
//   const beat = 60 / bpm;
//   const bars = [];
//   for (let count = 0, root = barTree; root && root.type === "|"; count++, root = root.right)
//     bars.push(addDelay(ctx, count, beat, barTree.left));
//todo here I need to return a more complex object
// return bars;
// };
//

//todo mutates the node..
AudioPiping["bpm"] = function (node, ctx) {
  let [bpm, heavy, bars] = node.body;
  if (!(bars instanceof Array))
    throw new SyntaxError("cannot run bpm without any bars.. for now.");
  // node.body[2] = [bars];
  // const beatS = 60 / bpm;
  // const delayMS = beatS * 1000;
  // const bars = bars;
  // for (let count = 0, root = barTree; root && root.type === "|"; count++, root = root.right)
  //   bars.push(addDelay(ctx, count, beat, barTree.left));
  return node;
};