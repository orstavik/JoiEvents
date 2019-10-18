const tokens = [
  /([a-gA-G])([#b]?)([\d]?)?![_a-zA-Z\d#-]/, //note:
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
  return tokens.filter(t => !t[17]);  //whitespace is definitively meaningless now
}

function nextToken(tokens) {
  if (!tokens.length)
    return undefined;
  if (tokens[0][18])
    throw new SyntaxError("InfiniteSound: Illegal token: " + tokens[0][0]);
  return tokens.shift();
}

function parseNode(tokens) {
  if (!tokens[0])
    return;
  return parseGroupArray(tokens, "(", ")") ||
    parseGroupArray(tokens, "[", "]") ||
    parseUnit(tokens);
}

function parseGroupArray(tokens, start, end) {
  if (!tokens[0])                                 //todo move this check into the parseFunction after name
    return;
  if (tokens[0][0] !== start)
    return;
  nextToken(tokens); //eat ( [
  const args = [];
  let previous = start;
  while (true) {
    if (!tokens[0])
      throw new SyntaxError(`Forgot to close ${start}-block.`);
    if (tokens[0][0] === end){
      nextToken(tokens);    //eat ] )
      if (previous === ",")
        args.push(undefined);
      if (start === "[")
        return args;
      return {type: "()", body: args}; //todo bug here if the body is an empty array
    }
    if (tokens[0][0] === ","){
      if (previous === "," || previous === start)
        args.push(undefined);
      previous = ",";
      nextToken(tokens);    //eat ,
      continue;
    }
    if (previous !== "," && previous !== start)
      throw new SyntaxError("Forgot ',' or '"+end+"' after: " + previous);
    args.push(previous = parseExpression(tokens));
  }
}

function parseExpression(tokens) {
  const left = parseNode(tokens);
  if (!tokens[0])
    return left;
  const tail = parseExpressionTail(tokens);
  if (!tail)
    return left;
  tail.left = left;
  return tail;
}

function parseExpressionTail(tokens) {
  let op;
  if (tokens[0][8] && tokens[0][8].startsWith("-")){
    op = "-";
    tokens[0][0] = tokens[0][0].substr(1);
    tokens[0][8] = tokens[0][8].substr(1);
    tokens[0][9] = tokens[0][9].substr(1);
  } else {
    if (!tokens[0][12])                         //!isOperator
      return;
    op = nextToken(tokens)[0];
  }
  let right = parseExpression(tokens);        //todo right can be undefined, thus
  return {type: op, right: right};            //todo postfix operators are allowed
}

function parseUnit(tokens) {
  return parseFunction(tokens) || parsePrimitive(tokens);
}

function parseFunction(tokens) {
  if (!(tokens[0][5] || tokens[0][6] || tokens[0][7]))
    return;
  const type = nextToken(tokens)[0];
  const body = parseGroupArray(tokens, "(", ")");
  return body ? {type, body} : {type};
}

function parsePrimitive(tokens) {
  const lookAhead = tokens[0];
  if (lookAhead[13])  //singleQuote
    return {type: '"', value: nextToken(tokens)[14]};
  if (lookAhead[15])  //doubleQuote
    return {type: "'", value: nextToken(tokens)[16]};
  if (lookAhead[8]){  //number
    let t = nextToken(tokens);
    const num = parseFloat(t[9]);
    let unit = t[10];
    return unit === "" ? num : {num, unit};
  }
  //todo tone
}

export function parse(str) {
  const tokens = tokenize(str);
  let args = parseExpression(tokens);
  if (tokens.length)
    throw new SyntaxError("the main css audio pipe is broken");
  return args;
}