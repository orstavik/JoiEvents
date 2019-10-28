const tokens = [
  /([a-gA-G][#b]?)(\d+)?(?![_a-zA-Z\d#-])/,  //absolute notes: Fb, C#4, a4, a4, a0, ab, G, aB10 (not notes a-2, abb4, f##, f#b, a+3)
  /~~([+-]?\d+)/,                            //relative 12 notes: ~~1, ~~0, ~~6, ~~-2, ~~10, ~~-11
  /~([+-]?\d+)([#b]?)/,                      //relative 7 notes: ~1, ~0b, ~6#, ~-2, ~10b, ~-11b
  /~([a-gA-G])([#b]?)([+-]?\d+)?/,           //relative alpha notes: ~C, ~C1, ~C0, ~C-2, ~C+2
  /~|[_a-zA-Z][_a-zA-Z\d#-]*/,               //word:
  /--[_a-zA-Z][_a-zA-Z-]*/,                  //cssVariable:
  /\$[\d]+/,                                 //dollarVariable:
  /(-?(?:\d*\.\d+|\d+)(?:[Ee][+-]?\d+)?)([a-zA-Z]*)/,     //number: //unit can only be latin letters
  /[(),[\]]/,                                //bracket operators:
  /\^\*|\^\^|\^~|[~|>:+*/%^-]/,              //other operators:
  /"((?:\\\\|\\"|[^"]|\.)*)"/,               //doubleQuote
  /'((?:\\\\|\\'|[^']|\.)*)'/,               //singleQuote
  /\s+/,                                     //whitespace
  /.+/                                       //error:
];

//speedup: inline in production
const tokenizer = new RegExp(tokens.map(rx => "(" + rx.source + ")").join("|"), "g");

function tokenize(str) {
  const tokens = [];
  for (let array1; (array1 = tokenizer.exec(str)) !== null;)
    tokens.push(array1);
  return tokens.filter(t => !t[25]);  //whitespace is definitively meaningless now
  // todo this causes a bug in the --css-var special case handling
}

function nextToken(tokens) {
  if (!tokens.length)
    return undefined;
  if (tokens[0][26])
    throw new SyntaxError("InfiniteSound: Illegal token: " + tokens[0][0]);
  return tokens.shift();
}

function parseBlock(tokens) {
  let args = parseGroupArray(tokens, "(", ")");
  if (!args)
    return;
  if (args.length > 1)             //todo separate for add test for this bug
    throw new SyntaxError("(block, with, comma, is, not, allowed)");
  // if (args.length === 0)           //todo add test for empty block
  //   return undefined;
  return args[0];
}

function parseNode(tokens) {
  if (!tokens[0])
    return;
  return parseBlock(tokens) ||
    parseGroupArray(tokens, "[", "]") ||
    parseUnit(tokens);
}

function parseGroupArray(tokens, start, end) {
  if (tokens[0][0] !== start)
    return;
  nextToken(tokens); //eat ( [
  const res = [];
  let previous = start;
  // let primitive = true;
  while (true) {
    if (!tokens[0])
      throw new SyntaxError(`Forgot to close ${start}-block.`);
    if (tokens[0][0] === end) {
      nextToken(tokens);    //eat ] )
      // if (primitive)
      //   res.isPrimitive = 1;
      if (previous === ",")
        res.push(undefined);
      return res;
    }
    if (tokens[0][0] === ",") {
      if (previous === "," || previous === start)
        res.push(undefined);
      previous = ",";
      nextToken(tokens);    //eat ,
      continue;
    }
    if (previous !== "," && previous !== start)
      throw new SyntaxError("Forgot ',' or '" + end + "' after: " + previous);
    res.push(previous = parseExpressions(tokens));
    if (!isPrimitive(previous))
      res.isDirty = 1;
  }
}

function parseOperator(tokens) {
  //isNegativeNumber: <number><negativeNumber> that should have been <number><minus-operator><positiveNumber>
  if (!tokens[0])
    return;
  if (tokens[0][16] && tokens[0][16].startsWith("-")) {
    tokens[0][0] = tokens[0][0].substr(1);
    tokens[0][16] = tokens[0][16].substr(1);
    tokens[0][17] = tokens[0][17].substr(1);
    return "-";
  }
  //!isOperator
  if (tokens[0][20])
    return nextToken(tokens)[0];
}

//todo make a full operator priority table
const priTable = {"|": 1000000, ">": 100000, "+": 100, "-": 100, "*": 10, "/": 10, ":": 1};

function sortOperators(nodeOpNode) {
  while (nodeOpNode.length > 1) {
    let min = Number.MAX_VALUE, I = 1;
    for (let i = 1; i < nodeOpNode.length; i += 2) {
      let op = nodeOpNode[i];
      let pri = priTable[op] || Number.MAX_VALUE;
      if (min > pri) {
        min = pri;
        I = i;
      }
    }
    let node = {type: nodeOpNode[I], body: [nodeOpNode[I - 1], nodeOpNode[I + 1]]};
    if (!isPrimitive(node.body[0]) || !isPrimitive(node.body[1]))
      node.body.isDirty = 1;
    nodeOpNode.splice(I - 1, 3, node);
  }
  return nodeOpNode[0];
}

function parseExpressions(tokens) {
  const nodeOps = [parseNode(tokens)];
  let op;
  while (op = parseOperator(tokens)) {
    nodeOps.push(op);
    nodeOps.push(parseNode(tokens));
  }
  return sortOperators(nodeOps);
}

function parseUnit(tokens) {
  return parseFunction(tokens) || parsePrimitive(tokens);
}

const absScale12 = {
  "c": 0,
  "c#": 1,
  "db": 1,
  "d": 2,
  "d#": 3,
  "eb": 3,
  "e": 4,
  "f": 5,
  "f#": 6,
  "gb": 6,
  "g": 7,
  "g#": 8,
  "ab": 8,
  "a": 9,
  "a#": 10,
  "bb": 10,
  "b": 11
};

function parseFunctionName(t) {
  const type = t[0].toLowerCase();         //all text in function names toLowerCase().
  if (t[1]) {
    const tone = t[2].toLowerCase();         //all text in function names toLowerCase().
    const num12 = absScale12[tone];
    const octave = t[3] ? parseInt(t[3]) : 4;//default octave for absolute tones is 4
    return {type: tone, absNote: type, num12, octave};
  } else if (t[4]) {                         //relative 7 and 12 tones
    return {type: "~~", num: parseInt(t[5])}
  } else if (t[6]) {
    return {
      type: "~",
      num: parseInt(t[7]),
      augment: t[8] === "#" ? 1 : t[8] === "b" ? -1 : 0,
      body: []
    };
  }
  return {type};
}

function parseFunction(tokens) {
  const t = tokens[0];
  if (!(t[1] || t[4]|| t[6] || t[12] || t[13] || t[14]))
    return;
  const fun = parseFunctionName(nextToken(tokens));
  fun.body = !tokens[0] ? [] : parseGroupArray(tokens, "(", ")") || [];       //todo isDirty is here
  return fun;
}

function parsePrimitive(tokens) {
  const lookAhead = tokens[0];
  if (lookAhead[23])  //singleQuote
    return nextToken(tokens)[24];
  if (lookAhead[21])  //doubleQuote
    return nextToken(tokens)[22];
  // if (lookAhead[9]) {    //relative alpha tone
  //   let t = nextToken(tokens);
  //   const tone = t[9].toLowerCase();
  //   const augment = t[10] === "#" ? 1 : t[10] === "b" ? -1 : 0;
  //   const octave = t[11] ? parseInt(t[11]) : 0;
  //   return {type: "relNote", tone, augment, octave, body: []};
  // }
  if (lookAhead[16]) {  //number
    let t = nextToken(tokens);
    const num = parseFloat(t[17]);
    let type = t[18].toLowerCase();                  //turn UpperCase characters in unit names toLowerCase().
    return type === "" ? num : {type, body: [num]};
  }
}

export function isPrimitive(node) {
  return node === undefined ||
    typeof node === "number" ||
    typeof node === "string" ||
    (node instanceof Array && !node.isDirty);
}

export function parse(str) {
  const tokens = tokenize(str);
  let args = parseExpressions(tokens);
  if (tokens.length)
    throw new SyntaxError("the main css audio pipe is broken");
  return args;
}