//todo
// 1. we are lacking the support for regex in the event property query.
//    This is important when we work with keydown default actions.
//    ivar
// 2. we need to complete the full list of default actions.
//    a. write up the default actions, and be careful not to add event controller default actions, such as contextmenu.
//       examples of event controller default actions are contextmenu and keypress-to-click
//       write a list of both the default actions that come from event controllers and elements here.
// 3. add more and check the list of all exposed requestDefaultAction methods.. we use modern chrome behavior as guide.

//expose the requestSelect method of the HTMLSelectElement
function requestSelect(option) {
  //this = the select element
  const beforeinput = new InputEvent("beforeinput", {bubbles: true, composed: "don't remember"});
  this.dispatchEvent(beforeinput);
  if (beforeinput.defaultPrevented)
    return;
  this.selectedIndex = option.index; //pseudocode, doesn't work
  const select = new InputEvent("select", {bubbles: true, composed: "don't remember"});
  this.dispatchEvent(select);
}

//expose the requestNavigation method of the HTMLAnchorElement
function requestNavigation(option) {
  document.open(this.getAttribute("href"), option);
}

//expose the requestToggle method of the HTMLInputElement
function requestCheckboxToggle() {
  if (this.type !== "checkbox")
    throw new Error("requestCheckboxToggle() should only be possible to invoke on input type=checkbox");
  const beforeinput = new InputEvent("beforeinput", {bubbles: true, composed: "don't remember"});
  this.dispatchEvent(beforeinput);
  if (beforeinput.defaultPrevented)
    return;
  this.checked = !this.checked;
  const input = new InputEvent("input", {bubbles: true, composed: "don't remember"});
  this.dispatchEvent(input);
}

//todo expose requestReset() if the .reset() method on the form doesn't dispatch a reset event
// function requestReset() {
//   this.reset();
//   const reset = new Event("reset", {bubbles: true, composed: "don't remember"});
//   this.dispatchEvent(reset);
// }

// the event has the same syntax as url query parameters
// the element has similar syntax as querySelectors:
//  1. "," comma separated alternatives split and run as separate processes
//  2a. ">" relationships across TWO OR MORE elements must be specified via direct children separators.
//     The parent > child relationship can span 3 or more levels, ie. "select > optgroup > option".
//  3a. Then, each entry is matched with each link in the parent child relationship

//  2b. " " relationships across TWO elements must be specified using the space " " separator.
//     "form input[type=reset], form button[type=reset]" is an example
//  3b. Then, each entry is matched a parent child relationship that can span multiple elements
//  *. no default action parent child relationship can cross shadowDOM borders.

const listOfDefaultActions = [{
  eventQuery: "click?button=0&isTrusted=true",
  elementQuery: "a[href]",
  method: a => requestNavigation.bind(a)
}, {
  eventQuery: "auxclick?button=1&isTrusted=true",
  elementQuery: "a[href]",
  method: a => requestNavigation.bind(a, "_BLANK")
}, {
  eventQuery: "click?button=0",
  elementQuery: "input[type=checkbox]",
  method: input => requestCheckboxToggle.bind(input)
}, {
  eventQuery: "click?button=0",
  elementQuery: "details > summary",
  method: details => HTMLDetailsElement.prototype.toggle.bind(details)
}, {
  eventQuery: "mousedown?button=0&isTrusted=true",
  elementQuery: "select > option, select > optgroup > option",
  method: (select, option) => requestSelect.bind(select, option)
// }, {
//   eventQuery: "keydown?key=tab&isTrusted=true",
//   elementQuery: "select, input, body, textarea, button, blablabla",
//   method: focusable => nextTabIndex function how is that??
// }, {
//   eventQuery: "keydown?key=/[not a tab nor enter in regex]/&isTrusted=true", //todo here we need the regex, and is not legal inside the regex would be a simple solution.
//   elementQuery: "input, textarea",
//   method: textInput => if textInput instanceof input, add character to input, else add character to textarea
// }, {
//   eventQuery: "mousedown?button=0&isTrusted=true",
//   elementQuery: "select, input, body, textarea, button, blablabla",
//   method: focusable => HTMLElement.prototype.focus.bind(focusable)
}, {
  eventQuery: "click?button=0&isTrusted=true",     //todo isTrusted necessary for reset and submit??
  elementQuery: "form button[type=reset], form input[type=reset]",
  method: form => HTMLFormElement.prototype.reset.bind(form)
}, {
  eventQuery: "click?button=0&isTrusted=true",     //todo isTrusted necessary for reset and submit??
  elementQuery: "form button[type=submit], form input[type=submit]",
  method: (form, button) => HTMLFormElement.prototype.requestSubmit.bind(form, button)
}];
//tab?? does this produce a default action?? I think yes
//other characters for input and textarea..


