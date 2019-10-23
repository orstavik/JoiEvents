export const Music = Object.create(null);

//todo I do a static pass bottom up for the music operators.
//todo here I only register the properties that the children will look for later.
//todo during the dynamic pass/hookup, I need to get nodes that are not yet added.

//a) static pass up: each clef node is given a ".clef = {0-11: []}" table.
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

// Units["note"] = function (node, ctx) {
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
      throw new SyntaxError("Units operator must have at least one tone as argument.");
    node.keyBeingInterpreted = key;
    ctx.activeKeys.put(key);
};
