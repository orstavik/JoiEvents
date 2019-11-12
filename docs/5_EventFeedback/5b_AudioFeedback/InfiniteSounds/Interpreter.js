import {isPrimitive, parse} from "./Parser.js";
import {Random, Translations} from "./LibRandom.js";
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
const staticTable = mergeTables(ListOps, Units, MathOps, MusicMath, Translations);
//todo the static table produce a JSONable, pure data object.
//todo the dynamic table produce an object graph with particular classes.
//todo both lists children as body, as it enables the running of all in the same machines.
const dynamicTable = mergeTables(Random, MathOps, MusicMath, MusicDynamic, InterpreterFunctions, AudioPiping);

export async function interpretNode(node, table, ctx) {
  if (isPrimitive(node))
    return node;
  //topDown processing is possible here. Not supported due to complexity.
  let clone = Object.assign({}, node);
  clone.body = new Array(node.body.length);
  const nextCtx = [clone].concat(ctx);
  for (let i = 0; i < node.body.length; i++)
    clone.body[i] = await interpretNode(node.body[i], table, nextCtx);
  const fun = table[clone.type];
  if (fun)
    clone = await fun(clone, ctx);
  //todo at this point I can add parent to all children elements.  If I add parent here, it will become cyclical
  return clone;
}

//todo the functions always work on the clone. This means that they can and should not produce new objects,
//todo But alter existing clone during their performance. This is more efficient.
//todo For the static interpretation, this is good. It can be equally good for dynamic if I can pass a constructor in as the fun.
//todo which I think i can.

export async function staticInterpret(str) {
  let node = parse(str);
  node = {type: "DOCUMENT", body: [node], key: {type: "absNote", body: [48, "maj"]}};
  node = await interpretNode(node, staticTable, []);
  //variables: declare and replace
  //cache temporarily  //deepfreeze the nodes between caching to prevent functions doing something stupid?
  return node;
}

export async function interpret(str, ctx) {
  let pureMom = await staticInterpret(str);
  pureMom.webAudio = ctx;
  const dynaMom = await interpretNode(pureMom, dynamicTable, []);
  //todo start mom
  return dynaMom;
}