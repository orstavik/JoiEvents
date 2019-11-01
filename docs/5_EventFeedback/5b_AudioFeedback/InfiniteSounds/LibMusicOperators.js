//x^^y octave operator.
//x^^y mathematically means: X is num, Y is num, x*=2^y
//x^^y absNoteNum means: X is absNoteNum, Y is int, x+=12*y
//x^^y relNote means: X is relNote, Y is int, x.relNoteNum += (7*y)

//x^/y circle5 operator.
//x^/y mathematically means: X is num, Y is num, x*=(2^(1/12))^y  or  x*= Math.pow(Math.pow(2, 1/12), y))
//x^/y absNoteNum means: X is absNoteNum, Y is int, x.noteNum+=7*y    Att!! This might not be workable.
//x^/y relNote means: X is relNote, Y is int, x.relNoteNum += (4*y)

//
//
//x^+y absolute tone step. (and ^-)
//x^+y mathematically means: X is num, Y is num, x*=2^(y/12)  or  x*= Math.pow(2, y/12)
//x^+y absNoteNum means: X is absNoteNum, Y is int, x.noteNum+=y
//x^+y relNote means: X is relNote, Y is int, x.relNoteAUGMENT+=y
// These operations will yield the same outcome.
// Math: 440^+1=441                        (freq 466)
// AbsNote: A4^+1=A#4                      (freq 466)
// RelNote (in C4ionian/major): A4^+1=A#4  (freq 466)
//
//x~y 7scale operator (note operator ONLY, depends on the existence of a MODE).
//x~y mathematically, throws a SyntaxError.
//x~y absNoteNum means: X is absNoteNum, Y is int. The calculation require the tone access its mode table,
//and stepping right/left in this mode table equivalent to the distance of the x, and then adding the value to x.noteNum.
//It is unlikely that such operations will be performed much, but it can be done.
//x^/y relNote means: X is relNote, Y is int, x.relNoteNum+=y

//~y 7scale operator prefix. The default value of X is 0, ie. "~y" means the same as "0~y" statically.
//When the relNote is interpreted to produce a node, then it will look to the clef.

//ATT!! Any operation on relNoteNum and relNoteAugment will cause a calculation inside the relNote to sync/update the
// .relNoteNum, .relNoteOctave, .relNoteAugment
// absNoteNum objects are not as sensitive for this, as they only contain a single value.

//Future work. Allow the 7scale-operator (~) to have a "#" or "b". or a ~1.5 to signify the sharp?
//make # into a ^+1 and b into a ^-1? yes, that is good.

//% mode operator.
//x%y mathematically means modulus remainder. This operator is not semantically related to the %-mode operator for tones.
//x%y absNoteNum means the same for absNoteNum and relNote:
//   X is Note, Y is +-int or +-modeName ("lydian", "-major", "lyd", "-min", etc.)
//   the prefix +/- tells the tone to step up or down as many steps or until it gets to the mode with the same name.
//   for each step, an int is added or subtracted to different points in the actualModeTable.
//   If actualModeTable[0] !== 0, then the actualModeTable is normalized using its initial value, and the difference is
//   either added or subtracted to the absNoteNum or the relNoteAugment.

// %mode operator is useful for clefs. It has no effect when performed on leaf nodes, as leaf nodes interpret the value
// of their relative note num based on the parent clef's mode, not their own.

//to interpret the value of a relNote, you first calculate absNoteNum value:
//the octave = note.getOctave() + parentClef.getOctave()
//the relNote is converted into an absNoteNum = parentClef.getModeTable()[relNote.num]
//the relNoteAugment is just a number (1, 0 or -1).
//absNoteNum = octave*12 + absNoteNum + relNoteAugment.
//use lookup table for verification to begin with.

function isNote(node) {
  return node.type === "absNoteNum" || node.type === "relNote";
}

function getNoteAndNumber(node) {
  if (node.body.length !== 2)
    return {};
  const [l, r] = node.body;
  if (isNote(l) && Number.isInteger(r))
    return {note: l, num: r};
  if (Number.isInteger(l) && isNote(r))
    return {note: r, num: l};
  return {};
}

function checkPositiveLog2Integer(num) {
  const addOctave = Math.log2(num);
  if (addOctave !== Math.floor(addOctave))
    throw new SyntaxError(`Notes can only be multiplied/divided by positive integers in the log2 scale: 1,2,4,8,16,...`);
  return addOctave;
}

function switchOctave(node, up) {
  let {note, num} = getNoteAndNumber(node);
  if (!note)
    return node;
  if (num === 0)
    return note;
  const addOctave = checkPositiveLog2Integer(num);
  const newNote = Object.assign({}, note);
  if (note.type === "absNoteNum")
    newNote.body[0] += addOctave * 12 * up;
  else if (note.type === "relNote")
    newNote.body[1] += addOctave * up;
  return newNote;
}

function switchTone(node, up) {
  let {note, num, negate} = getNoteAndNumber(node);
  if (!note)
    return node;
  if (num === 0)
    return note;
  num *= negate;
  const newNote = Object.assign({}, note);
  if (note.type === "absNote") {
    newNote.body[0] += num * up;
    if (newNote.body[0] > 11 || newNote.body[0] < 0) {
      newNote.body[1] += Math.floor(newNote.body[0] / 12)
      newNote.body[0] = newNote.body[0] % 12;
    }
  } else if (note.type === "~~")
    newNote.body[0] += num * up;
  return newNote;
}

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

//x^^y octave operator.
//x^^y mathematically means: X is num, Y is num, x*=2^y
//x^^y absNoteNum means: X is absNoteNum, Y is int, x+=12*y
//x^^y relNote means: X is relNote, Y is int, x.relNoteNum += (7*y)

MusicMath["^^"] = function (node, ctx) {
  let [l, r] = node.body;
  if (typeof r !== "number")
    throw new SyntaxError("^^ the scale operator must have an integer operand.");
  if (typeof l === "number")
    return l *= Math.pow(2, r);
  if (l.type !== "absNoteNum" && l.type === "relNote")
    throw new SyntaxError("^^ the scale operator must be performed on either a number or a note.");
  if (!Number.isInteger(r))
    throw new SyntaxError("^^ the scale operator must have an integer operand when performed on a note.");
  if (l.type === "absNoteNum") {
    const res = Object.assign({}, l);
    res.num += 12 * r;
    return res;
  }
  const res = Object.assign({}, l);
  res.num += 7 * r;
  return res;
};