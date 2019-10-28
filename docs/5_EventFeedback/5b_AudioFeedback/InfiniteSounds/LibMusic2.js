function getClef(ctx, prop) {
  for (let i = ctx.length - 1; i >= 0; i--) {
    if (ctx[i].type === prop)
      return ctx[i];
  }
}

function noteDistance(note, clefNote) {
  return note.num - clefNote.num + (note.octave - clefNote.octave) * 12;
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
    const num = noteDistance(node, absClef);
    return {type: "~~", num, body: node.body};
  }
};