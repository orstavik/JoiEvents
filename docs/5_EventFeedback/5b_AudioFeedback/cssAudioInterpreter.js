import {parse} from "./cssAudioParser.js";

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

function makeOscillator(audioContext, type, freq) {
  const oscillator = audioContext.createOscillator();
  oscillator.type = type;
  oscillator.frequency.value = parseFloat(freq);
  oscillator.start();
  return oscillator;
}

function makeFilter(audioContext, type, freq, q) {
  const filterNode = audioContext.createBiquadFilter();
  filterNode.type = type;
  filterNode.frequency.value = parseFloat(freq);
  filterNode.Q.value = parseFloat(q);
  return filterNode;
}

async function makeUrl(audioCtx, skip, url) {
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

async function makeNode(name, args) {
  const audioNodes = {
    square: makeOscillator,
    sine: makeOscillator,
    sawtooth: makeOscillator,
    lowpass: makeFilter,
    highpass: makeFilter,
    url: makeUrl              //async
  };
  if (audioNodes[name])
    return await audioNodes[name](audioCtx, name, ...args);
  return name;
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