export const MathOps = Object.create(null);

MathOps["+"] = function (n) {
  let left = n.body[0];
  let right = n.body[1];
  if (typeof left === "number" && typeof right === "number")
    return left + right;
  if (typeof left === "string" && typeof right === "string")
    return left + right;
  //if there are two quotes, then merge it into a single quote.
  //if there are two notes?
  //if there are two names without body, merge into a single name
  return n;
};

//priorities, first the setting of musical keys
//1. ~= setting the key
//2. ^^ morphing the scale
//2. ^~ morphing the key circle of fifth
//2. ^~~ morphing the mode
//3. up a tone in the scale of

MathOps["-"] = function (n) {
  let left = n.body[0];
  let right = n.body[1];
  if (typeof left === "number" && typeof right === "number")
    return left - right;
  //todo research regex for strings -, do a replace //g with the right side argument?
  //if there are two notes?
  return n;
};


MathOps["*"] = function (n) {
  let left = n.body[0];
  let right = n.body[1];
  if (typeof left === "number" && typeof right === "number")
    return left * right;
  //if there are two notes?
  return n;
};

MathOps["/"] = function (n) {
  let left = n.body[0];
  let right = n.body[1];
  if (typeof left === "number" && typeof right === "number")
    return left / right;
  //if there are two notes?
  return n;
};

MathOps["^"] = function (n) {
  let left = n.body[0];
  let right = n.body[1];
  if (typeof left === "number" && typeof right === "number")
    return Math.pow(left, right);
  //if there are two notes?
  return n;
};

MathOps["^^"] = function (n) {
  const [l, r] = n.body;
  if (typeof l === "number" && typeof r === "number")
    return l * Math.pow(2, r);
  return n;
};

MathOps["^/"] = function (n) {
  const [l, r] = n.body;
  if (typeof l === "number" && typeof r === "number")
    return l * Math.pow(Math.pow(Math.pow(2, 1 / 12), 7), r);
  return n;
};

/*
MathOps["^~"] = function (n) {
  // if (typeof n.left.type === "note" && typeof n.right.type === "number") //todo
  //   return note left turned right on the mode scale;                //todo
  return n;
};

MathOps["^+"] = function (n) {
  if (typeof n.left === "number" && typeof n.right === "number")
    return n.left * Math.pow(1.5, n.right);
  // if (typeof n.left.type === "note" && typeof n.right.type === "number") //todo
  //   return note left turned right on the mode scale;                //todo
  return n;
};
*/