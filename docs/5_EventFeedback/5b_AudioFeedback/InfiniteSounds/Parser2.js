const tokens = [
  /([a-gA-G][#b]?)(\d+)?(?![_a-zA-Z\d#-])/,  //absolute notes: Fb, C#4, a4, a4, a0, ab, G, aB10 (not notes a-2, abb4, f##, f#b, a+3)
  /[~]{1,2}([+-]?\d+)([#b]?)|~([a-gA-G])([#b]?)([+-]?\d+)?/,
  //relative aplha notes: ~C, ~C1, ~C0, ~C-2, ~C+2
  //relative 12 notes: ~~1, ~~0b, ~~6#, ~~-2, ~~10b, ~~-11b, ~C, ~C1, ~C0, ~C-2, ~C+2
  //relative 7 notes: ~1, ~0b, ~6#, ~-2, ~10b, ~-11b
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
  return tokens.filter(t => !t[22]);  //whitespace is definitively meaningless now
  // todo this causes a bug in the --css-var special case handling
}

function nextToken(tokens) {
  if (!tokens.length)
    return undefined;
  if (tokens[0][23])
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
  if (tokens[0][13] && tokens[0][13].startsWith("-")) {
    tokens[0][0] = tokens[0][0].substr(1);
    tokens[0][13] = tokens[0][13].substr(1);
    tokens[0][14] = tokens[0][14].substr(1);
    return "-";
  }
  //!isOperator
  if (tokens[0][17])
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

function parseFunction(tokens) {
  if (!(tokens[0][10] || tokens[0][11] || tokens[0][12]))
    return;
  const type = nextToken(tokens)[0].toLowerCase();   //turn UpperCase characters in function names toLowerCase().
  let body = !tokens[0] ? [] : parseGroupArray(tokens, "(", ")") || [];
  //todo return two arrays, one with the elements, and one with the yet-not-interpreted?
  return {type, body};
}

// const absScale7 = {"c": 0, "d": 1, "e": 2, "f": 3, "g": 4, "a": 5, "b": 6};
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

function parseAbsoluteNote(t) {
  let tone = t[2].toLowerCase();
  const num12 = absScale12[tone];
  const octave = t[3] ? parseInt(t[3]) : 4;                     //default octave for absolute tones is 4
  //todo do not change the text of the tone, You have the num7 and num12 values, you don't need the augment nor shortened tone anymore
  // const augment = tone.endsWith("#") ? 1 : tone.endsWith("b") ? -1 : 0;
  // if (augment !== 0)
  //   tone = tone.substr(0, tone.length - 1);
  //todo do not change the text of the tone, You have the num7 and num12 values, you don't need the augment nor shortened tone anymore
  // const num7 = absScale7[tone];
  return {type: "absNote", tone, num12/*, num7, augment*/, octave, body: []};
}

function parsePrimitive(tokens) {
  const lookAhead = tokens[0];
  if (lookAhead[18])  //singleQuote
    return nextToken(tokens)[19];
  if (lookAhead[20])  //doubleQuote
    return nextToken(tokens)[21];
  if (lookAhead[1])    //absolute note
    return parseAbsoluteNote(nextToken(tokens));
  if (lookAhead[7]) {    //relative alpha tone
    let t = nextToken(tokens);
    const tone = t[7].toLowerCase();
    const augment = t[8] === "#" ? 1 : t[8] === "b" ? -1 : 0;
    const octave = t[9] ? parseInt(t[9]) : 0;
    return {type: "relNote", tone, augment, octave, body: []};
  }
  if (lookAhead[5]) {    //relative 7 and 12 tones
    let t = nextToken(tokens);
    const num = t[5] ? parseInt(t[5]) : undefined;
    const augment = t[6] === "#" ? 1 : t[6] === "b" ? -1 : 0;
    const type = lookAhead[4][1] === "~" ? "~~" : "~";
    return {type, num, augment, body: []};
  }
  if (lookAhead[13]) {  //number
    let t = nextToken(tokens);
    const num = parseFloat(t[14]);
    let type = t[15].toLowerCase();                  //turn UpperCase characters in unit names toLowerCase().
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