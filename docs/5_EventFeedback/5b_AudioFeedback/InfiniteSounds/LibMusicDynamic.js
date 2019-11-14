import {MusicModes} from "./MusicModes.js";

class Clef {
  constructor(clef) {
    this.type = "start";            //this makes the interpreter able to run it
    this.key = clef.key;
    this.body = clef.body;
    this.children = clef.children || [];
    // delete clef.children; // todo very unsure about this mutation. Because of the setup, the clef object will simply be discarded
    this.start();                        //todo don't need to start it.
  }

  start() {
    const [key, mode] = this.key.body;
    for (let child of this.children)
      child.start(key, mode);
  }
}

class RelativeClef extends Clef {

  start(key, mode) {
    if (key === undefined/*&&mode=== undefined*/)
      return;
    const [twelve, myMode, seven] = this.key.body;
    key += twelve;
    key += MusicModes.toTwelve(mode, seven);
    mode = MusicModes.switchMode(mode, myMode);
    for (let child of this.children)
      child.start(key, mode);
  }
}

class RelativeNote {
  constructor(relNote, audioCtx) {
    this.type = "start";            //this makes the interpreter able to run it
    this.body = relNote.body;
    this.output = makeFrequencyGain(audioCtx);
  }

  start(key, mode) {
    if (key === undefined/*&&mode=== undefined*/)
      return;
    const [twelve, myMode, seven] = this.body;
    key += twelve;
    key += MusicModes.toTwelve(mode, seven);
    // mode = MusicModes.switchMode(mode, myMode);  todo don't need this for leaf notes.
    this.output.gain.value = Notes[key];
  }
}

//todo untested
class AbsoluteNote {
  constructor(absNote, audioCtx) {
    this.type = "start";            //this makes the interpreter able to run it
    this.body = absNote.body;
    this.output = makeFrequencyGain(audioCtx);
    this.start();
  }

  start() {
    const [twelve, mode] = this.body;
    this.output.gain.value = Notes[twelve];
  }
}

function getParentClef(ctx) {
  for (let scope of ctx) {
    if (scope.type === "DOCUMENT" || scope.type === "relClef" || scope.type === "absClef")
      return scope;
  }
  throw Error("OMG! There should always be a Document root in the Mom.");
}

function makeFrequencyGain(audioCtx) {
  const constant = audioCtx.createConstantSource();
  constant.start();
  const toneGain = audioCtx.createGain();
  constant.connect(toneGain);
  return toneGain;
}

export const MusicDynamic = Object.create(null);

MusicDynamic["absNote"] = function (node, ctx) {
  const audioCtx = ctx[ctx.length - 1].webAudio;
  return new AbsoluteNote(node, audioCtx);
};

MusicDynamic["relNote"] = function (node, ctx) {
  const audioCtx = ctx[ctx.length - 1].webAudio;
  const note = new RelativeNote(node, audioCtx);
  const parent = getParentClef(ctx);
  (parent.children || (parent.children = [])).push(note);
  return note;
};

MusicDynamic["relClef"] = function (node, ctx) {
  const clef = new RelativeClef(node, ctx);
  const parent = getParentClef(ctx);
  (parent.children || (parent.children = [])).push(clef);
  return clef;
};

MusicDynamic["absClef"] = function (node, ctx) {
  return new Clef(node);
};

MusicDynamic["DOCUMENT"] = function (node, ctx) {
  return new Clef(node);
};

//https://pages.mtu.edu/~suits/NoteFreqCalcs.html
const a12th = Math.pow(2, 1 / 12);
//https://pages.mtu.edu/~suits/notefreqs.html
export const Notes = [
  16.35,
  17.32,
  18.35,
  19.45,
  20.60,
  21.83,
  23.12,
  24.50,
  25.96,
  27.50,
  29.14,
  30.87,
  32.70,
  34.65,
  36.71,
  38.89,
  41.20,
  43.65,
  46.25,
  49.00,
  51.91,
  55.00,
  58.27,
  61.74,
  65.41,
  69.30,
  73.42,
  77.78,
  82.41,
  87.31,
  92.50,
  98.00,
  103.83,
  110.00,
  116.54,
  123.47,
  130.81,
  138.59,
  146.83,
  155.56,
  164.81,
  174.61,
  185.00,
  196.00,
  207.65,
  220.00,
  233.08,
  246.94,
  261.63,
  277.18,
  293.66,
  311.13,
  329.63,
  349.23,
  369.99,
  392.00,
  415.30,
  440.00,
  466.16,
  493.88,
  523.25,
  554.37,
  587.33,
  622.25,
  659.25,
  698.46,
  739.99,
  783.99,
  830.61,
  880.00,
  932.33,
  987.77,
  1046.50,
  1108.73,
  1174.66,
  1244.51,
  1318.51,
  1396.91,
  1479.98,
  1567.98,
  1661.22,
  1760.00,
  1864.66,
  1975.53,
  2093.00,
  2217.46,
  2349.32,
  2489.02,
  2637.02,
  2793.83,
  2959.96,
  3135.96,
  3322.44,
  3520.00,
  3729.31,
  3951.07,
  4186.01,
  4434.92,
  4698.63,
  4978.03,
  5274.04,
  5587.65,
  5919.91,
  6271.93,
  6644.88,
  7040.00,
  7458.62,
  7902.13
];