export const MathOps1 = Object.create(null);
MathOps1.topDown = {"^": 1};
MathOps1.topDownAndBottomUp = {};

export const MathOps2 = Object.create(null);
MathOps2.topDown = {"+": 1, "-": 1};
MathOps2.topDownAndBottomUp = {};

MathOps1["+"] = function (n) {
  if (typeof n.left === "number" && typeof n.right === "number")
    return n.left + n.right;
  if (typeof n.left === "string" && typeof n.right === "string")
    return n.left + n.right;
  if (typeof n.left === "number" && n.right && typeof n.right.left === "number") {
    const sum = n.left + n.right.left;
    return {type: n.right.type, left: sum, right: n.right.right};
  }
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

MathOps1["-"] = function (n) {
  if (typeof n.left === "number" && typeof n.right === "number")
    return n.left - n.right;
  if (typeof n.left === "number" && n.right && typeof n.right.left === "number") {
    const sum = n.left - n.right.left;
    return {type: n.right.type, left: sum, right: n.right.right};
  }
  //todo research regex for strings -, do a replace //g with the right side argument?
  //if there are two notes?
  return n;
};


MathOps1["*"] = function (n) {
  if (typeof n.left === "number" && typeof n.right === "number")
    return n.left * n.right;
  if (typeof n.left === "number" && n.right && typeof n.right.left === "number") {
    const product = n.left * n.right.left;
    return {type: n.right.type, left: product, right: n.right.right};
  }
  //if there are two notes?
  return n;
};

MathOps1["/"] = function (n) {
  if (typeof n.left === "number" && typeof n.right === "number")
    return n.left / n.right;
  if (typeof n.left === "number" && n.right && typeof n.right.left === "number") {
    return {
      type: n.right.type,
      left: n.left / n.right.left,
      right: n.right.right
    };
  }
  //if there are two notes?
  return n;
};

MathOps1["^"] = function (n) {
  if (typeof n.left === "number" && typeof n.right === "number")
    return Math.pow(n.left, n.right);
  //if there are two notes?
  return n;
};

MathOps1["^^"] = function (n) {
  if (typeof n.left === "number" && typeof n.right === "number")
    return n.left * Math.pow(2, n.right);
  // if (typeof n.left.type === "note" && typeof n.right.type === "number") //todo
  //   return left up right octaves;                                        //todo
  return n;
};
MathOps1["^*"] = function (n) {
  if (typeof n.left === "number" && typeof n.right === "number")
    return n.left * Math.pow(1.5, n.right);
  // if (typeof n.left.type === "note" && typeof n.right.type === "number") //todo
  //   return note left turned right on the circle of fifth;                //todo
  return n;
};

/*
MathOps1["^~"] = function (n) {
  // if (typeof n.left.type === "note" && typeof n.right.type === "number") //todo
  //   return note left turned right on the mode scale;                //todo
  return n;
};

MathOps1["^+"] = function (n) {
  if (typeof n.left === "number" && typeof n.right === "number")
    return n.left * Math.pow(1.5, n.right);
  // if (typeof n.left.type === "note" && typeof n.right.type === "number") //todo
  //   return note left turned right on the mode scale;                //todo
  return n;
};
*/