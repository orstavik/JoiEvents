//space | pipe | comma | parenthesis | brackets | slash | url | word | number | cssVariable
const tokenizer = /(\s+)|>|\,|\(|\)|\[|\]|\/|(https:)[^),]*|([_a-zA-Z][_a-zA-Z\d#-]*)|([+-]?[\d][\d\.e\+-]*)([_a-zA-Z-]*)|(--[_a-zA-Z][_a-zA-Z-]*)/g;

function skipWhite(tokens) {
  tokens.length && tokens[0][1] && tokens.shift();
}

function parseGroup(tokens, start, separator, end) {
  if (!tokens[0] || tokens[0][0] !== start)
    return undefined;
  tokens.shift();
  const nodes = parseNodeList(tokens, separator);
  if (!tokens[0] || tokens[0][0] !== end)
    throw new SyntaxError("inner css audio array list: expected " + end);
  tokens.shift();
  return {type: separator, args: nodes};
}

function parseNameOrFunction(tokens) {
  if (!tokens[0][3])
    return undefined;
  const name = tokens.shift()[0];
  skipWhite(tokens);
  let args = parseGroup(tokens, "(", ",", ")");
  if (args){
    args.type = name;
    return args;
  }
  return {type: name};
}

//todo implement the function that reads the content of the CSS var into the pipe
//todo this should be done in the Interpreter
function parseCssVar(tokens) {
  if (tokens[0][6])
    return {type: "--", value: tokens.shift()[0]};
}

function parseNumber(tokens) {
  if (tokens[0][4]) {
    const t = tokens.shift();
    return {num: parseFloat(t[4]), unit: t[5]};
  }
}

function parseValue(tokens) {
  return parseNameOrFunction(tokens) ||
    parseCssVar(tokens) ||
    parseNumber(tokens) ||
    parseUrl(tokens);
}

function parseExpression(tokens) {
  const left = parseValue(tokens);
  //todo here we can have more expressions, but we also have the problem of priorities of operators here..
  //todo only slash as in coordinate here thus far
  if (tokens[0] && tokens[0][0] === "/") {
    tokens.shift();
    const right = parseExpression(tokens);
    if (!right)
      throw new SyntaxError("Something ends with a '/': " + tokens[0]);
    return {type: "/", args: [left, right]};
  }
  return left;
}

function parseUrl(tokens) {
  if (tokens[0][2])
    return {type: "_url", value: tokens.shift()[0]};
}

function parseNode(tokens) {
  skipWhite(tokens);
  return parseGroup(tokens, "(", ">", ")") ||
    parseGroup(tokens, "[", ",", "]") ||
    parseExpression(tokens);
}

function parseNodeList(tokens, separator) {
  const nodes = [parseNode(tokens)];
  for (skipWhite(tokens); tokens[0] && tokens[0][0] === separator; skipWhite(tokens)) {
    tokens.shift();
    nodes.push(parseNode(tokens));
  }
  return nodes;
}

export function parse(str) {
  let txt = "("+str.trim()+")";
  const tokens = [];
  for (let array1; (array1 = tokenizer.exec(txt)) !== null;)
    tokens.push(array1);
  let args = parseGroup(tokens, "(",">", ")");
  if (tokens.length)
    throw new SyntaxError("the main css audio pipe is broken");
  return args;
}