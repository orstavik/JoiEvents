/**
 * hasEventListener()
 */
const reg = Symbol("eventListenerRegister");
const suspended = Symbol("suspendedEventTypes");

function nameCapture(name, options) {
  return name + " " + !!(options === true || (options && options.capture));
}

function lastIndexOf(list, cb) {
  if (!list)
    return -1;
  for (let i = list.length - 1; i >= 0; i--) {
    const cbOptions = list[i];
    if (cbOptions.cb === cb)
      return i;
  }
  return -1;
}

const ogAdd = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function (name, cb, options) {
  this[reg] || (this[reg] = {});
  const nc = nameCapture(name, options);
  this[reg][nc] || (this[reg][nc] = []);
  if (lastIndexOf(this[reg][nc], cb) === -1) {
    this[reg][nc].push({cb, options});
    if (!this.isSuspendedEventListeners(name, options))
      ogAdd.call(this, name, cb, options);
  }
};

const ogRemove = EventTarget.prototype.removeEventListener;
EventTarget.prototype.removeEventListener = function (name, cb, options) {
  const nc = nameCapture(name, options);
  if (!this.isSuspendedEventListeners(name, options))
    ogRemove.call(this, name, cb, options);              //this would probably only return empty anyways?
  const index = lastIndexOf(this[reg][nc], cb);
  if (index >= 0)
    this[reg][nc].splice(index, 1);
};

/**
 *
 * @param name
 * @param options true/false || {capture: true/false}.
 *                if undefined, then both are accepted.
 *                //todo give this method the same argument signature as add/RemoveEventListener(eventName, ?cb, ?option)
 *                //todo should I change ?option === undefined to mean bubble phase? as is done with add/remove? probably yes.
 * @returns {boolean}
 */
EventTarget.prototype.hasEventListener = function (name, options) {
  if (!this[reg])
    return false;
  if (options === undefined)
    return !!(this[reg][nameCapture(name, false)] || this[reg][nameCapture(name, true)]);
  return !!this[reg][nameCapture(name, options)];
};

EventTarget.prototype.isSuspendedEventListeners = function (name, options) {
  return this[suspended] && this[suspended][nameCapture(name, options)];
};

/**
 */
EventTarget.prototype.suspendEventListeners = function (name, options, alternativeCB, alternativeOptions) {
  this[suspended] || (this[suspended] = {});
  const nc = nameCapture(name, options);
  if (this[suspended][nc])      //calling suspend twice in a row
    return;
  //you can suspend when no listeners are added empty listeners, as it will influence how the events react once added.
  for (let listener of this[reg][nc] || [])
    ogRemove.call(this, name, listener.cb, listener.options);
  ogAdd.call(this, name, alternativeCB, alternativeOptions);
  this[suspended][nc] = {alternativeCB, alternativeOptions};
};

/**
 */
EventTarget.prototype.resumeEventListeners = function (name, options) {
  const nc = nameCapture(name, options);
  if (!this[suspended] || !this[suspended][nc])      //calling resume on something that isn't suspended
    return;
  const alternative = this[suspended][nc];
  ogRemove.call(this, name, alternative.alternativeCB, alternative.alternativeOptions);
  delete this[suspended][nc];
  for (let listener of this[reg][nc])
    ogAdd.call(this, name, listener.cb, listener.options);
};


/*short and sweet toggleTick*/
function toggleOnDetails(cb) {
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
const thirdArg = supportsPassive ? {capture: true, passive: true} : true;


class CustomEventsController {

  constructor() {
    this.eventToClass = {};
    this.processClosure = this._processTriggerEvent.bind(this);
    this.grabbedEvents = {};
  }

  queueEventLoopTask(task) {
    toggleOnDetails(task);
  }

  define(CascadeEventClass) {
    for (let eventType of CascadeEventClass.observedEvents) {
      if (!this.eventToClass[eventType]) {
        this.eventToClass[eventType] = new Set();
        window.addEventListener(eventType, this.processClosure, thirdArg);
      }
      this.eventToClass[eventType].add(CascadeEventClass);
    }
  }

  undefine(CascadeEventClass) {
    for (let eventType of CascadeEventClass.observedEvents) {
      this.eventToClass[eventType].delete(CascadeEventClass);
      if (this.eventToClass[eventType].size === 0) {
        delete this.eventToClass[eventType];
        window.removeEventListener(eventType, this.processClosure, thirdArg);
      }
    }
  }

  _processTriggerEvent(event) {
    const composedPath = event.composedPath();
    const CascadeEventFunctions = new Set(this.eventToClass[event.type]);

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

  /**
   * options a
   * @param listOfEventNames
   * @param cb optional?
   * @param options optional!
   */
  grabEvents(listOfEventNames, cb, options) {
    //check that none has been grabbed before
    for (let name of listOfEventNames) {
      if (this.grabbedEvents[name])
        throw new Error("Event name '" + name + "' has already been grabbed!");
    }
    for (let name of listOfEventNames)
      window.suspendEventListeners(name, undefined, cb, options || thirdArg);
    const eventsGrabbedEvent = new CustomEvent("events-grabbed", {details: listOfEventNames});
    this.queueEventLoopTask(window.dispatchEvent.bind(window, eventsGrabbedEvent));
  }

  releaseEvents(listOfEventNames) {
    for (let name of listOfEventNames)
      window.resumeEventListeners(name, undefined);
    const eventsGrabbedEvent = new CustomEvent("events-released", {details: listOfEventNames});
    this.queueEventLoopTask(window.dispatchEvent.bind(window, eventsGrabbedEvent));
  }
}

customEvents || (customEvents = new CustomEventsController());