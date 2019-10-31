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

function getNoteNumber(node) {
  if (node.body.length !== 2)
    return {};
  const {body: [l, r]} = node;
  let note, num;
  if (l.type === "absNote") {
    note = l;
    num = r;
  } else if (r.type === "absNote") {
    note = r;
    num = l;
  }
  if (typeof num !== "number" || !Number.isInteger(num))
    return {};
  if (num < 0)
    return {note, num: Math.abs(num), negate: -1};
  return {note, num, negate: 1};
}

function switchOctave(node, up, op) {
  let {note, num, negate} = getNoteNumber(node);
  if (!note)
    return node;
  if (num === 0)
    return note;
  const newNote = Object.assign({}, note);
  const addOctave = Math.log2(num);
  if (addOctave !== Math.floor(addOctave))
    throw new SyntaxError(`Note scale operation '${op}' error: Scale operations require a positive integer 0,2,4,8,16,...`);
  newNote.body[1] += addOctave * negate * up;
  return newNote;
}

function getAbsoluteClef(ctx) {
  for (let scope of ctx) {
    if (scope.type === "expFun" && scope.body[0].type === "absNote")
      return scope.body[0];
  }
}

export const MusicStatic = Object.create(null);

MusicStatic["absNote"] = function (node, ctx) {
  if (node.body[3])
    return node;
  if (ctx[0] === 0 && ctx[1].type === "expFun")   //this is a clef note, it is handled under expFun.
    return node;
  //leaf note
  const absClef = getAbsoluteClef(ctx);
  if (!absClef)
    return node;
  const num = node.body[0] - absClef.body[0] + (node.body[1] - absClef.body[1]) * 12;
  return {type: "~~", body: [num]};
};

MusicStatic["*"] = function (node, ctx) {
  return switchOctave(node, 1, "*");
};

MusicStatic["/"] = function (node, ctx) {
  return switchOctave(node, -1, "/");
};

MusicStatic["expFun"] = function (node, ctx) {
  if (node.body[0].type !== "absNote")
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

MusicStatic["~~"] = function (node, ctx) {
  //todo 1. we get the first parent node which has an absolute mode
  const absClef = getModeClef(ctx);
  if (!absClef)
    throw new SyntaxError("A relative alpha note must have an absolute clef note set.");
  const num = ((node.num - absClef.num + 12) % 12) + node.octave * 12;
  return {type: "~~", num, body: node.body};
};