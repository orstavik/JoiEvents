// Relative clefs only works down, absolute only works up.
// Modes and keys are bound in one.
// The topmost absolute clefs, or frozen (closed) clefs, set the initial sound.

// Alpha relative notes without an absolute clef note, and a value other than ~~0 or ~0 makes no sense.
// It doesn't crash, but throws a warning and sets the value of the clef to ~0.

// Leaf notes with a mode makes no sense. It doesn't crash, but throws a warning.

// relative vs. absolute notes.
// they don't mix, it is either a relative note, or an absolute note.
// but the mode might be described as alphabetical (~2%lyd).
// And if so, I have to find the parent mode of lyd in order
// to convert lyd into mathematical clicks.

import {isPrimitive} from "./Parser.js";

function getAbsoluteClef(ctx) {
  for (let scope of ctx) {
    if (scope.type === "expFun" && scope.body[0].type === "absNoteNum")
      return scope.body[0];
  }
}

export const MusicStatic = Object.create(null);

MusicStatic["~"] = function (node, ctx) {
  const [l, r] = node.body;
  if (!Number.isInteger(r))
    throw new SyntaxError("The 7scale operator '~' must have an integer on its right side.");
  //todo handle # and b augment and diminish values for '~'
  if (l === undefined) //prefix
    return {type: "Note", body: [0, 0, 0, r, 0, 0]};
  if (!l.type || l.type !== "Note")
    throw new SyntaxError("The 7scale operator '~' must be performed on a relative note.");
  //todo and this is why we want to convert the absNoteNum to relNote in the static pass.
  const clone = Object.assign({}, l);
  clone.body = clone.body.slice(0);
  clone.body[3] += r;
  return clone;
};

//x~y 7scale operator (note operator ONLY, depends on the existence of a MODE).
//x~y mathematically, throws a SyntaxError.
//x~y absNoteNum means: X is absNoteNum, Y is int. The calculation require the tone access its mode table,
//and stepping right/left in this mode table equivalent to the distance of the x, and then adding the value to x.noteNum.
//It is unlikely that such operations will be performed much, but it can be done.
//x^/y relNote means: X is relNote, Y is int, x.relNoteNum+=y

//~y 7scale operator prefix. The default value of X is 0, ie. "~y" means the same as "0~y" statically.
//When the relNote is interpreted to produce a node, then it will look to the clef.

//Future work. Allow the 7scale-operator (~) to have a "#" or "b". or a ~1.5 to signify the sharp?
//make # into a ^+1 and b into a ^-1? yes, that is good.

//to interpret the value of a relNote, you first calculate absNoteNum value:
//the octave = note.getOctave() + parentClef.getOctave()
//the relNote is converted into an absNoteNum = parentClef.getModeTable()[relNote.num]
//the relNoteAugment is just a number (1, 0 or -1).
//absNoteNum = octave*12 + absNoteNum + relNoteAugment.
//use lookup table for verification to begin with.


// MusicStatic["absNoteNum"] = function (node, ctx) {
//   // if (node.body[2])  //todo forgot what this was
//   //   return node;
//   if (ctx[0] === 0 && ctx[1].type === "expFun")   //this is a clef note, it is handled under expFun.
//     return node;
//   //leaf note
//   const absClef = getAbsoluteClef(ctx);
//   if (!absClef)
//     return node;
//   let diff = node.body[0] - absClef.body[0];
//   const octave = Math.floor(diff / 12);
//   if (octave)
//     diff = diff % 12;
//   const sevenScaleArray = getSevenScale(absClef.body[1]);
//   const [num, sharp] = getSevenScalePosition(sevenScaleArray, diff);
//   return {type: "relNote", body: [num, octave, sharp]};
// };

const parseRelativeNotePrefix = /([+-]?\d+)|~([a-gA-G])([#b]?)([+-]?\d*)/;
//relative 7 notes: ~1, ~0b, ~6#, ~-2, ~10b, ~-11b
//todo implement this later relative alpha notes: ~C, ~d#, ~Eb, ~bb

// MusicStatic["~"] = function (node, ctx) {
//   const [l, r] = node.body;
//   if (l === undefined) {         //prefix state
//
//     //todo calculate the value based on the parent, if needed (if it is an alpha note)
//     return {type: "relNote", body:["number", "octave", "hash"]};
//   } else {
//     if (l.type === "absNoteNum"){
//       const clone = Object.assign({}, l);
//       clone.body = clone.body.slice(0);
//       shiftAbsNoteNum(clone, r);
//       return clone;
//     } else if (l.type === "relNote"){
//       const clone = Object.assign({}, l);
//       clone.body = clone.body.slice(0);
//       shiftRelNoteNum(clone, r);
//       return clone;
//     } else {
//       throw new SyntaxError("The two sided seven-scale-operator (~) must have a note on its left side and a number, or number#b on its right");
//     }
//   }
//   return node;
// };

MusicStatic["expFun"] = function (node, ctx) {
  const [note, ...clef] = node.body;
  if (node.body[0].type !== "absNoteNum")
    return node;
  const absClef = getAbsoluteClef(ctx);
  if (!absClef || node.body[0].body[3]) {
    const [num, octave, mode, frozen, text] = node.body[0].body;
    const body = node.body.slice(1);
    for (let node of body) {
      if (!isPrimitive(node))
        body.isDirty = 1;
    }
    return {type: "absClef", num, octave, mode, frozen, text, body};
  }
  const body = node.body.slice(1);
  for (let node of body) {
    if (!isPrimitive(node))
      body.isDirty = 1;
  }
  return {type: "relClef12", num: 0, body};
};


// MusicStatic["relNote"] = function (node, ctx) {
//   const absClef = getAbsoluteClef(ctx);
//   if (!absClef)
//     throw new SyntaxError("A relative alpha note must have an absolute clef note set.");
//   const num = ((node.num - absClef.num + 12) % 12) + node.octave * 12;
//   return {type: "~~", num, body: node.body};
// };

// MusicStatic["~~"] = function (node, ctx) {
//   //todo 1. we get the first parent node which has an absolute mode
//   const absClef = getModeClef(ctx);
//   if (!absClef)
//     throw new SyntaxError("A relative alpha note must have an absolute clef note set.");
//   const num = ((node.num - absClef.num + 12) % 12) + node.octave * 12;
//   return {type: "~~", num, body: node.body};
// };