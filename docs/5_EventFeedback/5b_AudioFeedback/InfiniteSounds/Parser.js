//todo should I add bars "|" to signify tempo bars as in music, and then convert that into delay nodes? We have the problem of relative time and absolute time.. That we might need to signify both relative and absolute time as textual values..

//todo numbers as primitive floats?

//todo names, --css-variables, and $1 variables are all treated as functions

//todo css variable replacements: $1, $2 etc
//todo | \$[1-9][0-9]* |               | \$0 | \$[\d]+ | where the first will cause a syntax error? the second is better..
//todo use a first pass tokenizer to find syntax errors? maybe no..
//todo add |(*) at the end to produce syntax error? yes

//1. quotes are used for base64 and urls. All quotes are converted to double quotes
//urls and base64 should be wrapped in quotes: "azs1234SAKDJHQPOWEIHT+/dkfhsdkgj=" / "https://some.where.com/help.me" / "my.file"

//space | pipe | comma | parenthesis | brackets | slash | double quotes | single quotes | word | number | cssVariable | $var | error
const tokenizer = /(\s+)|>|\,|\(|\)|\[|\]|\/|("(?:[^\\"]|\\.)*")|'((?:[^\\']|\\.)*)'|([_a-zA-Z][_a-zA-Z\d#-]*)|([+-]?[\d][\d\.e\+-]*)([_a-zA-Z-]*)|(--[_a-zA-Z][_a-zA-Z-]*)|(\$[\d]+)|(.+)/g;

function skipWhite(tokens) {
  tokens.length && tokens[0][1] && tokens.shift();
}

function error(tokens) {
  if (tokens.length && tokens[0][9])
    throw new SyntaxError("InfiniteSound: Illegal token: " + tokens[0][9]);
}

function nextToken(tokens) {
  const t = tokens.shift();
  skipWhite(tokens);
  error(tokens);
  return t;
}

function parseGroup(tokens, start, separator, end) {
  if (!tokens[0] || tokens[0][0] !== start)
    return undefined;
  nextToken(tokens);
  const nodes = parseNodeList(tokens, separator);
  if (!tokens[0] || tokens[0][0] !== end)
    throw new SyntaxError("inner css audio array list: expected " + end);
  nextToken(tokens);
  return (start === "[") ? nodes : {type: separator, args: nodes};
}

function parseNameOrFunction(tokens) {
  let name = parseNameOrVar(tokens);
  if (!name)
    return;
  let varName;
  if (name[0] === "$") {
    varName = name;
    name = "$";
  }
  if (name[0] === "-" && name[1] === "-") {
    varName = name;
    name = "--";
  }
  let args = parseGroup(tokens, "(", ",", ")");
  if (args) {
    args.type = name;
    if (varName)
      args.varName = varName;
    return args;
  }
  if (varName)
    return {type: name, varName: varName};
  return {type: name};
}

/**
 * captures both names, --css-var-names, and $1 etc. names
 * @param tokens
 */
function parseNameOrVar(tokens) {
  if (tokens[0][4] || tokens[0][8] || tokens[0][7])
    return nextToken(tokens)[0];
}

function parseNumber(tokens) {
  if (tokens[0][5]) {
    const t = nextToken(tokens);
    return {type: "num", value: parseFloat(t[5]), unit: t[6]};
  }
}

function parseQuote(tokens) {
  if (tokens[0][2]) return nextToken(tokens)[2];
  if (tokens[0][3]) return '"' + nextToken(tokens)[3] + '"';
}

function parseValue(tokens) {
  return parseNameOrFunction(tokens) ||
    parseNumber(tokens) ||
    parseQuote(tokens);
}

function parseExpression(tokens) {
  const left = parseValue(tokens);
  //todo here we can have more expressions, but we also have the problem of priorities of operators here..
  //todo only slash as in coordinate here thus far
  if (tokens[0] && tokens[0][0] === "/") {
    nextToken(tokens);
    const right = parseExpression(tokens);
    if (!right)
      throw new SyntaxError("Something ends with a '/': " + tokens[0]);
    return [left, right];
    // return {type: "/", args: [left, right]};
  }
  return left;
}

function parseNode(tokens) {
  return parseGroup(tokens, "(", ">", ")") ||
    parseGroup(tokens, "[", ",", "]") ||
    parseExpression(tokens);
}

function parseNodeList(tokens, separator) {
  const nodes = [parseNode(tokens)];
  while (tokens[0] && tokens[0][0] === separator) {
    nextToken(tokens);
    nodes.push(parseNode(tokens));
  }
  //todo if I have a list like this [a, b > c, d], then when I reach ">", then we might want to allow "b > c" to be parsed as a pipe. If so, we should do it here.
  //todo, then we only pull out the last node added to the array list, and then parse the rest of the array with the "," or "]" as the end token and the ">" as the separator.
  //todo, this we could do the other way round too, from the pipe chain ">" to the array "," list.
  //todo, that would be elegant syntactically. It would add lots of meaning from very few signs..
  return nodes;
}

export function parse(str) {
  let txt = "(" + str.trim() + ")";
  const tokens = [];
  for (let array1; (array1 = tokenizer.exec(txt)) !== null;)
    tokens.push(array1);
  let args = parseGroup(tokens, "(", ">", ")");
  if (tokens.length)
    throw new SyntaxError("the main css audio pipe is broken");
  return args;
}
//todo add an array of all the variables?
//todo add the table for urls? should I return a table, or should i start fetching and then return a table?
//todo no, that kind of preemptive speed optimization is bad, return the ast and a list of urls?