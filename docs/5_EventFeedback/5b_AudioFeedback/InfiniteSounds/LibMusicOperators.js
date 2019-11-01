import {MusicModes} from "./MusicModes.js";

function isNote(node) {
  return node.type === "absNoteNum" || node.type === "relNote";
}

//Operations that alter the num and augment value of relNote require the relNote to be normalized.
//Normalization of relnote pushes the value of the num between 0 and 6, and augment between -1,0,1.
//octave changes does not require normalization.
//Normalization has the effect that augmentation of notes remain fixed when mode is changed dynamically.
//if a tone is augmented 1 up or down (out of scale) in one modality, then the augmentation will remain in place even
//as you swap modality and that modality would "ctach up" to the augmentation.

function normalizeNote(note) {
  return note.type === "absNoteNum" ? normalizeAbsNoteNum(note) : normalizeRelNote(note);
}

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
  return {type: "absNoteNum", body: [num, mode, frozen]};
}

function getNoteInteger(node) {
  if (node.body.length === 2) {
    const [l, r] = node.body;
    if (isNote(l) && Number.isInteger(r))
      return {note: l, num: r};
  }
  return {};
}

const modeNames = /maj|min|ion|lyd|loc|dor|phr|aeo|mix/;

function getNoteIntegerOrModeName(node) {
  if (node.body.length === 2) {
    const [l, r] = node.body;
    if (isNote(l) && Number.isInteger(r))
      return {note: l, value: r};
    if (isNote(l) && typeof r.type && modeNames.test(r.type))
      return {note: l, value: r.type};
  }
  return {};
}

function checkPositiveLog2Integer(num) {
  if (num === 0)
    return num;
  if (num > 0 && Number.isInteger(num)) {
    const addOctave = Math.log2(num);
    if (addOctave === Math.floor(addOctave))
      return addOctave;
  }
  throw new SyntaxError(`Notes can only be multiplied/divided by positive integers in the log2 scale: 1,2,4,8,16,...`);
}

function switchOctave(node, up) {
  let {note, num} = getNoteInteger(node);
  if (!note)
    return node;
  if (num === 0)
    return note;
  const addOctave = checkPositiveLog2Integer(num);
  const newNote = Object.assign({}, note);
  if (note.type === "absNoteNum")
    newNote.body[0] += addOctave * 12 * up;
  else if (note.type === "relNote")
    newNote.body[1] += addOctave * up;  //relNote octave doesn't require normalization
  return newNote;
}

function stepNote(node, neg) {
  const {note, num} = getNoteInteger(node);
  if (!note || num === undefined)
    return node;
  let clone = Object.assign({}, note);
  clone.body = clone.body.slice(0);
  if (note.type === "absNoteNum")
    clone.body[0] += num * neg;
  if (note.type === "relNum") {
    clone.body[2] += num * neg;
    clone = normalizeRelNote(clone);
  }
  return clone;
}


function modeShift(node, upDown) {
  let {note, value} = getNoteIntegerOrModeName(node);
  if (!note)
    return node;
  const modePos = note.type === "absNoteNum" ? 1 : 3;
  if (typeof value === "string") {
    let nextPos = MusicModes.getNumber(value);
    let nowPos = note.body[modePos];
    if (upDown > 0){
      while (nextPos < nowPos)
        nextPos +=7;
      value = nextPos - nowPos;
    } else {
      while (nextPos > nowPos)
        nextPos -=7;
      value = nowPos - nextPos;
    }
  }
  const clone = Object.assign({}, note);
  clone.body = clone.body.slice(0);
  clone.body[modePos] += value * upDown;
  return normalizeNote(clone);
}

//all note operators require the note to be on the left hand side. It will look too complex otherwise.
export const MusicMath = Object.create(null);

//x*y multiply operator
//x*y mathematically is obvious
//and, it can be used on notes too. But, it only works on positive integers in log2 scale 1,2,4,8,16,32, etc = positiveLog2Int.
//x*y absNoteNum means: X is absNoteNum, Y is positiveLog2Int, Y == 1 ? no change : x.noteNum+=12*(log2(y))
//x*y relNote means: X is relNote, Y is positiveLog2Int, Y == 1 ? no change : x.noteNum+=7*(log2(y))
//
//x/y divide operator
//x/y mathematically is obvious
//and, it can be used on notes too. But, it only works on positive integers in log2 scale 1,2,4,8,16,32, etc = positiveLog2Int.
//x/y absNoteNum means: X is absNoteNum, Y is positiveLog2Int, Y == 1 ? no change : x.noteNum+=12*(log2(y)) *-1
//x/y relNote means: X is relNote, Y is positiveLog2Int, Y == 1 ? no change : x.noteNum+=7*(log2(y)) *-1
//
//Att!! the multiply and divide operators on notes are very similar, they just go up or down.
MusicMath["*"] = function (node, ctx) {
  return switchOctave(node, 1);
};
MusicMath["/"] = function (node, ctx) {
  return switchOctave(node, -1);
};

