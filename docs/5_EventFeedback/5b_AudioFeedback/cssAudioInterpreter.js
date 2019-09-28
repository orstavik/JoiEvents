import {parse} from "./cssAudioParser.js";

class InterpreterFunctions {

  static sine(ctx, freq){
    return InterpreterFunctions.makeOscillator(ctx, "sine", freq);
  }

  static square(ctx, freq){
    return InterpreterFunctions.makeOscillator(ctx, "square", freq);
  }

  static sawtooth(ctx, freq){
    return InterpreterFunctions.makeOscillator(ctx, "sawtooth", freq);
  }

  static triangle(ctx, freq){
    return InterpreterFunctions.makeOscillator(ctx, "triangle", freq);
  }

  static makeOscillator(audioContext, type, freq) {
    const oscillator = audioContext.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = parseFloat(freq);
    oscillator.start();
    return oscillator;
  }

  static lowpass(ctx, freq, q){
    return InterpreterFunctions.makeFilter(ctx, "lowpass", freq, q);
  }

  static highpass(ctx, freq, q){
    return InterpreterFunctions.makeFilter(ctx, "highpass", freq, q);
  }

  static makeFilter(audioContext, type, freq, q) {
    const filterNode = audioContext.createBiquadFilter();
    filterNode.type = type;
    filterNode.frequency.value = parseFloat(freq);
    filterNode.Q.value = parseFloat(q);
    return filterNode;
  }

  static async url(audioCtx, url) {
    var bufferSource = audioCtx.createBufferSource();
    // bufferSource.connect(audioCtx.destination);
    var file = await fetch(url);
    var data = await file.arrayBuffer();
    audioCtx.decodeAudioData(data, decodedData => {
      bufferSource.buffer = decodedData;
      bufferSource.start();
    });
    return bufferSource;
  }
}

function connectMtoN(m, n) {
  for (let a of m) {
    for (let b of n) {
      //todo test for a and b to be AudioNode
      //todo add special rules here for where the connect is called?
      a.connect(b);
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
 * todo 0. call start outside of the audio nodes, so that they are easier to reuse.
 * todo 1. cache the url audio in some way, so that it doesn't need to fetch it anymore? keep the sound in memory. should/can this be done to all audio nodes? can i clone an audio node?
 * todo a. make this recursive instead? first pipe, then array, then node, then argument? but I don't need argument, as it has already been processed?
 *
 * @param node
 * @returns {Promise.<*>}
 */
async function interpretNode(node) {
  if (node.type === "pipe")
    return await interpretPipe(node);
  if (node instanceof Array){
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

export async function interpret(str, ctx) {
  audioCtx = ctx;
  const ast = parse(str);
  const audioNodes = await interpretPipe(ast);
  for (let node of audioNodes)
    node.connect(ctx.destination);
  return audioNodes;
}