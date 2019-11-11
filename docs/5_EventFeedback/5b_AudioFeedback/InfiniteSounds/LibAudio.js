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
export function setAudioParameter(target, param) {
  if (param === undefined) {
    return;
  } else if (param.output) {
    param.output.connect(target);
  } else if (typeof param === "number") {
    target.value = param;
  } else if (param instanceof Array) {
    plotEnvelope(target, param);
  } else
    throw new Error("CssAudio: Illegal input to gain node: " + param);
}

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
let noise;

function makeNoiseNode(duration, sampleRate) {
  const ctx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);
  const bufferSize = sampleRate * duration; // set the time of the note
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate); // create an empty buffer
  let data = buffer.getChannelData(0); // get data
  // fill the buffer with noise
  for (let i = 0; i < bufferSize; i++)
    data[i] = Math.random() * 2 - 1;
  return buffer;
}

function convertConvolverBuffer(data) {
  return new Uint8Array(data).buffer;
}

async function fetchAConvolverBuffer(url) {
  const file = await fetch(url);
  const data = await file.json();
  return convertConvolverBuffer(data);
}

const aConvolverBuffer = fetchAConvolverBuffer("https://raw.githack.com/orstavik/JoiEvents/master/docs/5_EventFeedback/5b_AudioFeedback/InfiniteSounds/test/convolver.json");

class AudioFileRegister {
  static async getFileBuffer(url) {
    let cache = cachedFiles[url];
    if (!cache) {
      const file = await fetch(url);
      cache = cachedFiles[url] = await file.arrayBuffer();
    }
    return cache.slice();//att! must use .slice() to avoid depleting the ArrayBuffer
  }

  static async makeFileBufferSource(node, ctx) {
    const [url, loop] = node.body;
    const data = await AudioFileRegister.getFileBuffer(url);
    const bufferSource = ctx.createBufferSource();
    bufferSource.buffer = await ctx.decodeAudioData(data);
    bufferSource.loop = !!loop;
    bufferSource.start();
    return {graph: node, output: bufferSource};
  }

  static async noise(node, ctx) {
    const aNoise = ctx.createBufferSource();
    aNoise.buffer = await (noise || (noise = makeNoiseNode(3, 44100)));
    aNoise.loop = true;
    aNoise.start();
    return {graph: node, output: aNoise};
  }

  //to max: it doesn't seem to matter which AudioContext makes the AudioBuffer
  //to max: this makes me think that the method .createBuffer could have been static
  //to max: but it means that the AudioBuffer objects are context free. Also for OfflineAudioContexts.

  static async aConvolverBuffer() {
    return (await aConvolverBuffer).slice();
  }
}

async function createPeriodicWave(ctx, wave) {
  if (typeof wave === "string") {
    const file = await fetch(wave);
    const data = await file.json();
    return ctx.createPeriodicWave(data.real, data.imag);
  }
  if (!(wave instanceof Array))
    throw new SyntaxError("Semantics: A periodic wavetable must be an array of raw numbers or a URL point to a json file with such an array");
  const real = wave[0];//.map(num => parseFloat(num.value));
  const imag = !wave[1] ? new Float32Array(real.length) : wave[1];  //.map(num => parseFloat(num.value))
  return ctx.createPeriodicWave(real, imag);
}

async function makeOscillator(node, ctx, type) {
  const [freq, wave] = node.body;
  //todo convert the factory methods to constructors as specified by MDN?
  const oscillator = ctx.createOscillator();
  oscillator.type = type;
  setAudioParameter(oscillator.frequency, freq);
  if (wave) {
    const table = await createPeriodicWave(ctx, wave);
    oscillator.setPeriodicWave(table);
  }
  oscillator.start();
  return {graph: node, output: oscillator};
}

function makeFilter(ctx, type, node, p) {
  //todo factory vs constructor: https://developer.mozilla.org/en-US/docs/Web/API/AudioNode#Creating_an_AudioNode
  //todo the problem is that this is difficult to do if the parameter is an audio envelope represented as an array.
  const filterNode = ctx.createBiquadFilter();
  filterNode.type = type;
  setAudioParameter(filterNode.frequency, p.freq);
  setAudioParameter(filterNode.Q, p.q);
  setAudioParameter(filterNode.gain, p.gain);
  setAudioParameter(filterNode.detune, p.detune);
  return {graph: node, input: filterNode, output: filterNode};
}

function makeGain(node, ctx) {
  const [gainParam] = node.body;
  const audio = ctx.createGain();
  setAudioParameter(audio.gain, gainParam);
  return {graph: node, input: audio, output: audio};
}

function makeDelay(node, ctx) {
  let [goal = 0, max = 1] = node.body;
  // if (goal.num) goal = goal.num;    //this should be handled prior to node creation, converting ms to s etc.
  // if (max.num) max = max.num;       //if we need to do type checks, we should do so later.
  if (typeof goal !== "number" || typeof max !== "number")
    throw new Error("omg, cannot delay without a number.");
  let delayNode = new DelayNode(ctx, {
    delayTime: goal,
    maxDelayTime: max
  });
  return {graph: node, output: delayNode, input: delayNode};
}

function merge(ctx, a, b) {
  const merger = ctx.createChannelMerger(2);
  a.connect(merger);
  b.connect(merger);
  return merger;
}

function makeConstant(ctx, value) {
  const constant = ctx.createConstantSource();
  constant.offset.value = value;
  constant.start();
  return constant;
}

