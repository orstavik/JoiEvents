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

MusicStatic["absNote"] = function (node, ctx) {
  //todo convert mode names to mode numbers.
  const mode = node.body[2];
  return {type: "absNoteNum", body: [node.body[0] + node.body[1] * 12, mode, node.body[3]]};
};

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


MusicStatic["relNote"] = function (node, ctx) {
  const absClef = getAbsoluteClef(ctx);
  if (!absClef)
    throw new SyntaxError("A relative alpha note must have an absolute clef note set.");
  const num = ((node.num - absClef.num + 12) % 12) + node.octave * 12;
  return {type: "~~", num, body: node.body};
};

// MusicStatic["~~"] = function (node, ctx) {
//   //todo 1. we get the first parent node which has an absolute mode
//   const absClef = getModeClef(ctx);
//   if (!absClef)
//     throw new SyntaxError("A relative alpha note must have an absolute clef note set.");
//   const num = ((node.num - absClef.num + 12) % 12) + node.octave * 12;
//   return {type: "~~", num, body: node.body};
// };