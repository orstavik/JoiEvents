import {parse} from "./Parser.js";
import {Notes} from "./LibNotes.js";
import {Random} from "./LibRandom.js";
import {InterpreterFunctions} from "./LibAudioNodes.js";
import {ScaleFunctions} from "./LibCircleOfFifth.js";

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

/*
* the parser should maybe specify if there is a list of urls, or a list of css variables, or a list of expressions.
* if we return such lists, then we do not need to iterate the tree, we only need to iterate the different lists.
* this is more efficient, but it gives us to parallel structures.
* we don't have one source of truth, we have two.

* --my-audio: sine($1) > gain([1/0.015, $2/0.01, $2/$3, 0/0.3])
* --play-note: --my-audio(F4, 0.8, 2.3) > gain(0.7)
*
"--my-audio(F4, 0.8, 2.3)".replace(/--[\w]+\(([^,]*,)/, myAudio)

**/

var rxs = [/\$1/, /\$2/, /\$3/, /\$4/, /\$5/];

const VariableResolver = Object.create(null);
VariableResolver["--"] = function (ctx, node) {
  //the context in is a table with variables.
  const varName = node.varName;
  let varText = ctx[varName];
  const args = node.args;
  //todo the problem is that the arguments in a variable function are processed, but only needed as strings.
  //todo, thus, it would be better if the variable expression is completely parsed, and then variables are only saved as
  //todo pointers. But.. This would add a great deal of complexity.. or.. how would it look.

  //a --var would point to another Node. this node can be something as simple as a number or a piece of text, but it can also be a whole pipe.
  //a $variable points the other way round. it points to a Node that was the argument of a --variable function.
  //the problem is cyclical references, that can go via third parties. This means that when a variable is resolved
  //it should be added to a blacklist or removed from the ctx table of available variables.

  //otherwise, we only need to add a link to variable functions. And then we can flatten everything when we finish.
  //or, we flatten immediately, and then remove variables from the ctx.
  //yeah, it is doable)

  for (let i = 0; i < args.length; i++){
    //if the variable is in front of a (),
    //then that means the thing replacing it must be a string, otherwise variable error
    varText = varText.replace(rxs[i], args[i]);
  }
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
 * 1. pure functions 1-5: CircleOfFifth and Notes. These functions are pure, they produce an output based on input only,
 *    no side effects. Notes convert values, such as A4 to 440hz.
 * 2. random.
 * 3. AudioNode production: "sine(..)", "lowpass(..)". Producing AudioNodes require an audio ctx.
 * 4. Piping: connecting the AudioNodes in a graph. This does not technically require an audio ctx,
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
    //todo here I can unwrap complex string objects that will be used as argument strings.
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
      cachedResults[sound] = result;
      //todo replace CSS variables here?
      //todo and then check if there is a cached result again?
    }

    //todo I can't split the tables in individual passes.. It doesn't work. I have to make them run at the same time.
    //todo the problem is the

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

    //todo merge the function tables..
    const functions = Object.assign({}, ScaleFunctions, Notes, Random, InterpreterFunctions, Pipe);
    // for (let table of [ScaleFunctions, Notes])
    //   result = await interpretNode(null, result, table);
    // for (let table of [Random, InterpreterFunctions, Pipe])
    // for (let table of functions)
      result = await interpretNode(ctx, result, functions);
      // result = await interpretNode(ctx, result, Pipe);

    if (result instanceof Array) {
      for (let audioNode of result) {
        audioNode.connect(ctx.specialGain);
      }
    } else
      result.connect(ctx.specialGain);
    return ctx;
  }

  constructor() {
    super();
    this.specialGain = this.createGain();
    this.specialGain.gain.value = 1;
    this.specialGain.connect(this.destination);
    this.suspend();
  }

  stop() {
    console.log("boo");
    if (location.hash === "linear") {
      this.specialGain.gain.linearRampToValueAtTime(0.0001, this.currentTime + 0.03);
    } else if (location.hash === "exponential") {
      this.specialGain.gain.exponentialRampToValueAtTime(0.0001, this.currentTime + 0.03);
    } else if (location.hash === "absolute") {
      this.specialGain.gain.value = 0;
    } else {
      this.specialGain.gain.setTargetAtTime(0, this.currentTime, 0.015);
    }
    setTimeout(() =>
      super.suspend(), 100);
  }

  //http://alemangui.github.io/blog//2015/12/26/ramp-to-value.html
  /**
   * This method tries to avoid a change in the sound when one audio context replaces another.
   * todo there is still a crackle in the sound.. It is not very big, but it is there.
   * todo it might be considered a feature that the sound gets a slight bump when one sound replace another,
   * todo as this is likely to represent some kind of change in the app state, relevant for the user to be
   * todo notified of.
   * @param ctx
   */
  replace(ctx) {
    ctx.stop();
    if (location.hash === "linear") {
      this.specialGain.gain.linearRampToValueAtTime(1, this.currentTime + 0.03);
    } else if (location.hash === "exponential") {
      this.specialGain.gain.exponentialRampToValueAtTime(1, this.currentTime + 0.03);
    } else if (location.hash === "absolute") {
      this.specialGain.gain.value = 1;
    } else {
      this.specialGain.gain.setTargetAtTime(1, this.currentTime, 0.015);
    }
    this.resume();
  }
}