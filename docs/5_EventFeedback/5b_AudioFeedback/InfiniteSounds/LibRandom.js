export const Random = {};
/**
 * random(array) will return a random entry from the array.
 * random(a) will return a random value between 0 and the number "a".
 * random(a, b) will return a random value the numbers "a" and "b".
 * random(a, b, step) will return a random "step" between numbers "a" and "b".
 */
Random.topDown = {};
Random.random = function ({body: [a, b, steps]}) {
  if (a instanceof Array)
    return a[Math.floor(Math.random() * a.length)];
  if (typeof a === "number" && b === undefined && steps === undefined)
    return Math.random() * a;
  if (typeof a === "number" && typeof b === "number" && steps === undefined)
    return (Math.random() * (b - a)) + a;
  if (steps < 0)
    throw new SyntaxError("Random function broken, illegal parameter: step must be a positive number" + steps);
  if (typeof a === "number" && typeof b === "number" && typeof steps === "number")
    return (Math.round((Math.random() * (b - a)) / steps) * steps) + a;
  if (a === undefined  && typeof b === "number" && typeof steps === "number")
    return Math.round((Math.random() * b) / steps) * steps;
  throw new SyntaxError("Random function broken, illegal parameters: " + n);
};
