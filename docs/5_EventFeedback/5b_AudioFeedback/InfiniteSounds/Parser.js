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

//todo make a full operator priority table
//todo % modulo operator would be interpreted as a step in the mode shifts. % for tone must have higher priority than *, ^, ^^, +
//todo ~ is very low priority. I think it is below ":".
const priTable = {
  "|": 1000000,
  ">": 100000,
  //"!": 1000,
  "%": 500,
  "+": 100,
  "-": 100,
  "*": 10,
  "/": 10,
  "^^": 10,
  "^+": 10,
  ":": 1,
  "~": 0.5,
  "!": 0,
};

const tokens = [
  //absolute notes: C#4lyd, a0dor, baeo, Fb, a4, a4,ab, G, aB10 (not notes a-2, abb4, f##, f#b, A+3)
  /([a-gA-G][#b]?)(\d+)?(lyd|ion|dor|phr|mix|loc|aeo|maj|min)?(?![_a-zA-Z\d#-])/,
  /[_a-zA-Z][_a-zA-Z\d#-]*/,                 //word:
  /--[_a-zA-Z][_a-zA-Z-]*/,                  //cssVariable:
  /\$[\d]+/,                                 //dollarVariable:
  /(-?(?:\d*\.\d+|\d+)(?:[Ee][+-]?\d+)?)([a-zA-Z]*)/,     //number: //unit can only be latin letters
  /[(),[\]]/,                                //bracket operators:
  /\^\/|\^\^|\^\+|\^-|[#!~|>:+*/%^-]/,       //other operators:  |%-|%+
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
  return tokens.filter(t => !t[17]);  //whitespace is definitively meaningless now
  // todo this causes a bug in the --css-var special case handling
}

function nextToken(tokens) {
  if (!tokens.length)
    return undefined;
  if (tokens[0][18])
    throw new SyntaxError("InfiniteSound: Illegal token: " + tokens[0][0]);
  return tokens.shift();
}

function parseGroupArray(tokens, start, end) {
  if (!tokens[0])
    return;
  if (tokens[0][0] !== start)
    return;
  nextToken(tokens); //eat ( [
  const res = [];
  let previous = start;
  while (true) {
    if (!tokens[0])
      throw new SyntaxError(`Forgot to close ${start}-block.`);
    if (tokens[0][0] === end) {
      nextToken(tokens);    //eat ] )
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
    res.push(previous = parseExpression(tokens));
    if (!isPrimitive(previous))
      res.isDirty = 1;
  }
}

function parseOperator(tokens) {
  if (!tokens[0])
    return;
  //isOperator
  if (tokens[0][12])
    return nextToken(tokens)[0];
  //isNegativeNumber: <something><negativeNumber> that should have been <something><minus-operator><positiveNumber>
  if (tokens[0][8] && tokens[0][8].startsWith("-")) {
    tokens[0][0] = tokens[0][0].substr(1);
    tokens[0][8] = tokens[0][8].substr(1);
    tokens[0][9] = tokens[0][9].substr(1);
    return "-";
  }
}

function sortOperators(nodeOpNode) {
  while (nodeOpNode.length > 1) {
    let min = Number.MAX_VALUE, I = 1;
    for (let i = 1; i < nodeOpNode.length; i += 2) {
      let op = nodeOpNode[i];
      let pri = priTable[op] !== undefined ? priTable[op] : Number.MAX_VALUE;
      if (min > pri) {
        min = pri;
        I = i;
      }
    }
    let node = {type: nodeOpNode[I], body: [nodeOpNode[I - 1], nodeOpNode[I + 1]]};
    nodeOpNode.splice(I - 1, 3, node);
  }
  return nodeOpNode[0];
}

function parseExpressionList(tokens) {
  const nodeOps = [parseNode(tokens)];
  let op;
  while (op = parseOperator(tokens)) {
    nodeOps.push(op);
    nodeOps.push(parseNode(tokens));
  }
  return sortOperators(nodeOps);
}

function parseExpression(tokens) {
  const exp = parseExpressionList(tokens);
  const block = parseGroupArray(tokens, "(", ")");
  if (!block)
    return exp;
  const body = [exp, ...block];
  delete body.isDirty;
  return {type: "expFun", body: body};
}

// If it comes within a tone description, then it would set the mode.
// If a mode is set, then all notes below can be interpreted in the scale of 7 to this modeKey.
// If no mode is set, then we cannot, we let the tones remain in the scale of 12? or do we substitute in the major scale
// I think we set to major?
// if a mode is set above another mode, that means that the tones below should be trasnposed into that upper mode.
// that means that the mode is 0-nulled out. made into a relative mode with 0 steps.
// if a mode is to remain, that is, it is intended to overwrite the upper/main mode of the musical sequence, then
// it should have a %! prefix. How this should be implemented technically, I don't see right now.

//to transpose a clef a%dor ( c%lyd( c,e,f ) )
//the leaf tones are simple, they are just converted to relatives to nearest absolute clef.
//the lower clef key is also simple, it is just overwritten and converted to ~0 by the upper clef key.
//the same with the inner clef mode, it is also overwritten. It is converted to %0.
//we can simply remove the inner clef. It is no longer needed. but, that would make the aom very different from the template.
//no. its better to leave it in there as an empty clef.

function parseArray(tokens) {
  const body = parseGroupArray(tokens, "[", "]");
  if (body && body.isDirty) {
    delete body.isDirty;
    return {type: "[]", body};
  } else {
    return body;
  }
}

function parseNode(tokens) {
  if (tokens[0])
    return parseBlock(tokens) ||
      parseArray(tokens) ||
      parseAbsoluteNotes(tokens) ||
      parseFunction(tokens) ||
      parseQuotes(tokens) ||
      parseNumber(tokens);
}

function parseBlock(tokens) {
  const block = parseGroupArray(tokens, "(", ")");
  if (block)
//   if (block.length > 1)             //todo separate for add test for this bug
//     throw new SyntaxError("(block, with, comma, is, not, allowed)");
//   // if (args.length === 0)           //todo add test for empty block
//   //   return undefined;
    return block[0];
}

//Note[absNum, absMode]
function parseAbsoluteNotes(tokens) {
  if (!tokens[0][1])
    return;
  let t = nextToken(tokens);
  const octave = t[3] ? parseInt(t[3]) * 12 : 48;
  const num = absScale12[(t[2].toLowerCase())];
  return {type: "Note", body: [num + octave, t[4]]};
}

function parseFunction(tokens) {
  if (tokens[0][2] || tokens[0][5] || tokens[0][6] || tokens[0][7]) {
    const type = nextToken(tokens)[0].toLowerCase();    //all function names are toLowerCase().
    const body = parseGroupArray(tokens, "(", ")") || [];
    delete body.isDirty;
    return {type, body};
  }
}

function parseNumber(tokens) {
  if (tokens[0][8]) {  //number
    let t = nextToken(tokens);
    const num = parseFloat(t[9]);
    let type = t[10].toLowerCase();                  //turn UpperCase characters in unit names toLowerCase().
    return type === "" ? num : {type, body: [num]};
  }
}

function parseQuotes(tokens) {
  if (tokens[0][15])  //singleQuote
    return nextToken(tokens)[16];
  if (tokens[0][13])  //doubleQuote
    return nextToken(tokens)[14];
}

export function isPrimitive(node) {
  return node === undefined ||
    typeof node === "number" ||
    typeof node === "string" ||
    node instanceof Array;
}

export function parse(str) {
  const tokens = tokenize(str);
  let args = parseExpression(tokens);
  if (tokens.length)
    throw new SyntaxError("the main css audio pipe is broken");
  return args;
}