function numArgs(l, r) {
  return typeof l === "number" && typeof r === "number";
}

const a12 = Math.pow(2, 1 / 12);

export const MathOps = Object.create(null);

MathOps["+"] = function (n) {
  const [l, r] = n.body;
  if (l === undefined)
    return typeof r === "number" ? r : parseFloat(r);
  return numArgs(l, r) ? l + r : n;
};

MathOps["-"] = function (n) {
  const [l, r] = n.body;
  return numArgs(l, r) ? l - r : n;
};

MathOps["*"] = function (n) {
  const [l, r] = n.body;
  return numArgs(l, r) ? l * r : n;
};

MathOps["/"] = function (n) {
  const [l, r] = n.body;
  return numArgs(l, r) ? l / r : n;
};

MathOps["^"] = function (n) {
  const [l, r] = n.body;
  return numArgs(l, r) ? Math.pow(l, r) : n;
};

MathOps["^^"] = function (n) {
  const [l, r] = n.body;
  return numArgs(l, r) ? l * Math.pow(2, r) : n;
};

MathOps["^/"] = function (n) {
  const [l, r] = n.body;
  return numArgs(l, r) ? l * Math.pow(Math.pow(a12, 7), r) : n;
};

//x^+y mathematically means: X is num, Y is num, x*=2^(y/12)  or  x*= Math.pow(2, y/12)

MathOps["^+"] = function (n) {
  const [l, r] = n.body;
  return numArgs(l, r) ? l * Math.pow(2, r / 12) : n;
};

MathOps["^-"] = function (n) {
  const [l, r] = n.body;
  return numArgs(l, r) ? l / Math.pow(2, r / 12) : n;
};

/*
MathOps["^~"] = function (n) {
  // if (typeof l.type === "note" && typeof r.type === "number") //todo
  //   return note left turned right on the mode scale;                //todo
  return n;
};
*/
export const ArrayMathOps = Object.create(null);

function arrayNumber([a, b]) {
  if (a instanceof Array && typeof b === "number")
    return [a, b];
  if (b instanceof Array && typeof a === "number")
    return [b, a];
  return [];
}

ArrayMathOps["+"] = function (node) {
  const [array, num] = arrayNumber(node.body);
  return array ? array.map(n => n + num) : node;
};
ArrayMathOps["-"] = function (node) {
  const [array, num] = arrayNumber(node.body);
  return array ? array.map(n => n - num) : node;
};
ArrayMathOps["*"] = function (node) {
  const [array, num] = arrayNumber(node.body);
  return array ? array.map(n => n * num) : node;
};
ArrayMathOps["/"] = function (node) {
  const [array, num] = arrayNumber(node.body);
  return array ? array.map(n => n / num) : node;
};
ArrayMathOps["^"] = function (node) {
  const [array, num] = arrayNumber(node.body);
  return array ? array.map(n => Math.pow(n, num)) : node;
};
ArrayMathOps["^^"] = function (node) {
  const [array, num] = arrayNumber(node.body);
  return array ? array.map(n => n * Math.pow(2, num)) : node;
};
