const listOfDefaultActions = [
  {
    event: "click.button=0",
    element: "a[href]",
    exclusive: true,
    method: function (currentTarget) {
      document.open(currentTarget.getAttribute("href"));
    }
  }, {
    event: "auxclick.button=1",
    element: "a[href]",
    exclusive: true,
    method: function (currentTarget) {
      document.open(currentTarget.getAttribute("href"), "_BLANK");
    }
  }, {
    event: "click.button=0",
    element: "details > summary",
    exclusive: true,
    method: function (currentTarget) {
      currentTarget.toggle();
    }
  }
];

function makeEventFilter(eventQuery) {
  const [type, props] = eventQuery.split(".");
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

function makeElementFilter(elementQuery) {
  const matchers = elementQuery.split(">").reverse();
  return function (e) {
    const targets = e.composedPath(); //this implies access to closed shadowRoots
    targetLoop: for (let i = 0; i < targets.length; i++) {
      let j = 0;
      for (; j < matchers.length; j++) {
        let matcher = matchers[j];
        const checkTarget = targets[i + j];
        if (!checkTarget.matches(matcher))
          continue targetLoop;
      }
      return targets[i+j];
    }
    return null;
  };
}

function parseListOfDefaultActions(list) {
  return list.map(function ({event, element, exclusive, method}) {
    return {
      event: makeEventFilter(event),
      element: makeElementFilter(element),
      exclusive,
      method
    };
  });
}

const parsedListOfDefaultActions = parseListOfDefaultActions(listOfDefaultActions);

export function lowestExclusiveNativeDefaultActions(event) {
  const targetToNative = parseListOfDefaultActions.map(function ({event, element, exclusive, method}) {
    const element1 = element(event);
    const event1 = event(event);
    return {
      event: event1,
      element: element1,
      exclusive,
      task: method.bind(null, element1)
    };
  });
  const filteredNative = targetToNative.filter(({event, element})=>!!event && !!element);
  let lowest = filteredNative.pop();
  const path = event.composedPath();
  for (let next of filteredNative) {
    if (path.indexOf(lowest.element) > path.indexOf(next.element))
      lowest = next;
  }
  return lowest;
}