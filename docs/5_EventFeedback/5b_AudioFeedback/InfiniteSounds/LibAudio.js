import {isPrimitive} from "./Parser.js";

export class MomNode {
  constructor(body = []) {
    this.body = body;
    this._output;
    this._input;
  }

  set output(obj) {
    this._output = obj;
  }

  set input(obj) {
    this._input = obj;
  }

  get output() {
    return this._output || this.body.map(node => node.output);
  }

  get input() {
    return this._input || this.body.map(node => node.input);
  }

  start() {
    //todo,
    if (this.isStarted)
      this.stop();
    this.isStarted = true;
    for (let child of this.body)
      child && child.start && child.start();
  }

  //todo I need a
  stop() {
    for (let child of this.body)
      child && child.stop && child.stop();
    this.isStarted = false;
  }

  //todo
  // clone(){
  //   return new MomNode(this.body);
  // }
}

//todo convert the factory methods to constructors as specified by MDN?
//todo factory vs constructor: https://developer.mozilla.org/en-US/docs/Web/API/AudioNode#Creating_an_AudioNode
//todo the problem is that this is difficult to do if the parameter is an audio envelope represented as an array.
class AudioMomNode extends MomNode {
  constructor(body, fn, params) {
    super(body);
    this.fn = fn;
    this.params = params;
  }

  start() {
    super.start();
    this.input = this.output = this.fn();
    this.updateAudioParameters(this.params, this.body);
    this.output.start && this.output.start();
  }

  //todo
  stop() {
    super.stop();
    this.output.stop && this.output.stop();
  }

  //todo
  // clone(){
  //   return new AudioMomNode(this.body, this.fn, this.params);
  // }

  updateAudioParameters(names, values) {
    for (let i = 0; i < names.length; i++)
      this.setAudioParameter(names[i], values[i]);
  }

  setAudioParameter(prop, value) {
    if (value === undefined)
      return;
    if (this.output[prop] instanceof Function)
      return this.output[prop](value);
    if (!this.output[prop] || !(this.output[prop] instanceof AudioParam))
      return this.output[prop] = value;
    if (value.output)
      return value.output.connect(this.output[prop]);
    if (typeof value === "number")
      return this.output[prop].value = value;
    if (value instanceof Array || value.type === "[]")
      return plotEnvelope(this.output[prop], value);
    //todo Make audioparam accept array of audio nodes??
    throw new Error("CssAudio: Illegal input to gain node: " + value);
  }

  //todo remove this and make it into a constructor
  static create(node, ctx, fn, params) {
    ctx = ctx[ctx.length - 1].webAudio;
    const init = ctx[fn].bind(ctx);
    return new AudioMomNode(node.body, init, params);
  }
}

function plotEnvelope(target, points) {
  points = (points.body ? points.body : points);
  target.value = 0;
  let nextStart = 0;
  for (let point of points) {
    let vol = point[0].num || point[0];
    let time = point[1].num || point[1];
    if (typeof point[1] === "number" || point[0].unit === "" || point[0].unit === "e")
      target.setTargetAtTime(vol, nextStart, time / 4);   //todo or /3? as mdn suggests
    else
      throw new Error("todo: implement 'l' or 'a' type of time coordinate.");
    nextStart += time;
  }
}

//todo do I need to mark which nodes are connected to what other nodes?
function connectMtoN(a, b) {
  if (a instanceof Array) {
    for (let x of a)
      connectMtoN(x, b);
    return;
  }
  if (b instanceof Array) {
    for (let y of b)
      connectMtoN(a, y);
    return;
  }
  a.connect(b);
}

function disconnectMtoN(a, b) {
  if (a instanceof Array) {
    for (let x of a)
      disconnectMtoN(x, b);
    return;
  }
  if (b instanceof Array) {
    for (let y of b)
      disconnectMtoN(a, y);
    return;
  }
  a.disconnect(b);
}

function isSolved(node) {
  return isPrimitive(node) || node.output;
}

function flattenAudioArray(node, outputInput) {
  if (!(node instanceof Array))
    return node[outputInput];
  return node.flat(Infinity).map(node => {
    if (node[outputInput])
      return node[outputInput];
    throw new SyntaxError(`Cannot > pipe from something that doesn't have an audio ${outputInput} stream.`, node);
  });
}

export class MomPipeNode extends MomNode {
  start() {
    super.start();
    let [left, right] = this.body;
    if (!left || !right)                                                       //todo, I don't want this here..
      throw new SyntaxError("'>' pipe must have an input and output: " + node);
    this.leftOut = flattenAudioArray(left, "output");
    this.rightIn = flattenAudioArray(right, "input");
    connectMtoN(this.leftOut, this.rightIn);
    this.output = flattenAudioArray(right, "output");
    this.ogInput = left.ogInput || left.input;
  }

  //todo
  stop() {
    disconnectMtoN(this.leftOut, this.rightIn)
  }

  //todo
  // clone(){
  //   return super.clone();  needs to do nothing?, I don't need to implement this?
  // }
}

export const MomNodes = Object.create(null);

MomNodes.oscillator = (node, ctx) => AudioMomNode.create(node, ctx, "createOscillator", ["type", "frequency", "setPeriodicWave"]);
MomNodes.gain = (node, ctx) => AudioMomNode.create(node, ctx, "createGain", ["gain"]);
MomNodes.delay = (node, ctx) => AudioMomNode.create(node, ctx, "createDelay", ["delayTime"]);
MomNodes.filter = (node, ctx) => AudioMomNode.create(node, ctx, "createBiquadFilter", ["type", "frequency", "q", "gain", "detune"]);
MomNodes.constant = (node, ctx) => AudioMomNode.create(node, ctx, "createConstantSource", ["offset"]);
MomNodes.convolver = (node, ctx) => AudioMomNode.create(node, ctx, "createConvolver", ["buffer"]);

/**
 * url('https://some.com/sound.file') plays the sound file once
 * url('https://some.com/sound.file', true) plays the sound file in a loop
 */
MomNodes.url = (node, ctx) => AudioMomNode.create(node, ctx, "createBufferSource", ["buffer", "loop"]);

MomNodes["[]"] = function (node, ctx) {
  for (let item of node.body) {
    if (!isSolved(item))
      return node;
  }
  return node.body;
};

//Arrays are flattened
//   [[a,b],c] > d
//   equals
//   [a,b,c] > d
MomNodes[">"] = function (node, ctx) {
  return new MomPipeNode(node.body);
};
//todo test Uint8Array input different types of

//todo Add "map" operations on arrays.

//todo Add static tests for noise and lfo and oscillator and filter!
//todo add once() and loop() instead of url.

//todo In the static lib, I can also add the type checks. That can be voluntary, we can turn them off. We just run through the output early, and then we test it before it goes into MomCreation.

//todo make a better merge than [x,y,z] > gain(1)
// function merge(ctx, a, b) {
//   const merger = ctx.createChannelMerger(2);
//   a.connect(merger);
//   b.connect(merger);
//   return merger;
// }
//