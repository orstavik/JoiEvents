function trustedClick0(el, e, path) {
  if (el.matches("a[href]"))
    return el;
  if (el.matches("form[action]") && target.matches("button[type=submit], input[type=reset]"))
    return el;
  if (el.matches("form") && target.matches("button[type=reset], input[type=reset]"))
    return el;
  if (el.matches("details") && elMinus1.matches("summary") && elMinus1 === el.children[0])//todo
    return el;
}

function trustedClick1(el) {
  if (el.matches("a[href]"))
    return el;
  if (el.matches("input[type=text], textarea"))
    return el;
}

function trustedMousedown0(el, path) {
  if (el.matches("options") && path.slice(path.indexOf(el)).matches("option"))
    return el;
}

//todo this is to fire a beforeinput event in most browsers (except old edge and firefox).
//todo some browsers are skipping beforeinput event
//todo the keypress tab also triggers the keypress focus event controller
//todo and the keypress also triggers the text composition system (the implied caret element)
//todo and the DOMActivate event controller

//this function will mostly dispatch the beforeinput event in most browsers.
//in browsers which lacks support for beforeinput, it will directly transform the input/textarea element state.
function trustedKeydown(el, e, target) {
  //this only dispatches a keypress event
  if (el.matches("textarea"))
    return 1;
  if (el.matches("input[type=text]") && e.key !== "Enter")
    return 1;
  return 0;
}

function trustedKeypress(el, e, target) {
  if (!HTMLElement.onbeforeinput)
    return trustedBeforeinput(el, e, target);
  //this only dispatches the beforeinput on the target
  if (el !== target)
    return;
  if (el.matches("textarea"))
    return 1;
  if (el.matches("input[type=text]") && e.key !== "Enter")
    return 1;
  return 0;
}

function trustedBeforeinput(el, e, target) {
  if (el.matches("textarea, input, select") && el === target)
    return 1;
  return 0;
}

function hasNativeDefaultAction(el, e, path) {
  if (!e.isTrusted)
    return;
  if (e instanceof MouseEvent && e.type === "mousedown" && e.button === 0)
    return trustedMousedown0(el, path, e);
  if (e instanceof MouseEvent && e.type === "click" && e.button === 0)
    return trustedClick0(el, e, path);
  if (e instanceof MouseEvent && e.type === "click" && e.button === 1)
    return trustedClick1(el, path, e);
  //1. the keypress enter is transformed into a click by the enterToClick controller in all browsers, i think.
  if (e instanceof KeyboardEvent && e.type === "keydown" && e.key !== "Tab")
    return trustedKeydown(el, e, path);
  if (e instanceof KeyboardEvent && e.type === "keypress" && e.key !== "Tab")
    return trustedKeypress(el, e, path);
  if (e instanceof InputEvent && e.type === "beforeinput")
    return trustedBeforeinput(el, e, path);
}

//returns the element with the associated native default action
export function findNativeDefaultAction(event, composedPath){
  //todo draft
}