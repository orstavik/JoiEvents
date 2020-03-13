const EventRoadMap = {
  UNPREVENTABLES: {
    mousedown: ["contextmenu", "focusin", "focus", "focusout", "blur"],
    mouseup: ["click", "auxclick", "dblclick"],
    click: ["dblclick"],
    keydown: ["keypress"]
  }
};

function parseRaceEvents(raceEvents) {
  if (raceEvents instanceof Array)
    return raceEvents;
  if (raceEvents === undefined)
    return [];
  if (raceEvents instanceof String || typeof (raceEvents) === "string")
    return EventRoadMap.UNPREVENTABLES[raceEvents];
  throw new Error(
    "The raceEvent argument in toggleTick(cb, raceEvents) must be undefined, " +
    "an array of event names, empty array, or a string with an event name " +
    "for the trigger event in the event cascade.");
}

function toggleTick(cb, raceEvents) {
  raceEvents = parseRaceEvents(raceEvents);
  const details = document.createElement("details");
  details.style.display = "none";
  const internals = {
    events: raceEvents,
    cb: cb
  };

  function wrapper() {
    task.cancel();
    internals.cb();
  }

  const task = {
    cancel: function () {
      for (let raceEvent of internals.events)
        window.removeEventListener(raceEvent, wrapper, true);
      details.ontoggle = undefined;
    },
    reuse: function (newCb, raceEvents) {
      raceEvents = parseRaceEvents(raceEvents);
      internals.cb = newCb;
      for (let raceEvent of internals.events)
        window.removeEventListener(raceEvent, wrapper, true);
      internals.events = raceEvents;
      for (let raceEvent of internals.events)
        window.addEventListener(raceEvent, wrapper, {capture: true});
    },
    isActive: function () {
      return !!details.ontoggle;
    }
  };
  details.ontoggle = wrapper;
  document.body.appendChild(details);
  details.open = true;
  Promise.resolve().then(details.remove.bind(details));
  for (let raceEvent of internals.events)
    window.addEventListener(raceEvent, wrapper, {capture: true});
  return task;
}

function matchElementInList(list, query) {
  for (let el of list) {
    if (el instanceof HTMLElement && el.matches(query))
      return el;
  }
  return undefined;
}

function mark_defaultActionElement(event) {
  const type = event.type;
  const propPath = event.composedPath();
  let query;
  //left button click
  if (type === "click" && event.button === 0)
    query = "a[href], input[type='button'], input[type='button'], summary, option";
  //wheel button click
  else if (type === "click" && event.button === 1)
    query = "a[href], input[type='text'], input[type='textarea']";

  event._defaultActionElement = matchElementInList(propPath, query);
}

//requires the toggleTick function
Object.defineProperty(Event.prototype, "addDefaultAction", {
  value: function (cb, options) {
    let {preventable, raceEvents} = options instanceof Object ? options : {};
    if (!preventable)
      return toggleTick(() => cb(this), raceEvents);
    if (this.defaultPrevented)
      return null;

    if (this.composedPath().indexOf(preventable) === -1)
      throw new Error("The preventable option in the addDefaultAction is not an element in this event's propagation path.");

    //patch in the associated element of native default actions.
    if (!this._defaultAction)
      mark_defaultActionElement(this);

    // the preventable element is above the  previously added default action happened below in the DOM
    // and therefore essentially calls preventDefault() on the one attempted to be added here.
    if (this._defaultActionElement && preventable.contains(this._defaultActionElement) && preventable !== this._defaultActionElement)
      return null;

    this.preventDefault();
    this._defaultActionElement = preventable;
    if (this._defaultAction) {
      this._defaultAction.reuse(() => cb(this), raceEvents);
      return true;
    }

    this._defaultAction = toggleTick(() => cb(this), raceEvents);
    Object.defineProperties(this, {
      preventDefault: {
        value: function () {
          this._defaultAction.cancel();
        }.bind(this),
        writable: false
      },
      defaultPrevented: {
        get: function () {
          !this._defaultAction.isActive();
        }.bind(this),
        set: function () {
        }
      }
    });
    return true;
  },
  writable: false
});