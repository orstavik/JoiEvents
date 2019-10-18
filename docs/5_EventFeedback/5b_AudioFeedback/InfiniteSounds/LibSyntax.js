export const ListOps = Object.create(null);
ListOps.topDown = {":": 1};

ListOps[":"] = function ({left, right}) {
  const res = [left];
  while (right && right.type === ":") {
    res.push(right.left);
    right = right.right;
  }
  res.push(right);
  return res;
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
AudioPiping.topDown = {/*">": 1*/};

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
  if (!node.left)
    throw new SyntaxError("'>' pipe must have an input. ", node);
  if (!node.right)
    throw new SyntaxError("'>' pipe must have an input. ", node);
  const left = (node.left instanceof Array) ? extractAudioArray(node.left, "output") : node.left.output;
  const right = (node.right instanceof Array) ? extractAudioArray(node.right, "input") : node.right.input;
  connectMtoN(left, right);
  const endOutput = node.right.endOutput || right;
  return {graph: node, input: left, output: right, endOutput};
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