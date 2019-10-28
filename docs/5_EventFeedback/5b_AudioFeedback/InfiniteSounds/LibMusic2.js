function getAbsoluteClef(ctx) {
  for (let i = ctx.length - 1; i >= 0; i--) {
    if (ctx[i].type === "absNote")
      return ctx[i];
  }
}

function getModeClef(ctx) {
  for (let i = ctx.length - 1; i >= 0; i--) {
    if (ctx[i].mode !== undefined)
      return ctx[i];
  }
}

export const MusicStatic = Object.create(null);

MusicStatic["absNote"] = function (node, ctx) {
  if (node.frozen)
    return node;
  if (node.body.length > 0) { //clef note
    const absClef = getAbsoluteClef(ctx);
    if (absClef) {
      return {type: "~~", num: 0, body: node.body};
    } else {
      return node;
    }
  } else {                   //end note
    const absClef = getAbsoluteClef(ctx);
    const num = node.num - absClef.num + (node.octave - absClef.octave) * 12;
    return {type: "~~", num, body: node.body};
  }
};

MusicStatic["relNote"] = function (node, ctx) {
  const absClef = getAbsoluteClef(ctx);
  if (!absClef)
    throw new SyntaxError("A relative alpha note must have an absolute clef note set.");
  const num = ((node.num - absClef.num + 12) % 12) + node.octave * 12;
  return {type: "~~", num, body: node.body};
};

MusicStatic["~~"] = function (node, ctx) {
  //todo 1. we get the first parent node which has an absolute mode
  const absClef = getModeClef(ctx);
  if (!absClef)
    throw new SyntaxError("A relative alpha note must have an absolute clef note set.");
  const num = ((node.num - absClef.num + 12) % 12) + node.octave * 12;
  return {type: "~~", num, body: node.body};
};