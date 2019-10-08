export class Random {
  /**
   * random(array) will return a random entry from the array.
   * random(a) will return a random value between 0 and the number "a".
   * random(a, b) will return a random value the numbers "a" and "b".
   * random(a, b, step) will return a random "step" between numbers "a" and "b".
   */
  static random(ctx, a, b, steps) {
    if (a instanceof Array)
      return a[Math.floor(Math.random() * a.length)];
    let value;
    if (a.value && !b)
      value = Math.random() * a.value;
    else if (steps === undefined)
      value = Math.random() * (b.value - a.value) + b.value;
    else
      value = (Math.random() * ((b.value - a.value) / steps.value) * steps.value) + b.value;
    return {value: value, unit: a.unit};
  }
}