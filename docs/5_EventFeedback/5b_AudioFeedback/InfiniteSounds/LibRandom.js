export const Random = {};
/**
 * random(array) will return a random entry from the array.
 * random(a) will return a random value between 0 and the number "a".
 * random(,a) will return a random value between 0 and the number "a".
 * random(a, b) will return a random value the numbers "a" and "b".
 * random(a, b, step) will return a random "step" between numbers "a" and "b".
 */
Random.random = function (node) {
  let [a, b, steps] = node.body;
  if (a instanceof Array)
    return a[Math.floor(Math.random() * a.length)];
  if (a === undefined && b === undefined && steps === undefined)
    return Math.random();
  if (typeof a === "number" && b === undefined && steps === undefined)
    return Math.random() * a;
  a = a === undefined ? 0 : a;
  if (typeof a === "number" && typeof b === "number" && steps === undefined)
    return (Math.random() * (b - a)) + a;
  if (steps < 0)
    throw new SyntaxError("Random function broken, illegal parameter: step must be a positive number" + steps);
  if (typeof a === "number" && typeof b === "number" && typeof steps === "number")
    return (Math.round((Math.random() * (b - a)) / steps) * steps) + a;
  throw new SyntaxError("Random function broken, illegal parameters: " + n);
};

export const Translations = {};

//todo maybe alter this one to simply add four arguments to the sine, square, etc
//lfo(hz=1, type=sine, min=0, max=1).
Translations.lfo = function (node, ctx) {
  let [frequency = 1, type = "sine", min = 0, max = 1] = node.body;
  if (typeof frequency !== "number")
    throw new SyntaxError("First argument of lfo() must be a number for the frequency, commonly 1-5, defaults to 1.");
  if (!(type === "sine" || type === "square" || type === "triangle" || type === "sawtooth"))
    throw new SyntaxError("Second argument of lfo() must be either 'sine', 'sqaure', 'triangle', 'sawtooth'.");
  if (typeof max !== "number" || typeof min !== "number")
    throw new SyntaxError("Third and forth argument of lfo() must be numbers for the max and min oscillation.");
  let diff = max - min;
  if (type === "sine")
    diff /= 2;

  return {
    type: ">",
    body: [
      {
        type: "[]",
        body: [
          {type: "constant", body: [min]},
          {
            type: ">",
            body: [
              {type: "oscillator", body: [type, frequency]},
              {type: "gain", body: [diff]}
            ]
          }
        ]
      },
      {type: "gain", body: [1]}
    ]
  }
};

Translations.noise = function (node, ctx) {
  const [dur = 3, sampleRate = 44100] = node.body;
  return {type: "url", body: [{type: "#", body: [undefined, "noise:" + dur + ":" + sampleRate]}, 1]};
};

Translations.convolver = function (node, ctx) {
  if (node.body.length === 0)
    node.body[0] = {
      type: "#",
      body: [
        undefined,
        "https://raw.githack.com/orstavik/JoiEvents/master/docs/5_EventFeedback/5b_AudioFeedback/InfiniteSounds/test/convolver.json"
      ]
    };
  return node;
};

Translations.mute = function (node, ctx) {
  node.type = "gain";
  node.body[0] = 0;
  return node;
};

Translations.sine = function (node, ctx) {
  node.type = "oscillator";
  node.body.unshift("sine");
  return node;
};
Translations.triangle = function (node, ctx) {
  node.type = "oscillator";
  node.body.unshift("triangle");
  return node;
};
Translations.square = function (node, ctx) {
  node.type = "oscillator";
  node.body.unshift("square");
  return node;
};
Translations.sawtooth = function (node, ctx) {
  node.type = "oscillator";
  node.body.unshift("sawtooth");
  return node;
};

//lowpass(frequency, q, detune) => filter("lowpass", frequency, q, null, detune)
Translations.lowpass = function (node, ctx) {
  node.type = "filter";
  node.body.unshift("lowpass");
  node.body.splice(2, 0, undefined);
  return node;
};
//highpass(frequency, q, detune) => filter("highpass", frequency, q, null, detune)
Translations.highpass = function (node, ctx) {
  node.type = "filter";
  node.body.unshift("highpass");
  node.body.splice(2, 0, undefined);
  return node;
};
//bandpass(frequency, q, detune) => filter("bandpass", frequency, q, null, detune)
Translations.bandpass = function (node, ctx) {
  node.type = "filter";
  node.body.unshift("bandpass");
  node.body.splice(2, 0, undefined);
  return node;
};
//allpass(frequency, q, detune) => filter("allpass", frequency, q, null, detune)
Translations.allpass = function (node, ctx) {
  node.type = "filter";
  node.body.unshift("allpass");
  node.body.splice(2, 0, undefined);
  return node;
};
//notch(frequency, q, detune) => filter("notch", frequency, q, null, detune)
Translations.notch = function (node, ctx) {
  node.type = "filter";
  node.body.unshift("notch");
  node.body.splice(2, 0, undefined);
  return node;
};
//lowshelf(frequency, gain, detune) => filter("lowshelf", frequency, null, gain, detune)
Translations.lowshelf = function (node, ctx) {
  node.type = "filter";
  node.body.unshift("lowshelf");
  node.body.splice(1, 0, undefined);
  return node;
};
//highshelf(frequency, gain, detune) => filter("highshelf", frequency, null, gain, detune)
Translations.highshelf = function (node, ctx) {
  node.type = "filter";
  node.body.unshift("highshelf");
  node.body.splice(1, 0, undefined);
  return node;
};
//peaking(frequency, q, gain, detune) => filter("peaking", frequency, q, null, detune)
Translations.peaking = function (node, ctx) {
  node.type = "filter";
  node.body.unshift("peaking");
  return node;
};