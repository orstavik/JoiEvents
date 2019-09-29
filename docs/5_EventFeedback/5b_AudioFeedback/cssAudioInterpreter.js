import {parse} from "./cssAudioParser.js";

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

  static makeOscillator(audioContext, type, freq) {
    //todo convert the factory methods to constructors as specified by MDN
    const oscillator = audioContext.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = parseFloat(freq);
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
    filterNode.frequency.value = parseFloat(freq);
    filterNode.Q.value = parseFloat(q);
    return filterNode;
  }

  static async url(audioCtx, url) {
    const data = await InterpreterFunctions.getFileBuffer(url);
    const bufferSource = audioCtx.createBufferSource();
    audioCtx.decodeAudioData(data, decodedData => bufferSource.buffer = decodedData);
    return bufferSource;
  }

  //todo cache this buffer in the bufferMap
  static async getFileBuffer(url) {
    var file = await fetch(url);
    return await file.arrayBuffer();
  }
}

const bufferMap = {};

class CssAudioInterpreterContext {

  static connectMtoN(m, n) {
    for (let a of m) {
      for (let b of n) {
        if (!a instanceof AudioNode)
          throw new SyntaxError("CssAudioNode cannot be: " + a);
        if (!b instanceof AudioNode)
          throw new SyntaxError("CssAudioNode cannot be: " + b);
        a.connect(b);
        let inputs = b.inputs || (b.inputs = []);
        inputs.push(a);
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
   * todo 0. Can we reuse reuse the audio node or context?
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
    if (typeof node === "string")
      return await CssAudioInterpreterContext.makeNode(ctx, node);
    throw new Error("omg? wtf? " + node)
  }

  static async makeNode(ctx, name, args) {
    return InterpreterFunctions[name] ? await InterpreterFunctions[name](ctx, ...args) : name;
  }

  static startNodes(node) {
    if (node.inputs) {
      for (let child of node.inputs)
        CssAudioInterpreterContext.startNodes(child);
    }
    node.start && node.start();
  }
}

export async function interpret(str, ctx, startImmediately) {
  if (!startImmediately)
    ctx.suspend();
  const ast = parse(str);
  const audioNodes = await CssAudioInterpreterContext.interpretPipe(ctx, ast);
  CssAudioInterpreterContext.connectMtoN(audioNodes, [ctx.destination]);
  CssAudioInterpreterContext.startNodes(ctx.destination);
  return audioNodes;
}