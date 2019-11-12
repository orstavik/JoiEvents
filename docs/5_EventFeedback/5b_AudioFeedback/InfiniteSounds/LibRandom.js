export const Random = {};
/**
 * random(array) will return a random entry from the array.
 * random(a) will return a random value between 0 and the number "a".
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
  if (typeof a === "number" && typeof b === "number" && steps === undefined)
    return (Math.random() * (b - a)) + a;
  if (steps < 0)
    throw new SyntaxError("Random function broken, illegal parameter: step must be a positive number" + steps);
  if (typeof a === "number" && typeof b === "number" && typeof steps === "number")
    return (Math.round((Math.random() * (b - a)) / steps) * steps) + a;
  if (a === undefined && typeof b === "number" && typeof steps === "number")
    return Math.round((Math.random() * b) / steps) * steps;
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
              {type: type, body: [frequency]},
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
  return {type: "gain", body: [0]};
};