//event controller default actions
//1. contextmenu, this applies to all elements, so it would be more efficient to control it via an event controller.
//2. keydown enter produces click, definitively an event controller, as it produces just another event.

function makeEventFilter(eventQuery) {
  const question = eventQuery.indexOf("?");
  const type = question >= 0 ? eventQuery.substr(0, question) : eventQuery;
  const props = question >= 0 ? eventQuery.substr(question) : [];
  const propQueries = props.split("&").map(query => query.split("="));
  return function (e) {
    if (e.type !== type)
      return false;
    for (let [prop, value] of propQueries) {
      if (e[prop] == value)
        return false;
    }
    return true;
  };
}

function makeDirectChildFilter(matchers) {
  return function matchParentChild(e) {
    const targets = e.composedPath();                     //this implies access to closed shadowRoots
    targetLoop: for (let i = 0; i < targets.length; i++) {
      let j = 0;
      for (; j < matchers.length; j++) {
        let matcher = matchers[j];
        const checkTarget = targets[i + j];
        if (!(checkTarget instanceof HTMLElement) || !checkTarget.matches(matcher))
          continue targetLoop;
      }
      j--;
      return [i, targets[i + j], targets[i]];
    }
    return [];
  };
}

function makeDescendantChildFilter(matchers) {
  const [child, parent] = matchers;
  return function matchParentDescendant(e) {
    const targets = e.composedPath();                     //this implies access to closed shadowRoots
    targetLoop: for (let i = 0; i < targets.length; i++) {
      const childTarget = targets[i];
      if (!(childTarget instanceof HTMLElement) || !childTarget.matches(child))
        continue;
      for (let j = i + 1; j < targets.length; j++) {
        const parentTarget = targets[j];
        if (!(parentTarget instanceof HTMLElement))
          continue targetLoop;
        if (parentTarget.matches(parent))
          return [i, parentTarget, childTarget];
      }
    }
    return [];
  };
}

function makeSingularFilter(matcher) {
  return function matchElement(e) {
    const targets = e.composedPath();                     //this implies access to closed shadowRoots
    for (let i = 0; i < targets.length; i++) {
      const checkTarget = targets[i];
      if (checkTarget instanceof HTMLElement && checkTarget.matches(matcher))
        return [i, targets[i], undefined];
    }
    return [];
  };
}

function makeElementFilter(query) {
  let matchers = query.split(">");
  if (matchers.length > 1)
    return makeDirectChildFilter(matchers.reverse());
  matchers = query.split(" ");
  if (matchers.length === 2)
    return makeDescendantChildFilter(matchers.reverse());
  if (matchers.length === 1)
    return makeSingularFilter(query);
  throw new SyntaxError("element filter syntax error");
}

let nativeDefaultActions = [];
for (let {eventQuery, elementQuery, method} of listOfDefaultActions) {
  for (let elementQuery1 of elementQuery.split(",")) {
    nativeDefaultActions.push({
      eventQuery: makeEventFilter(eventQuery),
      elementQuery: makeElementFilter(elementQuery1.trim()),
      method
    });
  }
}

//todo make another method that finds all the nativeDefaultActions, not just the lowest one
export function lowestExclusiveNativeDefaultActions(e) {
  let lowest;
  for (let {eventQuery, elementQuery, method} of nativeDefaultActions) {
    if (!eventQuery(e))
      continue;
    const [childIndex, parentMatch, childMatch] = elementQuery(e);
    if (!parentMatch)
      continue;
    if (lowest && lowest.index <= childIndex)
      continue;
    lowest = {
      index: childIndex,
      element: parentMatch,
      task: method(parentMatch, childMatch)
    };
  }
  return lowest;
}