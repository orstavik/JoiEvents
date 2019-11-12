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

  setAudioParameter(target, param, output, paramName) {
    if (param === undefined)
      return;
    if (target instanceof Function)
      output[paramName](param);
    else if (param.output) {
      param.output.connect(target);
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
  node.body[1] = await createPeriodicWave(ctx, node.body[1]);
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
  return new MomNode(node, [], delayNode);    //todo doesn't need to start()
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

//todo Make audioparam accept array of audio nodes??

//todo "gain()" or "gain", does that equal "mute" or "gain(1)"?

/**
 * AudioFileRegister caches the arrayBuffers for different audio url's.
 * This implementation is naive because it:
 * 1. doesn't handle url files that change dynamically
 * 2. stores potentially infinite audio url files directly in memory
 *
 * Can be made smarter by:
 * 1. keeping a limit on how many files are stored.
 *    If more than 100 audiofiles, or 20mb data
 *    (ie. the sum of the length/size of each arrayBuffer in the cache),
 *    then delete the cached arrayBuffer last retrieved from the cache.
 * 2. Add a static method AudioFileRegister.clearCache(url) that can be called manually from js.
 * 3. Preferably use the ttl of the http request to control the cache. If the ttl of the http request is not ok, then:
 *    a. When the file is first added to the cache register,
 *       check if trying to get the same file again returns a 304, not modified.
 *    b. if the file was not modified last time, then use the cache and check *after* the cache has been delivered
 *       if the assumption that the server returns a 304.
 *    c. check rarely if the cache needs updating, ie. after every 10n uses of the cache, ie. 1, 10, 100, 1000 etc.
 *
 * A combination of 1 and 3 should be ok.
 */
const cachedFiles = Object.create(null);

class AudioFileRegister {

  static async getFileBuffer(url, type) {
    let cache = cachedFiles[url];
    if (!cache) {
      const file = await fetch(url);
      cachedFiles[url] = cache = (
        type === "json" ?
          new Uint8Array(await file.json()).buffer :
          await file.arrayBuffer()
      );
    }
    return cache.slice();//att! must use .slice() to avoid depleting the ArrayBuffer
  }

  static makeNoiseNode(duration, sampleRate) {
    const ctx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);
    const bufferSize = sampleRate * duration; // set the time of the note
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate); // create an empty buffer
    let data = buffer.getChannelData(0); // get data
    // fill the buffer with noise
    for (let i = 0; i < bufferSize; i++)
      data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  static async makeNoise(duration = 3, sampleRate = 44100) {
    const id = "cache:noise:" + duration + ":" + sampleRate;
    let cache = cachedFiles[id];
    if (!cache)
      cache = cachedFiles[id] = await AudioFileRegister.makeNoiseNode(duration, sampleRate);
    return cache;
  }
}

async function createPeriodicWave(ctx, wave) {
  if (wave === undefined)
    return undefined;
  if (typeof wave === "string") {
    const file = await fetch(wave);
    const data = await file.json();
    return ctx.createPeriodicWave(data.real, data.imag);
  }
  if (!(wave instanceof Array))
    throw new SyntaxError("Semantics: A periodic wavetable must be an array of raw numbers or a URL point to a json file with such an array");
  const real = wave[0];
  const imag = !wave[1] ? new Float32Array(real.length) : wave[1];
  return ctx.createPeriodicWave(real, imag);
}

//todo make a better merge than [x,y,z] > gain(1)
// function merge(ctx, a, b) {
//   const merger = ctx.createChannelMerger(2);
//   a.connect(merger);
//   b.connect(merger);
//   return merger;
// }
//
function makeConstant(ctx, value) {
  const constant = ctx.createConstantSource();
  constant.offset.value = value;
  constant.start();
  return constant;
}

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
InterpreterFunctions.allpass = (node, ctx) => createMomFilter(node, ctx[ctx.length - 1].webAudio, undefined, ["frequency", "q", "detune"], "allpass");

//todo test Uint8Array input different types of
InterpreterFunctions.convolver = async function (node, ctx) {
  let data = node.body[0] || "https://raw.githack.com/orstavik/JoiEvents/master/docs/5_EventFeedback/5b_AudioFeedback/InfiniteSounds/test/convolver.json";
  ctx = ctx[ctx.length - 1].webAudio;
  const buffer = await (
    typeof data === "string" ? await AudioFileRegister.getFileBuffer(data, "json") :
      data instanceof Array ? new Uint8Array(data).buffer :
        // array.type === "base64" ? convertToAudioBuffer(array) :
        undefined);

  if (!buffer)
    throw new Error("omg, cannot reverb without array");

  const convolver = ctx.createConvolver();
  convolver.buffer = await ctx.decodeAudioData(buffer);
  return {graph: node, input: convolver, output: convolver};
};

/**
 * url('https://some.com/sound.file') plays the sound file once
 * url('https://some.com/sound.file', 1) plays the sound file in a loop
 */
InterpreterFunctions.url = async function (node, ctx) {
  ctx = ctx[ctx.length - 1].webAudio;
  const [url, loop] = node.body;
  const bufferSource = ctx.createBufferSource();
  const data = await AudioFileRegister.getFileBuffer(url);
  bufferSource.buffer = await ctx.decodeAudioData(data);
  bufferSource.loop = !!loop;
  bufferSource.start();
  return {graph: node, output: bufferSource};
};

InterpreterFunctions.noise = async function (node, ctx) {
  ctx = ctx[ctx.length - 1].webAudio;
  const aNoise = ctx.createBufferSource();
  aNoise.buffer = await AudioFileRegister.makeNoise();
  aNoise.loop = true;
  aNoise.start();
  return {graph: node, output: aNoise};
};

InterpreterFunctions.constant = function (node, ctx) {
  let [value = 1] = node.body;
  const webAudio = ctx[ctx.length - 1].webAudio;
  let output = makeConstant(webAudio, value);
  return {graph: node, output: output};
};