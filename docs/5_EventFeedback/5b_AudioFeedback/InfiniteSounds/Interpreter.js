import {isPrimitive, parse} from "./Parser.js";
import {Random} from "./LibRandom.js";
import {MathOps} from "./LibMath.js";
import {AudioPiping, ListOps} from "./LibSyntax.js";
import {InterpreterFunctions} from "./LibAudio.js";
import {MusicDynamic} from "./LibMusicDynamic.js";
import {MusicMath} from "./LibMusic.js";
import {Units} from "./LibUnits.js";

function mergeTables(...tables) {
  const res = {};
  for (let tab of tables) {
    for (let key in tab) {
      if (!(key in res))
        res[key] = tab[key];
      else {
        const funA = res[key];
        const funB = tab[key];
        res[key] = function (node, ctx) {
          const a = funA(node, ctx);
          return a === node ? funB(node, ctx) : a;
        }
      }
    }
  }
  return res;
}

//todo process units such as "b" (beats) dynamically, and tones needs the context to create their gain node. what to do with dB?
const staticTable = mergeTables(ListOps, Units, MathOps, MusicMath);
const dynamicTable = mergeTables(Random, MathOps, MusicMath, MusicDynamic, InterpreterFunctions, AudioPiping);

export async function interpretNode(node, table, ctx) {
  if (isPrimitive(node))
    return node;
  //topDown processing is possible here. Not supported due to complexity.
  const clone = Object.assign({}, node);
  clone.body = new Array(node.body.length);
  const nextCtx = [clone].concat(ctx);
  for (let i = 0; i < node.body.length; i++)
    clone.body[i] = await interpretNode(node.body[i], table, nextCtx);
  const fun = table[clone.type];
  return fun ? (await fun(clone, ctx)) : clone;
}

//the document is both an AbsClef and a bpm? It has all the properties of these?
//or, do I add those units as default nodes below, like head and title in an html file?
//If i add them like nodes, the tree will be a bit unrecognizable for the developer.
//If I lump it into the Document, then the needs of this document might need to grow.
//I choose the document, cannot foresee all complexity.
export async function staticInterpret(str) {
  let node = parse(str);
  node = {type: "DOCUMENT", body: [node], key: {type: "absNote", body: [48, "maj"]}};
  node = await interpretNode(node, staticTable, []);
  //variables: declare and replace
  //cache temporarily
  return node;
}

export async function interpret(str, ctx) {
  let node = await staticInterpret(str);
  //todo here I should append the audioContext to the DOCUMENT instead of sending it in as a root ctx
  node = await interpretNode(node, dynamicTable, [ctx]);
  return node;
}