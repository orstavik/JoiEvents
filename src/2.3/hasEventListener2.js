(function () {

  /*short and sweet toggleTick*/
  Window.prototype.queueTaskInEventLoop = function (cb) {
    if (!(cb instanceof Function))
      throw new Error("Only function references can be queued in the event loop.");
    const details = document.createElement("details");
    details.style.display = "none";
    details.ontoggle = function () {
      details.remove();
      cb();
    };
    document.body.appendChild(details);
    details.open = true;
  };


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
  const captureActive = supportsPassive ? {capture: true, passive: false} : true;
  const capturePassive = supportsPassive ? {capture: true, passive: true} : true;

  /**
   * hasEventListener()
   */
  const reg = Symbol("eventListenerRegister");
  const grabbed = Symbol("grabbedEventTypes");

  function equivListener(list, cb, options) {
    return list.findIndex(function (cbOptions) {
      if (!(cb === undefined || cbOptions.cb === cb))
        return false;
      const a = cbOptions.options, b = options;
      const aBool = !!(a === true || (a instanceof Object && a.capture));
      const bBool = !!(b === true || (b instanceof Object && b.capture));
      return aBool === bBool;
    });
  }

  Window.prototype.addEventListener = function (name, cb, options) {
    this[reg] || (this[reg] = {});
    this[reg][name] || (this[reg][name] = []);
    if (equivListener(this[reg][name], cb, options) >= 0)
      return;
    this[reg][name].push({cb, options});
    if (!this[grabbed] || !this[grabbed][name])
      EventTarget.prototype.addEventListener.call(this, name, cb, options);
  };

  Window.prototype.removeEventListener = function (name, cb, options) {
    if (!this[reg] || !this[reg][name])
      return;
    const index = equivListener(this[reg][name], cb, options);
    if (index === -1)
      return;
    this[reg][name].splice(index, 1);
    if (!this[grabbed] || !this[grabbed][name])
      EventTarget.prototype.removeEventListener.call(this, name, cb, options);
  };

  /**
   * @param name
   * @param cb function object, if undefined, all listeners are accepted.
   * @param options true/false || {capture: true/false}.
   *                if undefined, then both all options are accepted.
   * @returns {boolean}
   */
  Window.prototype.hasEventListener = function (name, cb, options) {
    if (!this[reg] || !this[reg][name])
      return false;
    if (equivListener(this[reg][name], cb, options) >= 0)
      return true;
    if (options === undefined)
      return equivListener(this[reg][name], cb, true) >= 0;
    return false;
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

    this[grabbed][name] = function (e) {
      e.preventDefault();
      e.stopPropagation();
      cb(e);
    };
    for (let name of names) {
      if (this[reg][name]) {
        for (let cbOptions of this[reg][name])
          EventTarget.prototype.removeEventListener.call(this, name, cbOptions.cb, cbOptions.options);
      }
      EventTarget.prototype.addEventListener.call(this, name, this[grabbed][name], captureActive);
    }
    this[grabbedNow] = names;
  };

  /**
   *
   * cf. the navigator releaseEvents and captureEvents that was the reverse of the stopPropagation bubble thing of MS IE.
   */
  Window.prototype.freeEvents = function (names) {
    if (!this[grabbed])
      throw new Error("Cannot free event '" + name + "' because it has not been grabbed.");
    for (let name of names) {
      if (!this[grabbed][name])
        throw new Error("Cannot free event '" + name + "' because it has not been grabbed.");
    }

    for (let name of names) {
      EventTarget.prototype.removeEventListener.call(this, name, this[grabbed][name], captureActive);
      delete this[grabbed][name];
      for (let cbOptions of this[reg][name] || [])
        EventTarget.prototype.addEventListener.call(this, name, cbOptions.cb, cbOptions.options);
    }

    const eventsGrabbedEvent = new CustomEvent("events-freed", {details: names});
    window.dispatchEvent(eventsGrabbedEvent);     //todo sync, but nested
    // window.queueTaskInEventLoop(window.dispatchEvent.bind(window, eventsGrabbedEvent));  //todo async, but too late
  };

  Window.prototype.silenceEventOnce = function (name) {
    try {
      window.grabEvents([name], e => e.preventDefault() & e.stopPropagation());
      window.queueTaskInEventLoop(() => window.freeEvents([name]));
    } catch (e) {
      throw new Error("Cannot silence a grabbed event. You are probably calling e.preventDefault() on a mousedown, mouseup or click event, when the a contextmenu or (aux/dbl)click event has been grabbed.");
    }
  };

  const ogPreventDefault = MouseEvent.prototype.preventDefault;
  MouseEvent.prototype.preventDefault = function () {
    if (this.defaultPrevented)
      return;
    ogPreventDefault.call(this);
    if (this.type === "mouseup") {
      if (this.button === 0)
        window.silenceEventOnce("click");
      else
        window.silenceEventOnce("auxclick");
    } else if (this.type === "mousedown" && this.button === 2) {
      window.silenceEventOnce("contextmenu");
    } else if (this.type === "click") {
      window.silenceEventOnce("dblclick");
    }
  };

  const eventToClass = {};
  const grabbedEventToClass = {};

  function _processTriggerEvent(event) {
    const composedPath = event.composedPath();
    const CascadeEventFunctions = eventToClass[event.type];
    const AlreadyRunCascadeEventFunctions = [];

    //1. We loop the composedPath and the CascadeEventClasses. We call them on the apprioriate target.
    // a. CascadeEventClasses they match, they run trigger, but they are not grabbing or setting the trajectory of the EventCascade, at least not yet.
    // If no-one grabs, then nothing else happens.
    // b. CascadeEventClasses they match, they run trigger, and they call grab/preventDefault!
    // If b), then all the other EventCascadeClasses should be informed that the event has been grabbed.
    // And if the CascadeEventClasses are listening for other grabbed events, they too must be informed.
    // it breaks the findCascadeEvent process, and then starts the alertTheOthersThatADecision is made process. For
    // all the grabbed events.

    //2. if someone calls preventDefault or grab, then that will a) break the loop, and b)


    //3a. we loop first up the target chain, and then we check each of the ComposedEventClasses match functions ONCE
    for (let el of composedPath) {
      for (let CascadeEventClass of CascadeEventFunctions) {
        if (AlreadyRunCascadeEventFunctions.indexOf(CascadeEventClass) >= 0 || !CascadeEventClass.matches(event, el))
          continue;
        //we run each CascadeEventFunction only once, but we do it in the order of the composedPath
        AlreadyRunCascadeEventFunctions.push(CascadeEventClass);
        CascadeEventClass.triggerEvent(event);
        //TODO
        // As a side-effect of the triggerEvent, the eventDefault might be prevented (ie. this particular EventCascade is grabbed)
        // AND a series of other future events might be grabbed (ie. Window.grabEvent).
        // how to communicate this?
        // the event object is the return value. I have global, static elements such as window and Event.
        // IFF an event is grabbed/prevented, then should all the other CascadeEventClasses be informed about the event?
        // no. The principle is that if an event is grabbed, it doesn't exist in other EventCascades.
        // If it's a drag, then it's not a mousemove.
        // Can you call preventDefault() if you don't grab the event?
        // no. The principle is that you only block another EventCascade, when you yourself fill it (although you can fill it with empty).
        //
        //TODO
        // If you grab events, you also MUST call .preventDefault() on the current event.
        // This leads to thinking that grab() should be added to the Event prototype.
        // That grab is a wider form of preventDefault().
        // That means that the event can come out with a .grabbed property, that is the events being grabbed.
        // But, .grab() should ONLY be accessible from CascadeEventClasses. During the sync processing of CascadeEventClasses.
        // ...
        // to make that happen, then the method can be added to the event as it enters the CascadeEventClass processing,
        // and removed when it leaves it.
        //
        //TODO
        // .preventDefault() only works on the current event.
        // .grab() looks to the future, it sets a new callback.
        // .free() doesn't need to alert anyone.
        if (event.defaultPrevented) {           //this functions as a grab for this particular event instance only?
          break;
        }
        if (window[grabbed][event.type])
          break;
      }
    }
    if (event.defaultPrevented || window[grabbed][event.type]) {
      for (let name of window[grabbedNow]) {
        const allTheCallbacks = grabbedEventToClass[name];
        for (let CancelEventCascadeClass of allTheCallbacks) {
          CancelEventCascadeClass.eventPrevented(name);
        }
      }
    }
  }

  const cascadeClasses = {};                             //todo this is not strictly necessary
  const eventTypeToCascadeEvents = {};

  function _processCascadeEvents(event) {
    const composedPath = event.composedPath();
    const cascadeEventFunctions = new Set(eventTypeToCascadeEvents[event.type]);

    for (let cascadeEvent of cascadeEventFunctions) {
      if (cascadeEvent.observedPrevented.indexOf(event.type) >= 0) {
        cascadeEvent.preventedEvent();
        cascadeEventFunctions.delete(cascadeEvent);
      }
    }
    for (let el of composedPath) {
      for (let cascadeEvent of cascadeEventFunctions) {
        if (!CascadeEventClass.matches(event, el))
          continue;
        if (cascadeEvent.observedTriggers.indexOf(event.type) >= 0) {
          //todo here
          cascadeEvent.triggerEvent();
          cascadeEventFunctions.delete(cascadeEvent);
          //todo check if the triggerEvent() either called preventDefault() or called grabEvents()
        }
      }
    }
    if (cascadeEventFunctions.size > 0)
      throw new Error("omg");
  }


  class CustomEvents {

    define(CascadeEventClass) {
      if (cascadeClasses[CascadeEventClass.name])
        throw new Error("EventCascadeClass: " + CascadeEventClass.name + " is already defined.");
      const cascadeClass = new CascadeEventClass();
      cascadeClasses[CascadeEventClass.name] = cascadeClass;
      const triggerEvents = cascadeClass.observedTriggers;
      const cancelEvents = cascadeClass.observedPrevented;
      const allEventTypes = triggerEvents.concat(cancelEvents);
      for (let eventType of allEventTypes) {
        if (!eventTypeToCascadeEvents[eventType]) {
          eventTypeToCascadeEvents[eventType] = new Set();
          window.addEventListener(eventType, _processCascadeEvents, capturePassive);
        }
        eventTypeToCascadeEvents[eventType].add(cascadeClass);
      }
    }

    undefine(CascadeEventClass) {
      if (!cascadeClasses[CascadeEventClass.name])
        throw new Error("Cannot undefine EventCascadeClass: " + CascadeEventClass.name + " because it is not defined.");
      const cascadeClass = cascadeClasses[CascadeEventClass.name];
      const triggerEvents = cascadeClass.observedTriggers;
      const cancelEvents = cascadeClass.observedPrevented;
      const allEventTypes = triggerEvents.concat(cancelEvents);
      for (let eventType of allEventTypes) {
        eventTypeToCascadeEvents[eventType].delete(cascadeClass);
        if (eventTypeToCascadeEvents[eventType].size === 0) {
          delete eventTypeToCascadeEvents[eventType];
          window.removeEventListener(eventType, _processCascadeEvents, capturePassive);
        }
      }
      delete cascadeClasses[CascadeEventClass.name];
    }
  }

  window.customEvents || (window.customEvents = new CustomEvents());
})();