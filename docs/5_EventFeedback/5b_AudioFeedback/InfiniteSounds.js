import {parse} from "./cssAudioParser.js";
import {Notes} from "./notes.js";

// import {circleOfFifth, chord, chord2, scale} from "./CircleOfFifth.js";

function plotEnvelope(target, points) {
  target.value = 0;
  let nextStart = 0;
  for (let point of points) {
    let vol = point[0].value;
    let time = point[1].value;
    if (point[1].unit === "" || point[1].unit === "e")
      target.setTargetAtTime(vol, nextStart, time / 4);   //todo or /3? as mdn suggests
    else
      throw new Error("todo: implement 'l' or 'a' type of time coordinate.");
    nextStart += time;
  }
}

function setAudioParameter(target, param) {
  if (param === undefined) {
    return;
  } else if (param instanceof AudioNode) {
    param.connect(target);
  } else if (param.hasOwnProperty("value")) {
    //todo if the number is not parsed outside, then the units will be universal to all nodes..
    //todo I have not implemented any interpretation of "Hz" or "db" or "ms" or whatever
    target.value = param.value;
  } else if (param instanceof Array) {
    plotEnvelope(target, param);
    // } else if (gain instanceof undefined) { //todo should I include this??  or call it "mute"??
    //   node.gain.value = 0;
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

class AudioFileRegister {
  static async getFileBuffer(url) {
    let cache = cachedFiles[url];
    if (!cache) {
      const file = await fetch(url);
      cache = cachedFiles[url] = await file.arrayBuffer();
    }
    return cache.slice();//att! must use .slice() to avoid depleting the ArrayBuffer
  }

  static noise() {
    return noise || (noise = makeNoiseNode(3, 44100));
  }

  //to max: it doesn't seem to matter which AudioContext makes the AudioBuffer
  //to max: this makes me think that the method .createBuffer could have been static
  //to max: but it means that the AudioBuffer objects are context free. Also for OfflineAudioContexts.
}

//todo so far none of the TranslateFunctions are async,
//todo but that occur later if we need to for example load a wave table from a file
class TranslateFunctionsOne {
  static cof(ctx, coor, key, mode) {
    debugger;
    return circleOfFifth(coor, key, mode);
  }
}

class TranslateFunctionsTwo {
  /**
   * random(array) will return a random entry from the array.
   * random(a) will return a random value between 0 and the number "a".
   * random(a, b) will return a random value the numbers "a" and "b".
   * random(a, b, step) will return a random "step" between numbers "a" and "b".
   */
  static random(ctx, a, b, steps) {
    if (a instanceof Array)
      return a[Math.floor(Math.random() * a.length)];
    let value;
    if (a.value && !b)
     value = Math.random() * a.value;
    else if (steps === undefined)
      value = Math.random() * (b.value - a.value) + b.value;
    else
      value = (Math.random() * ((b.value - a.value) / steps.value) * steps.value) + b.value;
    return {value: value, unit: a.unit};
  }
}

class InterpreterFunctions {

  static sine(ctx, freq) {
    return InterpreterFunctions.makeOscillator(ctx, "sine", freq);
  }

  static square(ctx, freq) {
    return InterpreterFunctions.makeOscillator(ctx, "square", freq);
  }

  static sawtooth(ctx, freq) {
    return InterpreterFunctions.makeOscillator(ctx, "sawtooth", freq);
  }

  static triangle(ctx, freq) {
    return InterpreterFunctions.makeOscillator(ctx, "triangle", freq);
  }

  static gain(ctx, gainParam) {
    const node = ctx.createGain();
    setAudioParameter(node.gain, gainParam);
    return node;
  }

  static makeOscillator(audioContext, type, freq) {
    //todo convert the factory methods to constructors as specified by MDN
    const oscillator = audioContext.createOscillator();
    oscillator.type = type;
    setAudioParameter(oscillator.frequency, freq);
    // oscillator.frequency.value = freq);
    oscillator.start();
    return oscillator;
  }

  static lowpass(ctx, freq, q, detune) {
    return InterpreterFunctions.makeFilter(ctx, "lowpass", {freq, q, detune});
  }

  static highpass(ctx, freq, q, detune) {
    return InterpreterFunctions.makeFilter(ctx, "highpass", {freq, q, detune});
  }

  static bandpass(ctx, freq, q, detune) {
    return InterpreterFunctions.makeFilter(ctx, "bandpass", {freq, q, detune});
  }

  static lowshelf(ctx, freq, gain, detune) {
    return InterpreterFunctions.makeFilter(ctx, "lowshelf", {freq, gain, detune});
  }

  static highshelf(ctx, freq, gain, detune) {
    return InterpreterFunctions.makeFilter(ctx, "highshelf", {freq, gain, detune});
  }

  static peaking(ctx, freq, q, gain, detune) {
    return InterpreterFunctions.makeFilter(ctx, "peaking", {freq, q, gain, detune});
  }

  static notch(ctx, freq, q, detune) {
    return InterpreterFunctions.makeFilter(ctx, "notch", {freq, q, detune});
  }

  static allpass(ctx, freq, q, detune) {
    return InterpreterFunctions.makeFilter(ctx, "allpass", {freq, q, detune});
  }

  static makeFilter(audioContext, type, p) {
    //todo factory vs constructor: https://developer.mozilla.org/en-US/docs/Web/API/AudioNode#Creating_an_AudioNode
    //todo the problem is that this is difficult to do if the parameter is an audio envelope represented as an array.
    const filterNode = audioContext.createBiquadFilter();
    filterNode.type = type;
    setAudioParameter(filterNode.frequency, p.freq);
    setAudioParameter(filterNode.Q, p.q);
    setAudioParameter(filterNode.gain, p.gain);
    setAudioParameter(filterNode.detune, p.detune);
    return filterNode;
  }

  /**
   * url(https://some.com/sound.file) plays the sound file once
   * url(https://some.com/sound.file, 1) plays the sound file in a loop
   */
  static async url(ctx, url, loop) {
    const data = await AudioFileRegister.getFileBuffer(url.value);
    const bufferSource = ctx.createBufferSource();
    bufferSource.buffer = await ctx.decodeAudioData(data);
    bufferSource.loop = !!loop;
    bufferSource.start();
    return bufferSource;
  }

  static async noise(ctx) {
    const noise = ctx.createBufferSource();
    noise.buffer = AudioFileRegister.noise();
    noise.loop = true;
    noise.start();
    return noise;
  }
}

const SyntacticArrays = Object.create(null);
SyntacticArrays["/"] = function (ctx, ...args) {
  return args;
};

SyntacticArrays[","] = function (ctx, ...args) {
  return args;
};

const Pipe = Object.create(null);
Pipe[">"] = function (ctx, ...nodes) {
  for (let i = 0; i < nodes.length - 1; i++) {
    let n = nodes[i + 1];
    let m = nodes[i];
    m = m instanceof Array ? m : [m];
    n = n instanceof Array ? n : [n];
    for (let a of m) {
      for (let b of n) {
        if (!a instanceof AudioNode)
          throw new SyntaxError("CssAudioNode cannot be: " + a);
        if (!b instanceof AudioNode)
          throw new SyntaxError("CssAudioNode cannot be: " + b);
        a.connect(b);
      }
    }
  }
  return nodes[nodes.length - 1];
};

async function interpretArray(input, ctx, table) {
  let output;
  for (let i = 0; i < input.length; i++) {
    let newNode = await interpretNode(ctx, input[i], table);
    if (newNode === input[i])
      continue;
    if (!output)
      output = input.slice(0);
    output[i] = newNode;
  }
  return output || input;
}

/**
 * The interpretNode function gradually turns the ast graph into an audioNode graph.
 * The final step, pipe, produces a single AudioNode or an array of AudioNodes. It is processed
 * in layers, depending on the priority of the given expression or function interpretation.
 * Each layer is produces immutable object graphs that can be reused when needed.
 *
 * The layers priority are:
 * 0. Syntactic primitives: [,,] and / arrays.
 * todo !!!I feel like I should revert and make [,,] and x/y into syntactic sugar for arrays again!!!
 * 1. pure functions 1-5: "random" and "cof". These functions are pure, they produce an output based on input only,
 *    no side effects. Other examples are convertion of Note values, such as A4 to 440hz.
 * 2. AudioNode production: "sine(..)", "lowpass(..)". Producing AudioNodes require an audio ctx.
 * 3. Piping: connecting the AudioNodes in a graph. This does not technically require an audio ctx,
 *    as the audio ctx is already baked into the AudioNodes.
 *
 * Each layer is processed bottom up.
 *
 * @param ctx audio context if needed
 * @param node currently being processed
 * @param table of functions
 * @returns the node being processed against the current function table
 *          The Promise of an array of the end AudioNode(s).
 */
async function interpretNode(ctx, node, table) {
  if (node instanceof Array)
    return await interpretArray(node, ctx, table);
  //bottom processed first
  let args = node.args;
  if (args)                          //if the node is a function or expression, process its arguments first
    args = await interpretArray(args, ctx, table);
  const match = table[node.type];
  if (match)                                //try to execute the function using table and arguments
    return await (args instanceof Array ? match(ctx, ...args) : match(ctx));
  if (args === node.args)
    return node;                              //if not, just return the node with arguments processed
  let newNode = Object.assign({}, node);
  newNode.args = args;
  return newNode;
}

const cachedResults = {};

export class InfiniteSound extends AudioContext {

  static async load(sound) {
    let result;
    result = cachedResults[sound];
    if (!result) {
      result = parse(sound);
      for (let table of [SyntacticArrays, TranslateFunctionsOne, Notes])
        result = await interpretNode(null, result, table);
      cachedResults[sound] = result;
    }
    //todo implement a table that gets the CSS variables

    //turn the result into an Offline AudioBuffer that we can reuse..
    /**
     * todo 0. Reuse the processing. To do that we need to analyze it into an ArrayBuffer. That can be reused.
     * todo    But, to convert it into an ArrayBuffer, we need to know when the sound is off.. To know that, we either
     * todo    need to have a "off(endtime)", or analyze a "gain()" expression, in the main pipe, verify that no source
     * todo    nodes are added after it, and check if it ends with 0 (which only can be done in an envelope or a fixed
     * todo    value), and then calculate the duration of the gain with sound. then summarize the duration of that gain.
     * todo
     * todo max. can we use offlineAudioCtx to make an ArrayBuffer of a sound, to make it faster to play back?
     */
    const ctx = new InfiniteSound();
    for (let table of [TranslateFunctionsTwo, InterpreterFunctions, Pipe])
      result = await interpretNode(ctx, result, table);
    if (result instanceof Array) {
      for (let audioNode of result) {
        audioNode.connect(ctx.destination);
      }
    } else
      result.connect(ctx.destination);
    return ctx;
  }

  constructor() {
    super();
    this.suspend();
  }
}