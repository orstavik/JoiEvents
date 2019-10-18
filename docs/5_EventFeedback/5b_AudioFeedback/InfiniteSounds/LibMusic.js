export const Music = Object.create(null);
Music.topDown = {};
Music.topDownAndBottomUp = {"~": 1};

//todo speedup is possible by mutating the note object. Here, the structure remains immutable
function morphNote(note, newKey) {
  if (note.key) {
    const clone = Object.assign({}, note);
    clone.key = newKey.tone;
    if (newKey.octave !== undefined)
      clone.octave = newKey.octave;
    return clone;
  }
  // return
}

// Music["note"] = function (node, ctx) {
//   const whichKey
// };

//if both sides are tones, right side is a key'
Music["~"] = function (node, ctx) {
  //second pass, bottomUp
  if (node.keyBeingInterpreted){
    ctx.activeKeys.remove(node.keyBeingInterpreted);
    delete node.keyBeingInterpreted;
    return;
  }
  //first pass, topDown
    const {right, left} = node;
    const key = right.type === "note" ? right : left;
    if (!key.type === "note")
      throw new SyntaxError("Music operator must have at least one tone as argument.");
    node.keyBeingInterpreted = key;
    ctx.activeKeys.put(key);
};