//x+y pluss operator   (and "-"-minus)
//x+y mathematically is obvious
//one might think that it *could* mean:
//x+y absNoteNum means: X is absNoteNum, Y is int, x.noteNum+=y    Att!! This might not be workable.
//x+y relNote means: X is relNote, Y is int, x.relNoteNum+=y

//But. This would yield a dramatically different result if you passed in a note as a frequency number.
//Example:
// Math: 440+1=441                        (freq 441)
// AbsNote: A4+1=A#4                      (freq 466)
// RelNote (in C4ionian/major): A4+1=B4   (freq 493)
//
//Therefore, +/- doesn't work on notes. It will cause a syntax error.
//Instead, there are is another operator that works the same for all three: ^+ (and ^-).

MusicMath["+"] = MusicMath["-"] = function (node, ctx) {
  let [l, r] = node.body;
  if (isNote(l) || isNote(r))
    throw new SyntaxError("Notes cannot be added or subtracted. Use the ^+ or ^- or ~ to do note step operations.");
};

//x^+y absolute tone step. (and ^-)
//x^+y mathematically means: X is num, Y is num, x*=2^(y/12)  or  x*= Math.pow(2, y/12)
//x^+y absNoteNum means: X is absNoteNum, Y is int, x.noteNum+=y
//x^+y relNote means: X is relNote, Y is int, x.relNoteAUGMENT+=y
// These operations will yield the same outcome.
// Math: 440^+1=441                        (freq 466)
// AbsNote: A4^+1=A#4                      (freq 466)
// RelNote (in C4ionian/major): A4^+1=A#4  (freq 466)

MusicMath["^+"] = function (node, ctx) {
  return stepNote(node, 1);
};

MusicMath["^-"] = function (node, ctx) {
  return stepNote(node, -1);
};

//x^^y octave operator.
//x^^y mathematically means: X is num, Y is num, x*=2^y. This is done in LibMath
//x^^y absNoteNum means: X is absNoteNum, Y is int, x+=12*y
//x^^y relNote means: X is relNote, Y is int, x.relNoteNum += (7*y)

MusicMath["^^"] = function (node, ctx) {
  const {note, num} = getNoteInteger(node);
  if (!note || num === undefined)
    return node;
  const clone = Object.assign({}, note);
  clone.body = clone.body.slice(0);
  if (note.type === "absNoteNum")
    clone.body[0] += num * 12;
  if (note.type === "relNum")
    clone.body[1] += num;
  return clone;
};

//what is the circle 5 point? 7/12scale abs and 4/7scale

//x^/y circle5 operator.
//x^/y mathematically means: X is num, Y is num, x*=(2^(1/12))^y  or  x*= Math.pow(Math.pow(2, 1/12), y))
//x^/y absNoteNum means: X is absNoteNum, Y is int, x.noteNum+=7*y    Att!! This does not fit with all 7scale modes.
//x^/y relNote means: X is relNote, Y is int, x.relNoteNum += (4*y)

MusicMath["^/"] = function (node, ctx) {
  const {note, num} = getNoteInteger(node);
  if (!note || num === undefined)
    return node;
  let clone = Object.assign({}, note);
  clone.body = clone.body.slice(0);
  if (note.type === "absNoteNum")
    clone.body[0] += num * 7;
  if (note.type === "relNum") {
    clone.body[0] += num * 4;
    clone = normalizeRelNote(clone);
  }
  return clone;
};

//% mode operator.  and %- for stepping down.
//x%y mathematically means modulus remainder. This operator is not semantically related to the %-mode operator for tones.
//x%y absNoteNum means the same for absNoteNum and relNote:
//   X is Note, Y is +-int or +-modeName ("lydian", "-major", "lyd", "-min", etc.)
//   the prefix +/- tells the tone to step up or down as many steps or until it gets to the mode with the same name.
//   for each step, an int is added or subtracted to different points in the actualModeTable.

// %mode operator is useful for clefs. It has no effect when performed on leaf nodes, as leaf nodes interpret the value
// of their relative note num based on the parent clef's mode, not their own.

MusicMath["%"] = function (node, ctx) {
  return modeShift(node, 1);
};

MusicMath["%-"] = function (node, ctx) {
  return modeShift(node, -1);
};