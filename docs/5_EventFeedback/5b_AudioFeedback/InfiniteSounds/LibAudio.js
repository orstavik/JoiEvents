export class MomNode {
  constructor(body = []) {
    this.body = body;
  }

  start() {
    for (let child of this.body)
      child && child.start && child.start();
  }
}

//todo convert the factory methods to constructors as specified by MDN?
//todo factory vs constructor: https://developer.mozilla.org/en-US/docs/Web/API/AudioNode#Creating_an_AudioNode
//todo the problem is that this is difficult to do if the parameter is an audio envelope represented as an array.
class AudioMomNode extends MomNode {
  constructor(node, ctx, fn, params) {
    super(node.body);
    this.params = params;
    this.fn = fn;
  }

  start() {
    super.start();

    this.input = this.output = this.fn();
    this.updateAudioParameters(this.params, this.body);
    this.output.start && this.output.start();
  }

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
    const res = new AudioMomNode(node, ctx, init, params);
    // res.start();
    return res;
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

export const MomNodes = {};

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