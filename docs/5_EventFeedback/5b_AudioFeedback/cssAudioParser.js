const tokenizer = /\s+|>|\/|\,|\(|\)|\[|\]|https:[^)]*|[_a-zA-Z][_a-zA-Z-]*|[+-]?[\d][\d\.e\+-]*[_a-zA-Z-]*|--[_a-zA-Z][_a-zA-Z-]*/g;

function skipWhite(tokens) {
  tokens.length && tokens[0].trim() === "" && tokens.shift();
}

function parseGroup(tokens) {
  if (tokens[0] !== "(")
    return null;
  tokens.shift();
  const nodes = parseNodeList(tokens, ">");
  if (tokens[0] !== ")")
    throw new SyntaxError("inner css audio pipe group node");
  tokens.shift();
  return {type: "pipe", nodes};
}

function parseArray(tokens) {
  if (tokens[0] !== "[")
    return null;
  tokens.shift();
  const array = parseNodeList(tokens, ",");
  if (tokens[0] !== "]")
    throw new SyntaxError("inner css audio array list: expected ']', got '" + tokens[0]);
  tokens.shift();
  return array;
}

function isName(token) {
  return /^[_a-zA-Z][_a-zA-Z-]*$/.test(token) || /^--[_a-zA-Z][_a-zA-Z-]*$/.test(token);
}

function parseNameAndFunction(tokens) {
  if (!isName(tokens[0]))
    return null;
  const name = tokens.shift();
  skipWhite(tokens);
  if (tokens[0] !== "(")
    return name;
  tokens.shift();
  const args = parseNodeList(tokens, ",");
  if (tokens[0] !== ")")
    throw new SyntaxError("inner css audio function argument list: expected ')', got '" + tokens[0] + "'");
  tokens.shift();
  return {type: "fun", name, args};
}

function isNumber(token) {
  return /^[+-]?[\d][\d\.e\+-]*[_a-zA-Z-]*$/.test(token);
}

function parseNumber(tokens) {
  if (!isNumber(tokens[0]))
    return null;
  const number = tokens.shift();
  skipWhite(tokens);
  if (tokens[0] !== "/")
    return number;
  tokens.shift();
  if (isNumber(tokens[0]))
    return [number, tokens.shift()];
  throw new SyntaxError("inner css audio coordinate");
}

function isUrl(token) {
  return /^https:[^)]*$/.test(token);
}

function parseUrl(tokens) {
  return isUrl(tokens[0]) ? tokens.shift() : null;
}

function parseNode(tokens) {
  skipWhite(tokens);
  return parseGroup(tokens) ||
    parseArray(tokens) ||
    parseNameAndFunction(tokens) ||
    parseNumber(tokens) ||
    parseUrl(tokens);
}

function parseNodeList(tokens, separator) {
  const nodes = [parseNode(tokens)];
  for (skipWhite(tokens); tokens[0] === separator; skipWhite(tokens)) {
    tokens.shift();
    nodes.push(parseNode(tokens));
  }
  return nodes;
}

export function parse(str) {
  const tokens = str.trim().match(tokenizer);
  let nodes = parseNodeList(tokens, ">");
  if (tokens.length)
    throw new SyntaxError("the main css audio pipe is broken");
  return {type: "pipe", nodes};
}