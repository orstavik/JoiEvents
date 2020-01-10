/**
 * hasEventListener()
 */
const reg = Symbol("eventListenerRegister");
const grabbed = Symbol("grabbedEventTypes");

function equivListener(list, cb, options) {
  return list.findIndex(function (cbOptions) {
    if (!(cb === undefined || cbOptions.cb === cb))
      return false;
    if (options === undefined)
      return true;
    const a = cbOptions.options, b = options;
    const aBool = !!(a === true || (a instanceof Object && a.capture));
    const bBool = !!(b === true || (b instanceof Object && b.capture));
    return aBool === bBool;
  });
}

const ogAdd = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function (name, cb, options) {
  this[reg] || (this[reg] = {});
  this[reg][name] || (this[reg][name] = []);
  if (equivListener(this[reg][name], cb, options) >= 0)
    return;
  this[reg][name].push({cb, options});
  if (!this[grabbed] || !this[grabbed][name])
    ogAdd.call(this, name, cb, options);
};

const ogRemove = EventTarget.prototype.removeEventListener;
EventTarget.prototype.removeEventListener = function (name, cb, options) {
  if (!this[reg] || !this[reg][name])
    return;
  if (!this[grabbed] || !this[grabbed][name])
    ogRemove.call(this, name, cb, options);
  const index = equivListener(this[reg][name], cb, options);
  if (index >= 0)
    this[reg][name].splice(index, 1);
};

/**
 * @param name
 * @param cb function object, if undefined, all listeners are accepted.
 * @param options true/false || {capture: true/false}.
 *                if undefined, then both all options are accepted.
 * @returns {boolean}
 */
EventTarget.prototype.hasEventListener = function (name, cb, options) {
  return this[reg] && this[reg][name] && equivListener(this[reg][name], cb, options) >= 0;
};

/**
 * When an event is grabbed, the new cb is added in the capture phase and is ALWAYS ACTIVE.
 * Grabbing events is intended to always override the default action too.
 * By setting the grab event listener to be active, scrolling from touchstart (and wheel) will always be turned off
 * (in Safari), delayed in Chrome.
 *
 * cf. the navigator releaseEvents and captureEvents that was the reverse of the stopPropagation bubble thing of MS IE.
 *
 * @param names
 * @param cb
 */
Window.prototype.grabEvents = function (names, cb) {
  if (this[grabbed]) {
    for (let name of names) {
      if (this[grabbed][name])
        throw new Error("Event type '" + name + "' has already been grabbed!");
    }
  } else {
    this[grabbed] = {};
  }

  for (let name of names) {
    for (let listener of this[reg][name] || [])
      ogRemove.call(this, name, listener.cb, listener.options);
    ogAdd.call(this, name, cb, captureActive);
    this[grabbed][name] = cb;
  }

  const eventsGrabbedEvent = new CustomEvent("events-grabbed", {details: names});
  CustomEvents.queueEventLoopTask(window.dispatchEvent.bind(window, eventsGrabbedEvent));
};

/**
 *
 * cf. the navigator releaseEvents and captureEvents that was the reverse of the stopPropagation bubble thing of MS IE.
 */
Window.prototype.freeEvents = function (names) {
  if (!this[grabbed])
    throw new Error("Cannot resume event '" + name + "' because it has not been grabbed.");
  for (let name of names) {
    if (!this[grabbed][name])
      throw new Error("Event type '" + name + "' has already been grabbed!");
  }

  for (let name of names) {
    ogRemove.call(this, name, this[grabbed][name], captureActive);
    delete this[grabbed][name];
    for (let listener of this[reg][name] || [])
      ogAdd.call(this, name, listener.cb, listener.options);
  }

  const eventsGrabbedEvent = new CustomEvent("events-released", {details: names});
  CustomEvents.queueEventLoopTask(window.dispatchEvent.bind(window, eventsGrabbedEvent));
};

