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
import {MusicModes} from "./MusicModes";

function getAbsoluteClef(ctx) {
  for (let scope of ctx) {
    if (scope.type === "expFun" && scope.body[0].type === "absNoteNum")
      return scope.body[0];
  }
}

export const MusicStatic = Object.create(null);


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

// MusicStatic["expFun"] = function (node, ctx) {
//   const [note, ...clef] = node.body;
//   if (node.body[0].type !== "absNoteNum")
//     return node;
//   const absClef = getAbsoluteClef(ctx);
//   if (!absClef || node.body[0].body[3]) {
//     const [num, octave, mode, frozen, text] = node.body[0].body;
//     const body = node.body.slice(1);
//     for (let node of body) {
//       if (!isPrimitive(node))
//         body.isDirty = 1;
//     }
//     return {type: "absClef", num, octave, mode, frozen, text, body};
//   }
//   const body = node.body.slice(1);
//   for (let node of body) {
//     if (!isPrimitive(node))
//       body.isDirty = 1;
//   }
//   return {type: "relClef12", num: 0, body};
// };


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


function modeShift(node, upDown) {
  let {note, value} = getNoteIntegerOrModeName(node);
  if (!note)
    return node;
  const modePos = note.type === "Note" ? 1 : 3;
  if (typeof value === "string") {
    let nextPos = MusicModes.getNumber(value);
    let nowPos = note.body[modePos];
    if (upDown > 0) {
      while (nextPos < nowPos)
        nextPos += 7;
      value = nextPos - nowPos;
    } else {
      while (nextPos > nowPos)
        nextPos -= 7;
      value = nowPos - nextPos;
    }
  }
  const clone = Object.assign({}, note);
  clone.body = clone.body.slice(0);
  clone.body[modePos] += value * upDown;
  if (clone.type === "Note")
    return normalizeAbsNoteNum(clone);
  return clone;
  // return normalizeNote(clone);
}


//Operations that alter the num and augment value of relNote require the relNote to be normalized.
//Normalization of relnote pushes the value of the num between 0 and 6, and augment between -1,0,1.
//octave changes does not require normalization.
//Normalization has the effect that augmentation of notes remain fixed when mode is changed dynamically.
//if a tone is augmented 1 up or down (out of scale) in one modality, then the augmentation will remain in place even
//as you swap modality and that modality would "ctach up" to the augmentation.

function normalizeRelNote(relNote, modeArray) {
  let [num, octave, augment, mode] = relNote.body;
  //0. mode to augment
  while (mode > 7) {
    mode -= 7;
    augment += 1;
  }
  while (mode < 7) {
    mode += 7;
    augment -= 1;
  }
  //1. augment to octave
  while (augment > 12) {
    augment -= 12;
    octave += 1;
  }
  while (augment < 0) {
    augment += 12;
    octave -= 1;
  }
  //2. augment to num
  while (augment > 0) {
    let relNoteAbsValue = modeArray[num % 7] + Math.floor(num / 7) * 12;
    let nextRelNoteAbsValue = modeArray[(num + 1) % 7] + Math.floor((num + 1) / 7) * 12;
    let nextStepDistance = nextRelNoteAbsValue - relNoteAbsValue;
    if (augment < nextStepDistance)
      break;
    num += 1;
    augment -= nextStepDistance;
  }
  while (augment < 0) {
    let relNoteAbsValue = modeArray[num % 7] + Math.floor(num / 7) * 12;
    let nextRelNoteAbsValue = modeArray[(num + 6) % 7] + Math.floor((num - 1) / 7) * 12;
    let nextStepDistance = nextRelNoteAbsValue - relNoteAbsValue;
    if (augment > nextStepDistance)
      break;
    num -= 1;
    augment += nextStepDistance;
  }
  //3. num to octave
  while (num > 7) {
    num -= 7;
    octave += 1;
  }
  while (num < 0) {
    num += 7;
    octave -= 1;
  }
  return {type: "relNote", body: [num, octave, augment]};
}

//absNoteNum needs normalization when mode switches goes beyond 7 or below 0
//If actualModeTable[0] !== 0, then the actualModeTable is normalized using its initial value, and the difference is
//either added or subtracted to the absNoteNum or the relNoteAugment.
function normalizeAbsNoteNum(note) {
  let [num, mode, frozen] = note.body;
  while (mode > 7) {
    mode -= 7;
    num += 1;
  }
  while (mode < 0) {
    mode += 7;
    num -= 1;
  }
  return {type: "Note", body: [num, mode, frozen]};
}