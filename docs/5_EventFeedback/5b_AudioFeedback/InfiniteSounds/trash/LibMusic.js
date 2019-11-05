export const MusicStatic = Object.create(null);

//a) static pass up: each clef node is given a ".clef = {0-11: []}" table.
/*
MusicStatic["~"] = function (node, ctx) {
  const clone = Object.assign({}, node);
  const {body: [key]} = node;
  clone.clefKey = key;
  clone.clef = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
    8: [],
    9: [],
    10: [],
    11: []
  };
  return clone;
};
MusicStatic["clef"] = MusicStatic["~"];
*/

export const MusicDynamic = Object.create(null);

function getClef(ctx, prop) {
  for (var i = ctx.length - 1; i >= 1; i--) {
    if (ctx[i].type === "~" && (prop === undefined || ctx[i].body[0].type === "absNote"))
      return [ctx[i], ctx[i].body[0]];
  }
  return [undefined, undefined];
}

// const twelve = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteDistance(note, clefNote) {
  return note.num - clefNote.num + (note.octave - clefNote.octave) * 12;
}

//todo start keys
//todo then, move introduce modes
MusicStatic["absNote"] = function (node, ctx) {
  const parent = ctx[ctx.length - 1];
  if (parent.type === "~" && node === parent.body[0]) {  //clef note

  } else {      //endNote

  }
  const [absClef, clefNote] = getClef(ctx, "absNote");
  return {type: "relNote", body: [], num: noteDistance(node, clefNote)};
};
MusicStatic["relNote"] = function (node, ctx) {
  // debugger;
  //todo convert to ~
  return node;
};
MusicStatic["absNoteNum"] = function (node, ctx) {
  // debugger;
  //todo convert to ~
  return node;
};
MusicStatic["note"] = function (node, ctx) {
  const clone = Object.assign({}, node);
  // const absoluteOctave= getClef(ctx, "absTone");
  // debugger;
  if (absoluteClef)
    clone.relToneTwelve = noteDistance(clone, absoluteClef.body[0]);
  // const modeParentClef = getClef(ctx, "mode");
  // const octaveParentClef = getClef(ctx, "absOctave");
  // const clone = populateNote(parentClef.keyNote, node);

  // if (isAbsolute(clone)){
  //   clone.relativeValue = distanceBetweenNotes(parentClef.keyNote, clone.body[0]);
  // }

  //1. calculate the relative value based on the absolute value
  // A) clef nodes look at their .clef table. If this clef table only contains one other element,
  // the clef node adds its mathematics to the child clef/note and return its child (ie. removes itself).
  // and returns

  return clone;
  //check the body to see if it has a relative value
  //if not,
// the clef table has twelve rows. one for each tone in the scale. It will only create as many gainNodes as it needs.

// B1) notes AND clefs with more than two dependencies create their own GainNode.
//   They set the value of this gain node to be the mathematical alteration of the notes.
//   they add their GainNode as the ".toneNode".
// B2) they then go to their .clef table and connect their ".toneNode" to all their tone children's ".toneNode"s.
// B3) they then search up the tree to find their parent clef. If a clef is found, they register themselves.
//    If not found, they create their own constant node and then fill it with their ConstantSourceNode with the given key as source, or C4 if
//    no key is given.
};

export const Music = Object.create(null);

//todo I do a static pass bottom up for the music operators.
//todo here I only register the properties that the children will look for later.
//todo during the dynamic pass/hookup, I need to get nodes that are not yet added.

//b) dynamic pass up:

//todo first, the correct operators, the "~" with a very low priority, ? scale is *
//todo the the "^^" must have lower priority than "^" ^^6^2, is not the same as ^^36, no they should have the same because they are interpreted left to right..

//note 1, two octaves up, three clicks left on the circle5
//~1*2^2^^6^-3.. The problem is that we have both soft typed mathematical and musical operators.
//~1*2^2^^6*-3.. and the ^^ is slightly higher pri than */, then we are good, right?
// musical operators.
//~1*A^^B     //that means that ^^ has the same priority as * and /. no this is worng too..
//if you want to morph a note to become the 2 instead of 1, this is not a mathematical operation. How to do that?? You can't do that right now.
/*

~A * 2 would be
~A ^^1 a single steps in the 12 scale
~A ^^7 seven single steps in the 12 scale = circle5 right click .
~A ^^-5 five negative steps in the 12 scale = circle5 left click.
~A ^^7^3 three clicks in the circle5, but, you also move up the octaves.
if we wanted, we could add "~A¤3" to yield 3 right clicks in the circle of five, that are lowered to the nearest note.

the operators above, they could be mathematically workable

~A + 1 one 7step up
~A - 1 one 7step down
~A+# augment the 7 note
~A+## double augment the 7 note, this is the same as +1, not?
~A-b diminish the 7 note
~A-bb double diminish the 7 note, this is the same as -1, not?

what to do if you try to diminish or augment a 7note that would be diminished or augmented into the next 7note?
should we only diminish at max one? if it is already diminished, should we then convert that into a full step down?

A5%lydian( B4%.... )

A5( %lydian( .... ))
%lydian( A5( .... ))

A5%lydian, B%locrian..

%lydian(A5),


%lydian( 1, ,4,5,6,32,1,2
   %!locrian(B, d, f)
)
this is not mathematically equivalent, but it would work not dissimilar as string concatenation

operations on the mode, this is not a frequency operation. Or, this is a frequency operation that works kinda like %, like remainder.
% as a prefix!
so, we have percent as a postfix. we cannot use % between two "5%20="?
*/


//if we find a ~ that is a prefix, then we convert that into a note.
//should ~ only be a prefix?? if so, then I can have a () after the tone expression, it will turn into a function name..
//else, we check that either the right or the left side of the ~ is a ()-block(, or an []-block??, or a function??)

//~(G4, ...)
//~(G4, ...  ~(^^6, .....))
//~(G4, ...  ~(C5^^6, .....))
//G4                   //todo absolute note
//  /~-?[0-6][#b]?/    //todo relative note
//  /~/                //todo the shorthand name of "clef"
//~(G4, ...)           //is the same
//clef(G4, ...)        //is the same

//if "*" is added as a prefix, it will not be interpreted mathematically. This allows such statements to be used statically as a first parameter of the clef function.
//then the default tone ~0 can be passed in as first parameter of the mathematical

//if it is a prefix, it is converted into a note, otherwise "~" is just a magical name! like the $ in jquery.
//~1(^^2)^2
//G4^^-1
//~(G4^^-1, ...)

//G4~(...)
//G4~(...)

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

Music["note"] = function (node, ctx) {

};

/*
//if both sides are tones, right side is a key'
Music["~"] = function (node, ctx) {
  //second pass, bottomUp
  if (node.keyBeingInterpreted) {
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
*/