function getClef(ctx, prop) {
  for (let i = ctx.length - 1; i >= 0; i--) {
    if (ctx[i].type === prop)
      return ctx[i];
  }
}

export const MusicStatic = Object.create(null);

MusicStatic["absNote"] = function (node, ctx) {
  if (node.frozen)
    return node;
  if (node.body.length > 0) { //clef note
    const absClef = getClef(ctx, "absNote");
    if (absClef) {
      return {type: "~~", num: 0, body: node.body};
    } else {
      return node;
    }
  } else {                   //end note
    const absClef = getClef(ctx, "absNote");
    const num = node.num - absClef.num + (node.octave - absClef.octave) * 12;
    return {type: "~~", num, body: node.body};
  }
};

MusicStatic["relNote"] = function (node, ctx) {
  const absClef = getClef(ctx, "absNote");
  if (!absClef)
    throw new SyntaxError("A relative alpha note must have an absolute clef note set.");
  const num = ((node.num - absClef.num + 12) % 12) + node.octave * 12;
  return {type: "~~", num, body: node.body};
};