import {setAudioParameter} from "./LibAudio.js";
import {MusicModes} from "./MusicModes.js";

class AbsoluteClef {
  constructor(absNote, children) {
    this.key = absNote;
    this.children = children;
    this.update();
  }

  update() {
    for (let child of this.children)
      child.key.update(this.key.body[0], this.key.body[1]);
  }
}

class RelativeClef {
  constructor(relNote, children) {
    this.relNote = relNote;
    this.children = children;
  }

  update(key, mode) {
    const [twelve, myMode, seven] = this.relNote.body;
    key += twelve;
    key += MusicModes.toTwelve(mode, seven);
    mode = MusicModes.switchMode(mode, myMode);
    for (let child of this.children)
      child.key.update(key, mode);
  }
}

class RelativeNote {
  constructor(relNote, output) {
    this.relNote = relNote;
    this.output = output;
  }

  update(key, mode) {
    const [twelve, myMode, seven] = this.relNote.body;
    key += twelve;
    key += MusicModes.toTwelve(mode, seven);
    // mode = MusicModes.switchMode(mode, myMode);  todo don't need this for leaf notes.
    setAudioParameter(this.output.gain, Notes[key]);
  }
}

class AbsoluteNote {
  constructor(absNote, output) {
    this.absNote = absNote;
    this.output = output;
    this.update();
  }

  update() {
    const [twelve, mode] = this.absNote.body;
    setAudioParameter(this.output.gain, Notes[twelve]);
  }
}

function getParentClef(ctx) {
  for (let scope of ctx) {
    if (scope.type === "DOCUMENT" || scope.type === "relClef" || scope.type === "absClef")
      return scope;
  }
  throw Error("OMG!!!! due");
}

function makeFrequencyGain(ctx) {
  const audioCtx = ctx[ctx.length - 1].webAudio;
  const constant = audioCtx.createConstantSource();
  constant.start();
  const toneGain = audioCtx.createGain();
  constant.connect(toneGain);
  return toneGain;
}

//https://pages.mtu.edu/~suits/NoteFreqCalcs.html
const a12th = Math.pow(2, 1 / 12);

export const MusicDynamic = Object.create(null);

MusicDynamic["absNote"] = function (node, ctx) {
  const toneGain = makeFrequencyGain(ctx);
  const tone = node.body[0];
  const freq = Notes[tone];
  setAudioParameter(toneGain, freq);
  return {graph: node, output: toneGain};
};

MusicDynamic["relNote"] = function (node, ctx) {
  const res = {graph: node};
  res.output = makeFrequencyGain(ctx);
  res.key = new RelativeNote(node, res.output);
  const clef = getParentClef(ctx);
  (clef.children ||(clef.children = [])).push(res);
  return res;
};

MusicDynamic["relClef"] = function (node, ctx) {
  const res = {graph: node, type: "relClef"};
  res.key = new RelativeClef(node.key, node.children);
  delete node.children;
  const clef = getParentClef(ctx);
  (clef.children ||(clef.children = [])).push(res);    //the clef will call the update function on the note
  return res;
};

MusicDynamic["absClef"] = function (node, ctx) {
  const res = {graph: node, type: "absClef"};
  res.key = new AbsoluteClef(node.key, node.children);
  delete node.children;
  return res;
};

MusicDynamic["DOCUMENT"] = function (node, ctx) {
  const docClone = Object.assign({}, node);
  docClone.key = new AbsoluteClef(node.key, node.children);
  delete node.children;
  return docClone;
};

MusicDynamic["~~"] = function (node, ctx) {
  const tone = node.body[0];
  const freq = Math.pow(a12th, tone);
  const rootCtx = ctx[ctx.length - 1];
  const toneGain = makeFrequencyGain(rootCtx);
  return {graph: node, input: toneGain, output: toneGain};
};

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