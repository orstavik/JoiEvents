import {MusicModes} from "./MusicModes.js";

function getNoteInteger(node) {
  if (node.body.length === 2) {
    const [l, r] = node.body;
    if (l.type === "absNote" || l.type === "relNote" && Number.isInteger(r))
      return {note: l, num: r};
  }
  return {};
}

function normalizeToAbs(absNote, relNote) {
  let [absNum, absMode] = absNote.body;
  let [relNum12, relMode, relNum7] = relNote.body;
  absNum += relNum12;
  if (relNum7)
    absNum += MusicModes.toTwelve(absMode, relNum7);
  if (relMode) {
    const [nextMode, hashes] = MusicModes.switchMode(absMode, relMode);
    absNum += hashes;
    absMode = nextMode;
  }
  return {type: "absNote", body: [absNum, absMode]};
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

function changeNote(note, steps) {
  if (steps === 0)
    return note;
  const newNote = Object.assign({}, note);
  newNote.body = note.body.slice(0);
  newNote.body[0] += steps;
  return newNote;
}

function findNearestAbsoluteClef(ctx) {
  for (let scope of ctx) {
    const key = scope.key || scope.body[0];
    if (key && key.type === "absNote")
      return key.body;
    if (key && key.type === "!")
      return ctx[0].key.body;
  }
  throw new Error("Wtf, the context is lacking a key!!")
}

function computeRelativeSubtracts(ctx) {
  let res = [0, 0, 0];
  for (let scope of ctx) {
    const key = scope.key || scope.body[0];
    if (!key)
      continue;
    if (key.type === "absNote")
      return res;
    if (key.type === "relNote") {
      res[0] += key.body[0];
      res[1] += key.body[1];
      res[2] += key.body[2];
    }
  }
  throw new Error("omg");
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
  return note ? changeNote(note, 12 * log2Integer(num)) : node;
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
  return note ? changeNote(note, -12 * log2Integer(num)) : node;
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
  if (l.type === "relNote" || r.type === "relNote" || l.type === "absNote" || r.type === "absNote")
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
  return note ? changeNote(note, num) : node;
};

MusicMath["^-"] = function (node, ctx) {
  const {note, num} = getNoteInteger(node);
  return note ? changeNote(note, -num) : node;
};

//x^^y octave operator.
//x^^y mathematically means: X is num, Y is num, x*=2^y. This is done in LibMath
//x^^y absNoteNum means: X is absNoteNum, Y is int, x+=12*y
//x^^y relNote means: X is relNote, Y is int, x.relNoteNum += (7*y)

MusicMath["^^"] = function (node, ctx) {
  const {note, num} = getNoteInteger(node);
  return note ? changeNote(note, 12 * num) : node;
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
  let {note, num} = getNoteInteger(node);
  if (!note)
    return node;
  if (note.type === "absNote") {
    const [nextMode, hashes] = MusicModes.switchMode(note.body[1], num);
    const clone = Object.assign({}, note);
    clone.body = clone.body.slice();
    clone.body[0] += hashes;
    clone.body[1] = nextMode;
    return clone;
  } else if (note.type === "relNote") {
    const newNote = Object.assign({}, note);
    newNote.body = note.body.slice(0);
    newNote.body[1] += num;
    return newNote;
  }
};

//! root key operator
//When used as a prefix on a Note or relNote, the ! closes the note.
//A closed note is a note that will not be transformed by a parent clef, neither key nor mode.

MusicMath["!"] = function (node, ctx) {
  let [nothing, note] = node.body;
  if (nothing !== undefined || !note)
    return node;
  const documentKey = ctx[ctx.length - 1].key;
  if (note.type === "Note")
    return {type: "absNote", body: [note.body[0], note.body[1] || documentKey.body[1]]};
  if (note.type === "relNote")
    return normalizeToAbs(documentKey, note);
  return node;
};

MusicMath["Note"] = function (node, ctx) {
  if (ctx[0].type === "!")                 //if it is a child of "!" close opertor, process under "!"
    return node;
  let [num12, mode] = node.body;
  const [keyNum, keyMode] = findNearestAbsoluteClef(ctx);
  num12 -= keyNum;
  let modeModi = MusicModes.absoluteModeDistance(keyMode, mode);
  let {seven, twelve} = MusicModes.toSeven(keyMode, num12);
  const relativeSubtracts = computeRelativeSubtracts(ctx);
  twelve -= relativeSubtracts[0];
  modeModi -= relativeSubtracts[1];
  seven -= relativeSubtracts[2];
  return {type: "relNote", body: [twelve, modeModi, seven]};
};

MusicMath["expFun"] = function (node, ctx) {
  const [key, ...body] = node.body;
  return key.type === "relNote" || key.type === "absNote" ?
    {type: "clef", key, body} :
    node;
};

MusicMath["~"] = function (node, ctx) {
  const [l, r] = node.body;
  if (!Number.isInteger(r))
    throw new SyntaxError("The 7scale operator '~' must have an integer on its right side.");
  //todo handle # and b augment and diminish values for '~'
  if (l === undefined) //prefix
    return {type: "relNote", body: [0, 0, r]};
  if (!l.type)
    throw new SyntaxError("The 7scale operator '~' must be performed on a relative or absolute note.");
  if (l.type === "absNote") {
    const clone = Object.assign({}, l);
    clone.body[0] += MusicModes.toTwelve(clone.body[1], r);
    return clone;
  }
  if (l.type === "relNote") {
    const clone = Object.assign({}, l);
    clone.body[2] += r;
    return clone;
  }
  throw new SyntaxError("The 7scale operator '~' must be performed on a relative or absolute note.");
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