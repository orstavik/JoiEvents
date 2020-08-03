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
function requestOptionSelect(option) {
  function optionSelectEndMouseup() {
    //option.color = orange?? //there is no way to trigger this behavior from js... It is completely hidden in the browser.
    const input = new InputEvent("input", {bubbles: true, composed: true});
    this.dispatchEvent(input);
    const change = new InputEvent("change", {bubbles: true, composed: false});
    this.dispatchEvent(change);
  }

  function optionsSelectEndMousemoveChrome(e) {
    !(e.buttons & 1) && optionSelectEndMouseup();
  }

  this.value = option.value;    //changes the selected option. The option.value is always something,
  //This is done by all browsers: Chrome, FF(, Safari??)
  window.addEventListener("mouseup", optionSelectEndMouseup, {capture: true, once: true, first: true});

  //This is done only in Chrome (and Safari??), but not FF
  window.addEventListener("mousemove", optionsSelectEndMousemoveChrome, {capture: true, once: true, first: true});
  // in Chrome the alert() function will cancel the change and input events..
  // how to catch that event/function call without highjacking the window.alert() function, i don't know.
  // window.addEventListener("alert", function () {
  //   window.removeEventListener("mouseup", optionSelectEndMouseup, {capture: true, once: true, first: true});
  //   window.removeEventListener("mousemove", optionsSelectEndMousemoveChrome, {capture: true, once: true, first: true});
  // }, {capture: true, once: true, first: true});
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

const focusableQuerySelector = "a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex], [contentEditable=true]";//option is not considered focusable, bad legacy design.

const tabbableQuerySelector = "a[href]:not([tabindex='-1']), area[href]:not([tabindex='-1']), input:not([disabled]):not([tabindex='-1']), select:not([disabled]):not([tabindex='-1']), textarea:not([disabled]):not([tabindex='-1']), button:not([disabled]):not([tabindex='-1']), iframe:not([tabindex='-1']), [tabindex]:not([tabindex='-1']), [contentEditable=true]:not([tabindex='-1'])";

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
  eventQuery: "mousedown?button=0&isTrusted=true",//i think this is implemented using a different strategy. It think that when an option is given focus, that triggers a set of event listeners for mouseup/mousemove etc that will cause a problem.
  elementQuery: "select > option, select > optgroup > option",
  method: (select, option) => requestOptionSelect.bind(select, option)
// }, {
//   eventQuery: "keydown?key=tab&isTrusted=true",
//   elementQuery: "select, input, body, textarea, button, blablabla",
//   method: focusable => nextTabIndex function how is that??
// }, {
//   eventQuery: "beforeinput?key=/[not a tab nor enter in regex]/&isTrusted=true",
  //todo here we need the regex, and is not legal inside the regex would be a simple solution.
//   elementQuery: "input, textarea",
//   method: textInput => if textInput instanceof input, add character to input, else add character to textarea
}, {
  eventQuery: "mousedown?button=0&isTrusted=true",
  elementQuery: focusableQuerySelector,
  method: focusable => HTMLElement.prototype.focus.bind(focusable),
  additive: true
}, {
  eventQuery: "click?button=0",     //isTrusted is not necessary for reset
  elementQuery: "form button[type=reset], form input[type=reset]",
  method: form => HTMLFormElement.prototype.reset.bind(form)
}, {
  eventQuery: "click?button=0&isTrusted=true",     //todo isTrusted necessary for submit??
  elementQuery: "form button[type=submit], form input[type=submit]",
  method: (form, button) => HTMLFormElement.prototype.requestSubmit.bind(form, button)
}];
//tab?? does this produce a default action?? I think yes
//other characters for input and textarea..


//generic default actions
//1. contextmenu, "*".
//2. drag'n'drop, "[draggable]". add more to the queryselector here, not everything marked [draggable] can be dragged?? We also need a queryselector format that queries for css properties..
//3. keydown enter produces click. I think this should be "a[href], input, button, textarea, select"?? is it the same as focusable?? no there are special rules here..
//4. the deadcaps controller. this is a mess.. produces composition events and beforeinput (except in old firefox).
//   deadcaps are currently actually handled by input and textarea..

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

let listOfDefaultActions2 = [];
for (let {eventQuery, elementQuery, method, additive} of listOfDefaultActions) {
  for (let elementQuery1 of elementQuery.split(",")) {
    listOfDefaultActions2.push({
      eventQuery: makeEventFilter(eventQuery),
      elementQuery: makeElementFilter(elementQuery1.trim()),
      method,
      additive
    });
  }
}

export function nativeDefaultActions(e) {
  const nativeDefaultActionsThatMatchEvent = listOfDefaultActions2.filter(({eventQuery}) => eventQuery(e));
  const nativeDefaultActionsThatMatchPath = nativeDefaultActionsThatMatchEvent.map(defAct => {
    const [childIndex, parentMatch, childMatch] = defAct.elementQuery(e);
    return !parentMatch ? null : {
      index: childIndex,
      element: parentMatch,
      task: defAct.method(parentMatch, childMatch),
      additive: defAct.additive
    };
  }).filter(defAct => !!defAct).sort((a,b) => a.index <= b.index);
  let firstIndex;
  return nativeDefaultActionsThatMatchPath.filter((defAct, index) => defAct.additive || (firstIndex === undefined && (firstIndex = index || true)));
}