/*short and sweet toggleTick*/
function toggleOnDetails(cb) {
  if (!(cb instanceof Function))
    throw new Error("Only function references can be queued in the event loop.");
  const details = document.createElement("details");
  details.style.display = "none";
  details.ontoggle = function () {
    details.remove();
    cb();
  };
  document.body.appendChild(details);
  details.setAttribute("open", "");
}

/*If possible a passive EventListenerOptions*/
let supportsPassive = false;
try {
  const opts = Object.defineProperty({}, "passive", {
    get: function () {
      supportsPassive = true;
    }
  });
  window.addEventListener("test", null, opts);
  window.removeEventListener("test", null, opts);
} catch (e) {
}
const capturePassive = supportsPassive ? {capture: true, passive: true} : true;
const captureActive = supportsPassive ? {capture: true, passive: false} : true;


class CustomEvents {

  constructor() {
    this.eventToClass = {};
  }

  static queueEventLoopTask(task) {
    toggleOnDetails(task);
  }

  static _processTriggerEvent(event) {
    const composedPath = event.composedPath();
    const CascadeEventFunctions = new Set(customEvents.eventToClass[event.type]);

    //3a. we loop first up the target chain, and then we check each of the ComposedEventClasses match functions ONCE
    for (let el of composedPath) {
      for (let CascadeEventClass of CascadeEventFunctions) {
        if (!CascadeEventClass.matches(event, el))
          continue;
        CascadeEventFunctions.delete(CascadeEventClass);
        CascadeEventClass.triggerEvent(event);             //the triggerEvent methods need to look to see if event.defaultPrevented = true.
      }
    }
  }

  define(CascadeEventClass) {
    for (let eventType of CascadeEventClass.observedEvents) {
      if (!this.eventToClass[eventType]) {
        this.eventToClass[eventType] = new Set();
        window.addEventListener(eventType, CustomEvents._processTriggerEvent, capturePassive);
      }
      this.eventToClass[eventType].add(CascadeEventClass);
    }
  }

  undefine(CascadeEventClass) {
    for (let eventType of CascadeEventClass.observedEvents) {
      this.eventToClass[eventType].delete(CascadeEventClass);
      if (this.eventToClass[eventType].size === 0) {
        delete this.eventToClass[eventType];
        window.removeEventListener(eventType, CustomEvents._processTriggerEvent, capturePassive);
      }
    }
  }
}

customEvents || (customEvents = new CustomEvents());

function silenceEventOnce(name) {
  try {
    window.grabEvents([name], e => e.preventDefault() & e.stopPropagation());
    CustomEvents.queueEventLoopTask(() => window.freeEvents([name]));
  } catch (e) {
    throw new Error("Cannot silence a grabbed event. You are probably calling e.preventDefault() on a mousedown, mouseup or click event, when the a contextmenu or (aux/dbl)click event has been grabbed.");
  }
}

const ogPreventDefault = MouseEvent.prototype.preventDefault;
MouseEvent.prototype.preventDefault = function () {
  if (this.defaultPrevented)
    return;
  ogPreventDefault.call(this);
  if (this.type === "mouseup") {
    if (this.button === 0)
      silenceEventOnce("click");
    else
      silenceEventOnce("auxclick");
  } else if (this.type === "mousedown" && this.button === 2) {
    silenceEventOnce("contextmenu");
  } else if (this.type === "click") {
    silenceEventOnce("dblclick");
  }
};

// queueEventLoopTasks(tasks) {
//   if (tasks instanceof Function)
//     toggleOnDetails(tasks);
//   if (!(tasks instanceof Array))
//     throw new Error("customEvents.queueEventLoopTasks() must receive only a single function or an array of functions.");
//   for (let task of tasks) {
//     if (!(task instanceof Function))
//       throw new Error("customEvents.queueEventLoopTasks() must receive only a single function or an array of functions.");
//   }
//   for (let task of tasks)
//     toggleOnDetails(task);
// }