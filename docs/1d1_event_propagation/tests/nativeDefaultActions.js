// the event has the same syntax as url query parameters
// the element has similar syntax as querySelectors:
//  1. "," comma separated alternatives split and run as separate processes
//  2. ">" relationships across several elements must be specified via direct children separators.
//     But the parent > child relationship can span 3 or more levels, ie. "select > optgroup > option", or
//     "form > * > input".. There is a lack of support for button and forms..
//     todo we need to support " " separated parent child relationships
//  3. Then, each entry is matched with each link in the parent child relationship
//  *. no default action parent child relationship can cross shadowDOM borders.

const listOfDefaultActions = [{
  eventQuery: "click?button=0&isTrusted=true",
  elementQuery: "a[href]",
  exclusive: true,
  method: function (parent) {
    document.open(parent.getAttribute("href"));
  }
}, {
  eventQuery: "auxclick?button=1",
  elementQuery: "a[href]",
  exclusive: true,
  method: function (parent) {
    document.open(parent.getAttribute("href"), "_BLANK");
  }
}, {
  eventQuery: "click?button=0",
  elementQuery: "input[type=checkbox]",
  exclusive: true,
  method: function (parent) {
    parent.checked = !parent.checked;
  }
}, {
  eventQuery: "mousedown?button=0",
  elementQuery: "select > option, select > optgroup > option",
  exclusive: true,
  method: function (parent, child) {
    parent.requestSelect(child);
  }
}, {
  eventQuery: "click?button=0",
  elementQuery: "details > summary",
  exclusive: true,
  method: function (currentTarget) {
    currentTarget.toggle();
  }
}];

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

function makeElementFilter(elementQueries) {
  const queries = elementQueries.split(",").map(query => query.split(">").reverse());
  return function matchParentChild(e) {
    for (let matchers of queries) {
      const targets = e.composedPath();                     //this implies access to closed shadowRoots
      targetLoop: for (let i = 0; i < targets.length; i++) {
        let j = 0;
        for (; j < matchers.length; j++) {
          let matcher = matchers[j];
          const checkTarget = targets[i + j];
          if (!(checkTarget instanceof HTMLElement) || !checkTarget.matches(matcher))
            continue targetLoop;
        }
        return [targets[i], targets[i + j]];
      }
    }
    return [];
  };
}

function parseListOfDefaultActions(list) {
  return list.map(function ({eventQuery, elementQuery, exclusive, method}) {
    return {
      eventQuery: makeEventFilter(eventQuery),
      elementQuery: makeElementFilter(elementQuery),
      exclusive,
      method
    };
  });
}

const parsedListOfDefaultActions = parseListOfDefaultActions(listOfDefaultActions);

export function lowestExclusiveNativeDefaultActions(e) {
  const targetToNative = parsedListOfDefaultActions.map(function ({eventQuery, elementQuery, exclusive, method}) {
    const matchesEvent = eventQuery(e);
    const [parentMatch, childMatch] = elementQuery(e);
    return {
      event: matchesEvent,
      element: parentMatch,
      exclusive,
      task: method.bind(null, parentMatch, childMatch)
    };
  });
  const filteredNative = targetToNative.filter(({event, element}) => !!event && !!element);
  let lowest = filteredNative.pop();
  const path = e.composedPath();
  for (let next of filteredNative) {
    if (path.indexOf(lowest.element) > path.indexOf(next.element))
      lowest = next;
  }
  return lowest;
}