//todo lfo function (min, max, type, hz).
//creates an oscillator that goes from min to max at specified hz.
//The calculation varies from square (0-1),and sine (-1-1). verify.
async function makeLfo(ctx, min, max, frequency, type) {
  const osc1 = ctx.createOscillator();
  osc1.frequency.value = frequency;
  osc1.type = type;
  osc1.start();
  const gainNode = ctx.createGain();
  let diff = max - min;
  gainNode.gain.value = type === "sine" ? diff / 2 : diff;
  osc1.connect(gainNode);
  return merge(ctx, makeConstant(ctx, min), gainNode);
}

export const InterpreterFunctions = {};

InterpreterFunctions.sine = (node, ctx) => makeOscillator(node, ctx[ctx.length - 1].webAudio, "sine");
InterpreterFunctions.square = (node, ctx) => makeOscillator(node, ctx[ctx.length - 1].webAudio, "square");
InterpreterFunctions.triangle = (node, ctx) => makeOscillator(node, ctx[ctx.length - 1].webAudio, "triangle");
InterpreterFunctions.sawtooth = (node, ctx) => makeOscillator(node, ctx[ctx.length - 1].webAudio, "sawtooth");

InterpreterFunctions.gain = (node, ctx) => makeGain(node, ctx[ctx.length - 1].webAudio);

//todo which input types for the convolver, only a single UInt8 array buffer, that can be given as a url?? or should we add a gain to it as well?? I think maybe the gain should be for the reverb, that produce both wet and dry pipe
InterpreterFunctions.convolver = async function (node, ctx) {
  const array = node.body;
  ctx = ctx[ctx.length - 1].webAudio;
  const convolver = ctx.createConvolver();
  const buffer = await (
    array.length === 0 ? AudioFileRegister.aConvolverBuffer() :
      array instanceof Array ? convertColvolverBuffer(array) :
        array.startsWith('"') ? fetchAConvolverBuffer(array) :
          array.type === "base64" ? convertToAudioBuffer(array) :
            null);

  if (!buffer)
    throw new Error("omg, cannot reverb without array");
  const audioBuffer = await ctx.decodeAudioData(buffer);
  convolver.buffer = audioBuffer;
  return {graph: node, input: convolver, output: convolver};
};

InterpreterFunctions.delay = function (node, ctx) {
  return makeDelay(node, ctx[ctx.length - 1].webAudio);
};

InterpreterFunctions.lowpass = function (node, ctx) {
  const [freq, q, detune] = node.body;
  return makeFilter(ctx[ctx.length - 1].webAudio, "lowpass", node, {freq, q, detune});
};

InterpreterFunctions.highpass = function (node, ctx) {
  const [freq, q, detune] = node.body;
  return makeFilter(ctx[ctx.length - 1].webAudio, "highpass", node, {freq, q, detune});
};

InterpreterFunctions.bandpass = function (node, ctx) {
  const [freq, q, detune] = node.body;
  return makeFilter(ctx[ctx.length - 1].webAudio, "bandpass", node, {freq, q, detune});
};

InterpreterFunctions.lowshelf = function (node, ctx) {
  const [freq, gain, detune] = node.body;
  return makeFilter(ctx[ctx.length - 1].webAudio, "lowshelf", node, {freq, gain, detune});
};

InterpreterFunctions.highshelf = function (node, ctx) {
  const [freq, gain, detune] = node.body;
  return makeFilter(ctx[ctx.length - 1].webAudio, "highshelf", node, {freq, gain, detune});
};

InterpreterFunctions.peaking = function (node, ctx) {
  const [freq, q, gain, detune] = node.body;
  return makeFilter(ctx[ctx.length - 1].webAudio, "peaking", node, {freq, q, gain, detune});
};

InterpreterFunctions.notch = function (node, ctx) {
  const [freq, q, detune] = node.body;
  const webAudio = ctx[ctx.length - 1].webAudio;
  return makeFilter(webAudio, "notch", node, {freq, q, detune});
};

InterpreterFunctions.allpass = function (node, ctx) {
  const [freq, q, detune] = node.body;
  const webAudio = ctx[ctx.length - 1].webAudio;
  return makeFilter(webAudio, "allpass", node, {freq, q, detune});
};


/**
 * url('https://some.com/sound.file') plays the sound file once
 * url('https://some.com/sound.file', 1) plays the sound file in a loop
 */
InterpreterFunctions.url = (node, ctx) => AudioFileRegister.makeFileBufferSource(node, ctx[ctx.length - 1].webAudio);

InterpreterFunctions.noise = (node, ctx) => AudioFileRegister.noise(node, ctx[ctx.length - 1].webAudio);

InterpreterFunctions.lfo = async function (node, ctx) {
  let [min = 0, max = 1, freq = 1, type] = node.body;
  type = type.value || "sine";
  const webAudio = ctx[ctx.length - 1].webAudio;
  return {graph: node, output: await makeLfo(webAudio, min, max, freq, type)};
};

InterpreterFunctions.constant = function (node, ctx) {
  let [value = 1] = node.body;
  const webAudio = ctx[ctx.length - 1].webAudio;
  let output = makeConstant(webAudio, value);
  return {graph: node, output: output};
};

class StartAble {
  constructor(graph, output, input, parameters) {
    this.graph = graph;
    this.output = output;
    this.input = input;
    this.parameters = parameters;
  }

  start() {
    this.setParameters(this.parameters);    //ok, need to make the setParameters method contain some key value pairs.
    this.output.start();                    //here I need to iterate the parameters.
    this.input.start();                     //but this is not fine. The input elements need to be a list of StartAbles.
    this.parameters.start();                //The parameters given inn here need to be a set of StartAbles.
  }
}
