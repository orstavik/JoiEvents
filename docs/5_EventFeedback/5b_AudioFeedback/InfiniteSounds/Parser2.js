const tokens = [
  /([a-gA-G][#b]?)(-\d+|\+\d+|\d+)?(?![_a-zA-Z\d#-])/, //note: Fb, C#4, a4, a-4, a, ab, G, (not notes are aB)
  /[_a-zA-Z][_a-zA-Z\d#-]*/,                 //word:
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

//simplify dev, inline in production
const tokenizer = new RegExp(tokens.map(rx => "(" + rx.source + ")").join("|"), "g");

function tokenize(str) {
  const tokens = [];
  for (let array1; (array1 = tokenizer.exec(str)) !== null;)
    tokens.push(array1);
  return tokens.filter(t => !t[16]);  //whitespace is definitively meaningless now
  // todo this causes a bug in the --css-var special case handling
}

function nextToken(tokens) {
  if (!tokens.length)
    return undefined;
  if (tokens[0][17])
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
  const args = [];
  let previous = start;
  // let onlyNumbers = true;            //todo only numbers
  while (true) {
    // if (typeof previous !== "number" && !(previous instanceof Array && previous.onlyNumbers))
    //   onlyNumbers = false;
    if (!tokens[0])
      throw new SyntaxError(`Forgot to close ${start}-block.`);
    if (tokens[0][0] === end) {
      nextToken(tokens);    //eat ] )
      // if (onlyNumbers)
      //   args.onlyNumbers = 1;       //todo, only numbers
      if (previous === ",")
        args.push(undefined);
      // if (start === "[")
        return args;
      // return {type: "()", body: args};
    }
    if (tokens[0][0] === ",") {
      if (previous === "," || previous === start)
        args.push(undefined);
      previous = ",";
      nextToken(tokens);    //eat ,
      continue;
    }
    if (previous !== "," && previous !== start)
      throw new SyntaxError("Forgot ',' or '" + end + "' after: " + previous);
    args.push(previous = parseExpressions(tokens));
  }
}

function parseOperator(tokens) {
  //isNegativeNumber: <number><negativeNumber> that should have been <number><minus-operator><positiveNumber>
  if (!tokens[0])
    return;
  if (tokens[0][7] && tokens[0][7].startsWith("-")) {
    tokens[0][0] = tokens[0][0].substr(1);
    tokens[0][7] = tokens[0][7].substr(1);
    tokens[0][8] = tokens[0][8].substr(1);
    return "-";
  }
  //!isOperator
  if (tokens[0][11])
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
    let node = {type: nodeOpNode[I], left: nodeOpNode[I - 1], right: nodeOpNode[I + 1]};
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
  if (!(tokens[0][4] || tokens[0][5] || tokens[0][6]))
    return;
  const type = nextToken(tokens)[0];
  let body = !tokens[0] ? [] : parseGroupArray(tokens, "(", ")") || [];
  return {type, body};
}

function parsePrimitive(tokens) {
  const lookAhead = tokens[0];
  if (lookAhead[12])  //singleQuote
    return nextToken(tokens)[13];
  if (lookAhead[14])  //doubleQuote
    return nextToken(tokens)[15];
  if (lookAhead[1]) {   //tone
    let t = nextToken(tokens);
    return {
      type: "note",
      tone: t[2][0].toUpperCase() + t[2].slice(1),
      octave: t[3] === undefined ? undefined : parseInt(t[3])
    };
  }
  if (lookAhead[7]) {  //number
    let t = nextToken(tokens);
    const num = parseFloat(t[8]);
    let unit = t[9];
    return unit === "" ? num : {num, unit};
  }
}

export function parse(str) {
  const tokens = tokenize(str);
  let args = parseExpressions(tokens);
  if (tokens.length)
    throw new SyntaxError("the main css audio pipe is broken");
  return args;
}