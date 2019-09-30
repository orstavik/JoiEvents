//space | pipe | comma | parenthesis | brackets | url | word | coordinate | number | cssVariable
const tokenizer = /(\s+)|>|\,|\(|\)|\[|\]|(https:)[^)]*|([_a-zA-Z][_a-zA-Z-]*)|([+-]?[\d][\d\.e\+-]*[_a-zA-Z-]*)\s*\/\s*([+-]?[\d][\d\.e\+-]*[_a-zA-Z-]*)|([+-]?[\d][\d\.e\+-]*[_a-zA-Z-]*)|(--[_a-zA-Z][_a-zA-Z-]*)/g;

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
  return nodes;
}

function parseNameOrFunction(tokens) {
  if (!tokens[0][3])
    return undefined;
  const name = tokens.shift()[0];
  skipWhite(tokens);
  const args = parseGroup(tokens, "(", ",", ")");
  return args ? {type: "fun", name, args} : name;
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

function parseUrl(tokens) {
  if (tokens[0][2])
    return tokens.shift()[0];
}

function parseNode(tokens) {
  skipWhite(tokens);
  return parseGroup(tokens, "(", ">", ")") ||
    parseGroup(tokens, "[", ",", "]") ||
    parseNameOrFunction(tokens) ||
    parseCssVar(tokens) ||
    parseCoordinate(tokens) ||
    parseNumber(tokens) ||
    parseUrl(tokens);
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
  let txt = str.trim();
  const tokens = [];
  for (let array1; (array1 = tokenizer.exec(txt)) !== null;)
    tokens.push(array1);
  let nodes = parseNodeList(tokens, ">");
  if (tokens.length)
    throw new SyntaxError("the main css audio pipe is broken");
  return {type: "pipe", nodes};
}