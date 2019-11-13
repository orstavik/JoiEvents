//todo convert the factory methods to constructors as specified by MDN?
//todo factory vs constructor: https://developer.mozilla.org/en-US/docs/Web/API/AudioNode#Creating_an_AudioNode
//todo the problem is that this is difficult to do if the parameter is an audio envelope represented as an array.

class MomNode {
  constructor(node, ctx, fn, params) {
    this.body = node.body;
    this.params = params;
    this.ctx = ctx;
    this.fn = fn;
    this.graph = node;                           //todo remove graph?

    this.start();
  }

  start() {
    this.output = this.ctx[this.fn]();
    this.output.start && this.output.start();
    this.input = this.output;

    for (let child of this.body)
      child && child.start && child.start();
    for (let i = 0; i < this.params.length; i++) {
      let param = this.params[i];
      this.setAudioParameter(this.output[param], this.body[i], this.output, param);
    }
  }

//todo Make audioparam accept array of audio nodes??
  setAudioParameter(target, param, output, paramName) {
    if (param === undefined)
      return;
    if (target instanceof Function)
      output[paramName](param);
    else if (param instanceof AudioBuffer)
      output[paramName] = param;
    else if (param.output) {
      param.output.connect(target);
    } else if (target.value === undefined) {
      output[paramName] = param;
    } else if (typeof param === "number") {
      target.value = param;
    } else if (param instanceof Array || param.type === "[]") {
      plotEnvelope(target, param);
    } else
      throw new Error("CssAudio: Illegal input to gain node: " + param);
  }

  static create(node, ctx, fn, params) {
    return new MomNode(node, ctx, fn, params);
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

//todo make a better merge than [x,y,z] > gain(1)
// function merge(ctx, a, b) {
//   const merger = ctx.createChannelMerger(2);
//   a.connect(merger);
//   b.connect(merger);
//   return merger;
// }
//

export const InterpreterFunctions = {};

InterpreterFunctions.oscillator = async (node, ctx) => await MomNode.create(node, ctx[ctx.length - 1].webAudio, "createOscillator", ["type", "frequency", "setPeriodicWave"]);
InterpreterFunctions.gain = (node, ctx) => MomNode.create(node, ctx[ctx.length - 1].webAudio, "createGain", ["gain"]);
InterpreterFunctions.delay = (node, ctx) => MomNode.create(node, ctx[ctx.length - 1].webAudio, "createDelay", ["delayTime"]);
InterpreterFunctions.filter = (node, ctx) => MomNode.create(node, ctx[ctx.length - 1].webAudio, "createBiquadFilter", ["type", "frequency", "q", "gain", "detune"]);
InterpreterFunctions.constant = (node, ctx) => MomNode.create(node, ctx[ctx.length - 1].webAudio, "createConstantSource", ["offset"]);
InterpreterFunctions.convolver = async (node, ctx) => MomNode.create(node, ctx[ctx.length - 1].webAudio, "createConvolver", ["buffer"]);

/**
 * url('https://some.com/sound.file') plays the sound file once
 * url('https://some.com/sound.file', 1) plays the sound file in a loop
 */
InterpreterFunctions.url = async (node, ctx) => MomNode.create(node, ctx[ctx.length - 1].webAudio, "createBufferSource", ["buffer", "loop"]);

//todo test Uint8Array input different types of

//todo Fix the bug for the original property on notes

//todo Add "map" operations on arrays.

//todo Add static tests for noise and lfo and oscillator and filter!
//todo add once() and loop() instead of url.

//todo In the static lib, I can also add the type checks. That can be voluntary, we can turn them off. We just run through the output early, and then we test it before it goes into MomCreation.