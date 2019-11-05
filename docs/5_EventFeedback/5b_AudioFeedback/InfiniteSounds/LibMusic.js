import {MusicModes} from "./MusicModes.js";
import {isPrimitive} from "./Parser.js";

function getNoteInteger(node) {
  if (node.body.length === 2) {
    const [l, r] = node.body;
    if (l.type === "Note" && Number.isInteger(r))
      return {note: l, num: r};
  }
  return {};
}

function normalizeToAbsolute(note) {
  let [absNum, absMode, relNum12, relNum7, relMode, closed] = note.body;
  if (relNum12 === 0 && relMode === 0 && relNum7 === 0)
    return note;
  //todo I have a problem with ~0 notes as the top note. it will have 0,undefined,0,0,0,0 and it is the same as C0.
  //todo relNum7 should be undefined if not set. A ~0 without a clef should be 48,undefined,0,0,0,0
  //1. eat the relNum12. simply add the rel 12 numbers into the base
  absNum += relNum12;
  //2. eat the relMode. shift the mode position in the circle of 7 modes, and +1/-1 to the base num every time you pass +7/0.
  if (relMode) {
    let absModePos = MusicModes.getNumber(absMode);
    let nextModePos = absModePos + relMode;
    absNum += Math.floor(nextModePos / 7);
    nextModePos = ((nextModePos % 7) + 7) % 7;
    absMode = MusicModes.getName(nextModePos);
  }

  //3. eat the relNum7. shift the relative 7 numbers into the base
  if (relNum7) {
    absNum += Math.floor(relNum7 / 7) * 12;
    let next7Num = ((relNum7 % 7) + 7) % 7;
    let distanceTo7Num = MusicModes.getVector(absMode)[next7Num];
    absNum += distanceTo7Num;
  }
  return {type: "Note", body: [absNum, absMode, 0, 0, 0, closed]};
}

function normalizeToRelative(absNote, pKey, pMode) {
  let [absNum, absMode] = absNote.body;
  const shift12 = absNum - pKey;
  const {seven, twelve} = MusicModes.splitSevenTwelveScale(shift12, pMode);
  const modeModi = MusicModes.nearestModeModi(absMode, pMode);
  const res = {type: "Note", body: [0, undefined, twelve, seven, modeModi, 0]};
  // res.staticInterpretationKey = absNum;
  // res.staticInterpretationMode = absMode;
  return res;
}

function getClef(ctx) {
  for (let i = 0; i < ctx.length; i++) {
    let scope = ctx[i];
    if (scope.type === "expFun" && scope.body[0].type === "Note" && (i > 1 || ctx[i - 1] !== 0))
      return scope.body[0]
  }
  return undefined;
}

function getNoteIntegerOrModeName(node) {
  if (node.body.length === 2) {
    const [l, r] = node.body;
    if (l.type !== "Note")
      return {};
    if (Number.isInteger(r))
      return {note: l, value: r};
    if (MusicModes.isModeName(r.type))
      return {note: l, value: r.type};
  }
  return {};
}

function log2Integer(num) {
  if (num === 0)
    return num;
  if (num > 0 && Number.isInteger(num)) {
    const octave = Math.log2(num);
    if (octave === Math.floor(octave))
      return octave;
  }
  throw new SyntaxError(`Notes can only be multiplied/divided by positive integers in the log2 scale: 1,2,4,8,16,...`);
}

function changeNote(note, i, steps) {
  if (steps === 0)
    return note;
  const newNote = Object.assign({}, note);
  newNote.body = note.body.slice(0);
  newNote.body[i] += steps;
  return newNote;
}

function setMode(note, value) {
  const newNote = Object.assign({}, note);
  newNote.body = note.body.slice(0);
  newNote.body[1] = value;
  newNote.body[4] = 0;
  return newNote;
}

//all note operators require the note to be on the left hand side. It will look too complex otherwise.
export const MusicMath = Object.create(null);

