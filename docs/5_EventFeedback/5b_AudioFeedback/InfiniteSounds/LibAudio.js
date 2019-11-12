//todo convert the factory methods to constructors as specified by MDN?
//todo factory vs constructor: https://developer.mozilla.org/en-US/docs/Web/API/AudioNode#Creating_an_AudioNode
//todo the problem is that this is difficult to do if the parameter is an audio envelope represented as an array.

class MomNode {
  constructor(node, params, output) {
    this.body = node.body;
    this.params = params;
    this.graph = node;                           //todo remove graph?
    this.output = output;
    this.input = output;
  }

  start() {
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
    } else if (!target.value) {
      output[paramName] = param;
    } else if (typeof param === "number") {
      target.value = param;
    } else if (param instanceof Array) {
      plotEnvelope(target, param);
    } else
      throw new Error("CssAudio: Illegal input to gain node: " + param);
  }
}

function createMomGain(node, ctx) {
  const momNode = new MomNode(node, ["gain"], ctx.createGain());
  momNode.start();
  return momNode;
}

async function createMomOscillator(node, ctx, type) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.start();
  const momNode = new MomNode(node, ["frequency", "setPeriodicWave"], osc);
  momNode.start();
  return momNode;
}

function createMomFilter(node, ctx, params, type) {
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  const momNode = new MomNode(node, params, filter);
  momNode.start();
  return momNode;
}

function createMomDelay(node, ctx) {
  const [goal = 0, max = 1] = node.body;
  if (typeof goal !== "number" || typeof max !== "number")
    throw new Error("Delay nodes accept only and max two number parameters.");
  let delayNode = new DelayNode(ctx, {
    delayTime: goal,
    maxDelayTime: max
  });
  return new MomNode(node, [], delayNode);    //todo doesn't need to start() as it has no params
}

function createMomConstant(node, ctx) {
  const constant = ctx.createConstantSource();
  constant.start();
  const res = new MomNode(node, ["offset"], constant);
  res.start();
  return res;
}

async function createMomConvolver(node, ctx) {
  const convolver = ctx.createConvolver();
  const momNode = new MomNode(node, ["buffer"], convolver);
  momNode.start();
  return momNode;
}

function createMomBufferSource(node, ctx) {
  node.body[1] = !!node.body[1];
  const bufferSource = ctx.createBufferSource();
  bufferSource.start();
  const momNode = new MomNode(node, ["buffer", "loop"], bufferSource);
  momNode.start();
  return momNode;
}

function plotEnvelope(target, points) {
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

InterpreterFunctions.sine = async (node, ctx) => await createMomOscillator(node, ctx[ctx.length - 1].webAudio, "sine");
InterpreterFunctions.square = async (node, ctx) => await createMomOscillator(node, ctx[ctx.length - 1].webAudio, "square");
InterpreterFunctions.triangle = async (node, ctx) => await createMomOscillator(node, ctx[ctx.length - 1].webAudio, "triangle");
InterpreterFunctions.sawtooth = async (node, ctx) => await createMomOscillator(node, ctx[ctx.length - 1].webAudio, "sawtooth");
InterpreterFunctions.gain = (node, ctx) => createMomGain(node, ctx[ctx.length - 1].webAudio);
InterpreterFunctions.delay = (node, ctx) => createMomDelay(node, ctx[ctx.length - 1].webAudio);
InterpreterFunctions.lowpass = (node, ctx) => createMomFilter(node, ctx[ctx.length - 1].webAudio, ["frequency", "q", "detune"], "lowpass");
InterpreterFunctions.highpass = (node, ctx) => createMomFilter(node, ctx[ctx.length - 1].webAudio, ["frequency", "q", "detune", "highpass"]);
InterpreterFunctions.bandpass = (node, ctx) => createMomFilter(node, ctx[ctx.length - 1].webAudio, ["frequency", "q", "detune"], "bandpass");
InterpreterFunctions.lowshelf = (node, ctx) => createMomFilter(node, ctx[ctx.length - 1].webAudio, ["frequency", "gain", "detune"], "lowshelf");
InterpreterFunctions.highshelf = (node, ctx) => createMomFilter(node, ctx[ctx.length - 1].webAudio, ["frequency", "gain", "detune"], "highshelf");
InterpreterFunctions.peaking = (node, ctx) => createMomFilter(node, ctx[ctx.length - 1].webAudio, ["frequency", "q", "gain", "detune"], "peaking");
InterpreterFunctions.notch = (node, ctx) => createMomFilter(node, ctx[ctx.length - 1].webAudio, ["frequency", "q", "detune"], "notch");
InterpreterFunctions.allpass = (node, ctx) => createMomFilter(node, ctx[ctx.length - 1].webAudio, ["frequency", "q", "detune"], "allpass");

InterpreterFunctions.constant = (node, ctx) => createMomConstant(node, ctx[ctx.length - 1].webAudio);

//todo test Uint8Array input different types of
InterpreterFunctions.convolver = async (node, ctx) => createMomConvolver(node, ctx[ctx.length - 1].webAudio);

/**
 * url('https://some.com/sound.file') plays the sound file once
 * url('https://some.com/sound.file', 1) plays the sound file in a loop
 */
InterpreterFunctions.url = async (node, ctx) => createMomBufferSource(node, ctx[ctx.length - 1].webAudio);

//todo fix the bug for the original property on notes

//todo add "map" operations on arrays.

//todo add static tests for noise and lfo!