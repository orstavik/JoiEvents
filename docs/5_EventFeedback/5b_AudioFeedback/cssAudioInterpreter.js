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

function interpretPipe(pipe) {
  const nodes = pipe.nodes
    .map(node => interpretNode(node))
    .map(node => node instanceof Array ? node : [node]);
  for (let i = 0; i < nodes.length - 1; i++)
    connectMtoN(nodes[i], nodes[i + 1]);
  return nodes.pop();
}

function interpretNode(node) {
  if (node.type === "pipe")
    return interpretPipe(node);
  if (node instanceof Array)
    return node.map(item => interpretNode(item));
  if (node.type === "fun") {
    const args = node.args.map(arg => interpretNode(arg));
    return makeNode(node.name, args);
  }
  if (typeof node === "string")
    return makeNode(node);
  throw new Error("omg? wtf? " + node)
}

function makeOscillator(audioContext, type, freq) {
  const oscillator = audioContext.createOscillator();
  oscillator.type = type;
  oscillator.frequency.value = parseFloat(freq);
  oscillator.start(0);
  return oscillator;
}

function makeFilter(audioContext, type, freq, q) {
  const filterNode = audioContext.createBiquadFilter();
  filterNode.type = type;
  filterNode.frequency.value = parseFloat(freq);
  filterNode.Q.value = parseFloat(q);
  return filterNode;
}

function makeNode(name, args) {
  const audioNodes = {
    square: makeOscillator,
    sine: makeOscillator,
    sawtooth: makeOscillator,
    lowpass: makeFilter,
    highpass: makeFilter
  };
  if (audioNodes[name])
    return audioNodes[name](audioCtx, name, ...args);
  return name;
}

let audioCtx;

export function interpret(str, ctx) {
  audioCtx = ctx;
  const ast = parse(str);
  const audioNodes = interpretPipe(ast);
  for (let node of audioNodes)
    node.connect(ctx.destination);
  return audioNodes;
}