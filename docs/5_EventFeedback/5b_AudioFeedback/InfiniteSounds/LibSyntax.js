import {isPrimitive} from "./Parser.js";

export const ListOps = Object.create(null);

function reduceList(left, right, isLast, type) {
  let body;
  if (left && left.type === type + "[]") {
    body = left.body;
    body.push(right);
  } else {
    body = [left, right];
  }
  if (isLast) {
    for (let item of body) {
      if (!isPrimitive(item))
        return {type: "[]", body};
    }
    return body;
  }
  return {type: type + "[]", body};
}

ListOps[":"] = function ({body: [left, right]}, ctx) {
  return reduceList(left, right, !ctx.length || ctx[0].type !== ":", ":");
};

ListOps["|"] = function ({body: [left, right]}, ctx) {
  return reduceList(left, right, !ctx.length || ctx[0].type !== "|", "|");
};

ListOps["[]"] = function (node, ctx) {
  for (let item of node.body) {
    if (!isPrimitive(item))
      return node;
  }
  return node.body;
};

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
export const AudioPiping = Object.create(null);
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