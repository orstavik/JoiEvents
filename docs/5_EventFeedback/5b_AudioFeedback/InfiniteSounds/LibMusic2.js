
function getClef(ctx, prop) {
  for (let i = ctx.length - 1; i >= 0; i--) {
    if (prop in ctx[i])
      return ctx[i];
  }
}

function noteDistance(note, clefNote) {
  return note.num12 - clefNote.num12 + (note.octave - clefNote.octave) * 12;
}

function absNoteFunction(node, ctx) {
  if (node.body.length > 0) { //clef note
    const absClef = getClef(ctx, "absNote");
    if (absClef) {
      return {type: "~~", body: [0]};
    } else {
      return node;
    }
  } else {                   //end note
    const absClef = getClef(ctx, "absNote");
    const distance = noteDistance(node, absClef);
    return {type: "~~", body: [distance]};
  }
}

export const MusicStatic = Object.create(null);
MusicStatic["c"] = absNoteFunction;
MusicStatic["c#"] = absNoteFunction;
MusicStatic["db"] = absNoteFunction;
MusicStatic["d"] = absNoteFunction;
MusicStatic["d#"] = absNoteFunction;
MusicStatic["eb"] = absNoteFunction;
MusicStatic["e"] = absNoteFunction;
MusicStatic["f"] = absNoteFunction;
MusicStatic["f#"] = absNoteFunction;
MusicStatic["gb"] = absNoteFunction;
MusicStatic["g"] = absNoteFunction;
MusicStatic["g#"] = absNoteFunction;
MusicStatic["ab"] = absNoteFunction;
MusicStatic["a"] = absNoteFunction;
MusicStatic["a#"] = absNoteFunction;
MusicStatic["bb"] = absNoteFunction;
MusicStatic["b"] = absNoteFunction;
