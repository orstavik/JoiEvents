import {parse} from "./cssAudioParser.js";

function plotEnvelope(target, points) {
  target.value = 0;
  let nextStart = 0;
  for (let point of points) {
    let vol = parseFloat(point[0].num);
    let time = parseFloat(point[1].num);
    if (point[1].unit === "" || point[1].unit === "e")
      target.setTargetAtTime(vol, nextStart, time / 4);   //todo or /3? as mdn suggests
    else
      throw new Error("todo: implement 'l' or 'a' type of time coordinate.");
    nextStart += time;
  }
}

function setAudioParameter(target, param) {
  if (param instanceof AudioNode) {
    param.connect(target);
  } else if (param.hasOwnProperty("num")) {
    //todo if the number is not parsed outside, then the units will be universal to all nodes..
    //todo I have not implemented any interpretation of "Hz" or "db" or "ms" or whatever
    target.value = parseFloat(param.num);
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

class AudioFileRegister {
  static async getFileBuffer(url) {
    let cache = cachedFiles[url];
    if (!cache) {
      const file = await fetch(url);
      cache = cachedFiles[url] = await file.arrayBuffer();
    }
    return cache.slice();//att! must use .slice() to avoid depleting the ArrayBuffer
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
    // oscillator.frequency.value = parseFloat(freq);
    oscillator.start();
    return oscillator;
  }

  static lowpass(ctx, freq, q) {
    return InterpreterFunctions.makeFilter(ctx, "lowpass", freq, q);
  }

  static highpass(ctx, freq, q) {
    return InterpreterFunctions.makeFilter(ctx, "highpass", freq, q);
  }

  static makeFilter(audioContext, type, freq, q) {
    //todo convert the factory methods to constructors as specified by MDN
    const filterNode = audioContext.createBiquadFilter();
    filterNode.type = type;
    if (freq.hasOwnProperty("num")) {
      filterNode.frequency.value = parseFloat(freq.num);
    }
    if (q.hasOwnProperty("num")) {
      filterNode.Q.value = parseFloat(q.num);
    }
    return filterNode;
  }

  static async url(audioCtx, url) {
    const data = await AudioFileRegister.getFileBuffer(url);
    const bufferSource = audioCtx.createBufferSource();
    bufferSource.buffer = await audioCtx.decodeAudioData(data);
    bufferSource.start();
    return bufferSource;
  }
}

class CssAudioInterpreterContext {

  static connectMtoN(m, n) {
    for (let a of m) {
      for (let b of n) {
        if (!a instanceof AudioNode)
          throw new SyntaxError("CssAudioNode cannot be: " + a);
        if (!b instanceof AudioNode)
          throw new SyntaxError("CssAudioNode cannot be: " + b);
        a.connect(b);
        //todo calling start inside all source nodes now, as the ctx passed in is suspended before being populated.
        // let inputs = b.inputs || (b.inputs = []);
        // inputs.push(a);
      }
    }
  }

  static async interpretPipe(ctx, pipe) {
    const nodes = [];
    for (let node of pipe.nodes) {
      node = await CssAudioInterpreterContext.interpretNode(ctx, node);
      node = node instanceof Array ? node : [node];
      nodes.push(node);
    }
    for (let i = 0; i < nodes.length - 1; i++)
      CssAudioInterpreterContext.connectMtoN(nodes[i], nodes[i + 1]);
    return nodes.pop();
  }

  /**
   * todo 0. Reuse the propcessing. To do that we need to analyze it into an ArrayBuffer. That can be reused.
   * todo    But, to convert it into an ArrayBuffer, we need to know when the sound is off.. To know that, we either
   * todo    need to have a "off(endtime)", or analyze a "gain()" expression, in the main pipe, verify that no source
   * todo    nodes are added after it, and check if it ends with 0 (which only can be done in an envelope or a fixed
   * todo    value), and then calculate the duration of the gain with sound. then summarize the duration of that gain.
   * todo
   * todo 1. cache the url audio in some way, so that it doesn't need to fetch it anymore? keep the sound in memory. should/can this be done to all audio nodes? can i clone an audio node?
   * todo a. make this recursive instead? first pipe, then array, then node, then argument? but I don't need argument, as it has already been processed?
   *
   * @param node
   * @returns {Promise.<*>}
   */
  static async interpretNode(ctx, node) {
    if (node.type === "pipe")
      return await CssAudioInterpreterContext.interpretPipe(ctx, node);
    if (node instanceof Array) {
      const res = [];
      for (let item of node) {
        item = await CssAudioInterpreterContext.interpretNode(ctx, item);
        res.push(item);
      }
      return res;
    }
    if (node.type === "fun") {
      const args = [];
      for (let item of node.args) {
        item = await CssAudioInterpreterContext.interpretNode(ctx, item);
        args.push(item);
      }
      return await CssAudioInterpreterContext.makeNode(ctx, node.name, args);
    }
    if (node.hasOwnProperty("num")) {
      return node;
    }
    if (typeof node === "string")
      return await CssAudioInterpreterContext.makeNode(ctx, node);
    throw new Error("omg? wtf? " + node)
  }

  static async makeNode(ctx, name, args) {
    return InterpreterFunctions[name] ? await InterpreterFunctions[name](ctx, ...args) : name;
  }

  //todo not using this any more, since I think the web audio api better supports making new context objects and nodes
  //todo for every sound. If the context is suspended() before they are populated, then calling resume() will essentially
  //todo "start" them.
  //todo the remaining problem is cleaning up AudioContext objects that are finished. I need to know when I can delete them.
  // static startNodes(node) {
  //   if (node.inputs) {
  //     for (let child of node.inputs)
  //       CssAudioInterpreterContext.startNodes(child);
  //   }
  //   node.start && node.start();
  // }
}

export async function interpret(str) {
  const ast = parse(str);
  const ctx = new AudioContext();
  ctx.suspend();
  const audioNodes = await CssAudioInterpreterContext.interpretPipe(ctx, ast);
  CssAudioInterpreterContext.connectMtoN(audioNodes, [ctx.destination]);
  return ctx;
}

// export async function interpret2(str) {
//   const ast = parse(str);
//   const ctx = new OfflineAudioContext(2,44100*40,44100);
//   const audioNodes = await CssAudioInterpreterContext.interpretPipe(ctx, ast);
//   CssAudioInterpreterContext.connectMtoN(audioNodes, [ctx.destination]);
//   CssAudioInterpreterContext.startNodes(ctx.destination);
//   const audioBuffer = await ctx.startRendering();
//   return audioBuffer;
// }