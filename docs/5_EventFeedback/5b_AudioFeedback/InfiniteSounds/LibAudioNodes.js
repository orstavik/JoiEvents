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

export class InterpreterFunctions {

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