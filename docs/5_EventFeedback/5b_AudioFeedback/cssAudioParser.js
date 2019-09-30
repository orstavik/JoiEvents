//space | pipe | comma | parenthesis | brackets | url | word | coordinate | number | cssVariable
const tokenizer = /\s+|>|\,|\(|\)|\[|\]|https:[^)]*|[_a-zA-Z][_a-zA-Z-]*|([+-]?[\d][\d\.e\+-]*[_a-zA-Z-]*)\s*\/\s*([+-]?[\d][\d\.e\+-]*[_a-zA-Z-]*)|[+-]?[\d][\d\.e\+-]*[_a-zA-Z-]*|--[_a-zA-Z][_a-zA-Z-]*/g;

function skipWhite(tokens) {
  tokens.length && getNext(tokens).trim() === "" && tokens.shift();
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

function isName(token) {
  return /^[_a-zA-Z][_a-zA-Z-]*$/.test(token) || /^--[_a-zA-Z][_a-zA-Z-]*$/.test(token);
}

function parseNameAndFunction(tokens) {
  if (!isName(getNext(tokens)))
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

function isNumber(token) {
  return /^[+-]?[\d][\d\.e\+-]*[_a-zA-Z-]*$/.test(token);
}

function parseNumber(tokens) {
  if (isNumber(getNext(tokens)))
    return tokens.shift()[0];
}

function isCoordinate(token) {
  return /^[+-]?[\d][\d\.e\+-]*[_a-zA-Z-]*\s*\/\s*[+-]?[\d][\d\.e\+-]*[_a-zA-Z-]*$/.test(token);
}

function parseCoordinate(tokens) {
  if (tokens[0][1]){
    const t = tokens.shift();
    return [t[1], t[2]];
  }
  // if (isCoordinate(tokens[0]))
  //   return tokens.shift().split("/").map(str => str.trim());
}

function isUrl(token) {
  return /^https:[^)]*$/.test(token);
}

function getNext(tokens) {
  return tokens[0] ?  tokens[0][0] : undefined;
}

function parseUrl(tokens) {
  return isUrl(getNext(tokens)) ? tokens.shift()[0] : null;
}

function parseNode(tokens) {
  skipWhite(tokens);
  return parseGroup(tokens) ||
    parseArray(tokens) ||
    parseNameAndFunction(tokens) ||
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