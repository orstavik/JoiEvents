//space | pipe | comma | parenthesis | brackets | url | word | coordinate | number | cssVariable
const tokenizer = /(\s+)|>|\,|\(|\)|\[|\]|(https:)[^)]*|([_a-zA-Z][_a-zA-Z-]*)|([+-]?[\d][\d\.e\+-]*[_a-zA-Z-]*)\s*\/\s*([+-]?[\d][\d\.e\+-]*[_a-zA-Z-]*)|([+-]?[\d][\d\.e\+-]*[_a-zA-Z-]*)|(--[_a-zA-Z][_a-zA-Z-]*)/g;

function skipWhite(tokens) {
  tokens.length && tokens[0][1] && tokens.shift();
}

function parseGroup(tokens) {
  if (getNext(tokens) !== "(")
    return null;
  tokens.shift();
  const nodes = parseNodeList(tokens, ">");
  if (getNext(tokens) !== ")")
    throw new SyntaxError("inner css audio pipe group node");
  tokens.shift();
  return {type: "pipe", nodes};
}

function parseArray(tokens) {
  if (getNext(tokens) !== "[")
    return null;
  tokens.shift();
  const array = parseNodeList(tokens, ",");
  if (getNext(tokens) !== "]")
    throw new SyntaxError("inner css audio array list: expected ']', got '" + getNext(tokens));
  tokens.shift();
  return array;
}

function parseNameAndFunction(tokens) {
  if (!tokens[0][3])
    return null;
  const name = tokens.shift()[0];
  skipWhite(tokens);
  if (getNext(tokens) !== "(")
    return name;
  tokens.shift();
  const args = parseNodeList(tokens, ",");
  if (getNext(tokens) !== ")")
    throw new SyntaxError("inner css audio function argument list: expected ')', got '" + getNext(tokens) + "'");
  tokens.shift();
  return {type: "fun", name, args};
}

//todo implement the function that reads the content of the CSS var into the pipe
//todo this should be done in the Interpreter
function parseCssVar(tokens) {
  if (tokens[0][7])
    return tokens.shift()[0];
}

function parseNumber(tokens) {
  if (tokens[0][6])
    return tokens.shift()[0];
}

function parseCoordinate(tokens) {
  if (tokens[0][4]) {
    const t = tokens.shift();
    return [t[4], t[5]];
  }
}

function getNext(tokens) {
  return tokens[0] ? tokens[0][0] : undefined;
}

function parseUrl(tokens) {
  if (tokens[0][2])
    return tokens.shift()[0];
}

function parseNode(tokens) {
  skipWhite(tokens);
  return parseGroup(tokens) ||
    parseArray(tokens) ||
    parseNameAndFunction(tokens) ||
    parseCssVar(tokens) ||
    parseCoordinate(tokens) ||
    parseNumber(tokens) ||
    parseUrl(tokens);
}

function parseNodeList(tokens, separator) {
  const nodes = [parseNode(tokens)];
  for (skipWhite(tokens); getNext(tokens) === separator; skipWhite(tokens)) {
    tokens.shift();
    nodes.push(parseNode(tokens));
  }
  return nodes;
}

export function parse(str) {
  let txt = str.trim();
  const tokens = [];
  for (let array1; (array1 = tokenizer.exec(txt)) !== null;)
    tokens.push(array1);
  let nodes = parseNodeList(tokens, ">");
  if (tokens.length)
    throw new SyntaxError("the main css audio pipe is broken");
  return {type: "pipe", nodes};
}