//x*y multiply operator
//x*y mathematically is obvious
//and, it can be used on notes too. But, it only works on positive integers in log2 scale 1,2,4,8,16,32, etc = positiveLog2Int.
//x*y absNoteNum means: X is absNoteNum, Y is positiveLog2Int, Y == 1 ? no change : x.noteNum+=12*(log2(y))
//x*y relNote means: X is relNote, Y is positiveLog2Int, Y == 1 ? no change : x.noteNum+=7*(log2(y))
MusicMath["*"] = function (node, ctx) {
  let {note, num} = getNoteInteger(node);
  return note ? changeNote(note, 2, 12 * log2Integer(num)) : node;
};
//x/y divide operator
//x/y mathematically is obvious
//and, it can be used on notes too. But, it only works on positive integers in log2 scale 1,2,4,8,16,32, etc = positiveLog2Int.
//x/y absNoteNum means: X is absNoteNum, Y is positiveLog2Int, Y == 1 ? no change : x.noteNum+=12*(log2(y)) *-1
//x/y relNote means: X is relNote, Y is positiveLog2Int, Y == 1 ? no change : x.noteNum+=7*(log2(y)) *-1
//
//Att!! the multiply and divide operators on notes are very similar, they just go up or down.
MusicMath["/"] = function (node, ctx) {
  let {note, num} = getNoteInteger(node);
  return note ? changeNote(note, 2, -12 * log2Integer(num)) : node;
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
  if (l.type === "Note" || r.type === "Note")
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
  const {note, num} = getNoteInteger(node);
  return note ? changeNote(note, 2, num) : node;
};

MusicMath["^-"] = function (node, ctx) {
  const {note, num} = getNoteInteger(node);
  return note ? changeNote(note, 2, -num) : node;
};

//x^^y octave operator.
//x^^y mathematically means: X is num, Y is num, x*=2^y. This is done in LibMath
//x^^y absNoteNum means: X is absNoteNum, Y is int, x+=12*y
//x^^y relNote means: X is relNote, Y is int, x.relNoteNum += (7*y)

MusicMath["^^"] = function (node, ctx) {
  const {note, num} = getNoteInteger(node);
  return note ? changeNote(note, 2, 12 * num) : node;
};

//% mode operator.
//x%y mathematically means modulus remainder. This operator is not semantically related to the %-mode operator for tones.
//x%y Note
//   X is Note, Y is a modeName ("lyd", "dor", "maj", "min", etc.) => will set the absolute modename for a tone
//   X is Note, Y is an int => increments the relative modeModi
//
//the % mode operator is useful for clef Tones. It has no effect when performed on leaf Tones, as leaf nodes will
//always use the parent clef tone's mode, never its own.

MusicMath["%"] = function (node, ctx) {
  let {note, value} = getNoteIntegerOrModeName(node);
  if (!note)
    return node;
  if (typeof value === "string")
    return setMode(note, value);        //%name, sets the name of the mode and null out any mode changes.
  return changeNote(note, 4, value);  //%num, added to the modeModi parameter.
};

//! close operator
//When used as a prefix on an absNote, the ! "closes" the note.
//A closed note is a note that will not be transformed by a parent clef, neither key nor mode.

MusicMath["!"] = function (node, ctx) {
  const [nothing, note] = node.body;
  if (nothing === undefined && note && note.type === "Note")
    return normalizeToAbsolute(changeNote(note, 5, 1));
  return node;
};

function getAbsoluteToneKeyMode(clef) {
  throw new Error("NoteYet implemented");
}

MusicMath["Note"] = function (node, ctx) {
  if (ctx.length < 2 || node.body[5])     //if the note is a top note, or if it is closed, then normalize to absolute
    return normalizeToAbsolute(node);
  const clef = getClef(ctx);
  if (!clef)
    return normalizeToAbsolute(node);
  let [pKey, pMode] = clef.body;
  if (!pKey /*|| !pMode*/)
    [pKey, pMode] = getAbsoluteToneKeyMode(clef);
  return normalizeToRelative(node, pKey, pMode);
};

MusicMath["expFun"] = function (node, ctx) {
  const [key, ...body] = node.body;
  if (key.type !== "Note")
    return node;
  for (let node of body) {
    if (!isPrimitive(node))
      body.isDirty = 1;
  }
  return {type: "clef", key, body};
};

MusicMath["~"] = function (node, ctx) {
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


//what is the circle 5 point? 7/12scale abs and 4/7scale
//x^/y circle5 operator.
//x^/y mathematically means: X is num, Y is num, x*=(2^(1/12))^y  or  x*= Math.pow(Math.pow(2, 1/12), y))
//x^/y absNoteNum means: X is absNoteNum, Y is int, x.noteNum+=7*y    Att!! This does not fit with all 7scale modes.
//x^/y relNote means: X is relNote, Y is int, x.relNoteNum += (4*y)

// MusicMath["^/"] = function (node, ctx) {
//   const {note, num} = getNoteInteger(node);
//   if (!note)
//     return node;
//   if (num === 0)
//     return note;
//   const scaleType = note.type === "Note" ? 7 : 4;
//   return changeNote(note, scaleType * num);
// };