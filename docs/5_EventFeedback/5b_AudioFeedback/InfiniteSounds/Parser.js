
//todo add the table for urls? should I return a table, or should i start fetching and then return a table?
//todo no, that kind of preemptive speed optimization is bad, return the ast and a list of urls?

//todo numbers as primitive floats?

//todo handle and position --css-variables as regular function names.

//todo css variable replacements: $1, $2 etc
//todo | \$[1-9][0-9]* |               | \$0 | \$[\d]+ | where the first will cause a syntax error? the second is better..
//todo use a first pass tokenizer to find syntax errors? maybe no..
//todo add |(*) at the end to produce syntax error? yes

//1. quotes are used for base64 and urls. All quotes are converted to double quotes
//urls and base64 should be wrapped in quotes: "azs1234SAKDJHQPOWEIHT+/dkfhsdkgj=" / "https://some.where.com/help.me" / "my.file"

//space | pipe | comma | parenthesis | brackets | slash | double quotes | single quotes | word | number | cssVariable | error
const tokenizer = /(\s+)|>|\,|\(|\)|\[|\]|\/|("(?:[^\\"]|\\.)*")|'((?:[^\\']|\\.)*)'|([_a-zA-Z][_a-zA-Z\d#-]*)|([+-]?[\d][\d\.e\+-]*)([_a-zA-Z-]*)|(--[_a-zA-Z][_a-zA-Z-]*)|(.+)/g;

function skipWhite(tokens) {
  tokens.length && tokens[0][1] && tokens.shift();
}

function error(tokens) {
  if (tokens.length && tokens[0][8])
    throw new SyntaxError("InfiniteSound: Illegal token: " + tokens[0][8]);
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
  if (!tokens[0][4])
    return undefined;
  const name = nextToken(tokens)[0];
  let args = parseGroup(tokens, "(", ",", ")");
  if (args) {
    args.type = name;
    return args;
  }
  return {type: name};
}

function parseCssVar(tokens) {
  if (tokens[0][7])
    return {type: "--", value: nextToken(tokens)[0]};
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
    parseCssVar(tokens) ||
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

/*
* the parser should maybe specify if there is a list of urls, or a list of css variables, or a list of expressions.
* if we return such lists, then we do not need to iterate the tree, we only need to iterate the different lists.
* this is more efficient, but it gives us to parallel structures.
* we don't have one source of truth, we have two.

* --my-audio: sine($1) > gain([1/0.015, $2/0.01, $2/$3, 0/0.3])
* --play-note: --my-audio(F4, 0.8, 2.3) > gain(0.7)
*
"--my-audio(F4, 0.8, 2.3)".replace(/--[\w]+\(([^,]*,)/, myAudio)

var rxs = [/\$1/, /\$2/, /\$3/, /\$4/, /\$5/];
for (let i = 0; i < args.length; i++)
  myAudio = myAudio.replace(rxs[i], args[i]);
**/