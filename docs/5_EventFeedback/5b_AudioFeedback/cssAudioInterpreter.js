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
    var bufferSource = audioCtx.createBufferSource();
    var file = await fetch(url);
    var data = await file.arrayBuffer();
    audioCtx.decodeAudioData(data, decodedData => bufferSource.buffer = decodedData);
    return bufferSource;
  }
}

function connectMtoN(m, n) {
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

async function interpretPipe(pipe) {
  const nodes = [];
  for (let node of pipe.nodes) {
    node = await interpretNode(node);
    node = node instanceof Array ? node : [node];
    nodes.push(node);
  }
  for (let i = 0; i < nodes.length - 1; i++)
    connectMtoN(nodes[i], nodes[i + 1]);
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
async function interpretNode(node) {
  if (node.type === "pipe")
    return await interpretPipe(node);
  if (node instanceof Array) {
    const res = [];
    for (let item of node) {
      item = await interpretNode(item);
      res.push(item);
    }
    return res;
  }
  if (node.type === "fun") {
    const args = [];
    for (let item of node.args) {
      item = await interpretNode(item);
      args.push(item);
    }
    return await makeNode(node.name, args);
  }
  if (typeof node === "string")
    return await makeNode(node);
  throw new Error("omg? wtf? " + node)
}

async function makeNode(name, args) {
  return InterpreterFunctions[name] ? await InterpreterFunctions[name](audioCtx, ...args) : name;
}

let audioCtx;

function startNodes(node) {
  if (node.inputs) {
    for (let child of node.inputs)
      startNodes(child);
  }
  node.start && node.start();
}

export async function interpret(str, ctx) {
  audioCtx = ctx;
  const ast = parse(str);
  const audioNodes = await interpretPipe(ast);
  connectMtoN(audioNodes, [ctx.destination]);
  startNodes(ctx.destination);
  return audioNodes;
}