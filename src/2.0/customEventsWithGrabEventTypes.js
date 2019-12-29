(function () {
  const reg = Symbol("eventListenerRegister");

  function lastIndexOf(list, cb, capture) {
    if (!list)
      return -1;
    for (let i = list.length - 1; i >= 0; i--) {
      const cbCapture = list[i];
      if (cbCapture.cb === cb && cbCapture.capture === capture)
        return i;
    }
    return -1;
  }

  const ogAdd = HTMLElement.prototype.addEventListener;
  HTMLElement.prototype.addEventListener = function (name, cb, options) {
    this[reg] || (this[reg] = {});
    ogAdd.call(this, name, cb, options);
    this[reg][name] || (this[reg][name] = []);
    const capture = !!(options === true || (options && options.capture));
    if (lastIndexOf(this[reg][name], cb, capture) === -1)
      this[reg][name].push({cb, capture});
  };

  const ogRemove = HTMLElement.prototype.removeEventListener;
  HTMLElement.prototype.removeEventListener = function (name, cb, options) {
    ogRemove.call(this, name, cb, options);
    const capture = !!(options === true || (options && options.capture));
    const index = lastIndexOf(this[reg][name], cb, capture);
    if (index >= 0)
      this[reg][name].splice(index, 1);
  };

  /**
   *
   * @param name
   * @param options true/false || {capture: true/false}.
   *                if undefined, then both are accepted.
   * @returns {boolean}
   */
  HTMLElement.prototype.hasEventListener = function (name, options) {
    if (!this[reg])
      return false;
    const listeners = this[reg][name];
    if (!listeners)
      return false;
    if (options === undefined)
      return true;
    const capture = !!(options === true || (options && options.capture));
    for (let i = listeners.length - 1; i >= 0; i--) {
      const listener = listeners[i];
      if (listener.capture === capture)
        return true;
    }
    return false;
  }
})();


(function () {
  //1. polyfillish check of third argument for addEventListener
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
  const thirdArg = supportsPassive ? {capture: true, passive: false} : true;

  //2. registry map for CustomEvent
  const eventToClass = {};
  const eventToCaptureClass = {};
  const eventToListener = {};

  //3. loop for evaluating CascadeEvents and defaultActions
  function processTriggerEvent(event) {
    //todo new
    if (eventToCaptureClass[event.type]){
      for (let task of eventToCaptureClass[event.type].triggerEvent(event, true) || [])
        setTimeout(task, 0);
      return;
    }
    //todo new
    const composedPath = event.composedPath();
    const ComposedEventClasses = new Set(eventToClass[event.type]);

    //3a. we loop first up the target chain, and then we check each of the ComposedEventClasses match functions ONCE
    for (let el of composedPath) {
      for (let ComposedEventClass of ComposedEventClasses) {
        if (!ComposedEventClass.matches(event, el))
          continue;
        ComposedEventClasses.delete(ComposedEventClass);

        for (let task of ComposedEventClass.triggerEvent(event) || [])
          setTimeout(task, 0);

        if (event.defaultPrevented)
          ;//todo something like switching from matches to matchesGrabbed
           //todo or more likely, that it will call a method for all other ComposedEventClass when they have added their
      }
    }
  }

  function addEventListenerIfNeeded(eventType) {

    if (eventToListener[eventType])
      return;
    // (eventType === "click" || eventType === "auxclick" || eventType === "dblclick" || eventType === "contextmenu")?
    //   document.addEventListener(eventType, processTriggerEvent, thirdArg):
    //todo, do I need to go via document? I can ensure that the window.addEventListener is added later in many other ways.
    window.addEventListener(eventType, processTriggerEvent, thirdArg);
    eventToListener[eventType] = processTriggerEvent;
  }

  function removeEventListenerIfNeeded(eventType) {
    if (eventToCaptureClass[eventType] || eventToClass[eventType])
      return;
    // (eventType === "click" || eventType === "auxclick" || eventType === "dblclick" || eventType === "contextmenu")?
    //   document.removeEventListener(eventType, processTriggerEvent, thirdArg):
    window.removeEventListener(eventType, processTriggerEvent, thirdArg);
    delete eventToListener[eventType];
  }

  //4. the customEvents.define(...)
  window.customEvents = {};
  customEvents.define = function (CustomEventClass, types) {
    const observedEvents = types || CustomEventClass.observedEvents;
    for (let eventType of observedEvents) {
      if (!eventToClass[eventType])
        eventToClass[eventType] = new Set();
      addEventListenerIfNeeded(eventType);
      eventToClass[eventType].add(CustomEventClass);
    }
  };

  customEvents.undefine = function (CustomEventClass, types) {
    const observedEvents = types || CustomEventClass.observedEvents;
    for (let eventType of observedEvents) {
      eventToClass[eventType].delete(CustomEventClass);
      if (eventToClass[eventType].size === 0) {
        delete eventToClass[eventType];
        removeEventListenerIfNeeded(eventType);
      }
    }
  };
  //todo new below
  customEvents.setEventTypeCapture = function (CaptureClass, arrayOfEventNames) {
    for (let i = 0; i < arrayOfEventNames.length; i++) {
      let eventType = arrayOfEventNames[i];
      if (eventToCaptureClass[eventType] && eventToCaptureClass[eventType] !== CaptureClass) {
        if (i > 0)
          customEvents.releaseEventTypeCapture(arrayOfEventNames.slice(0, i - 1));
        throw new Error("Event: " + eventType + " is already captured.");
      }
      eventToCaptureClass[eventType] = CaptureClass;
      addEventListenerIfNeeded(eventType);
      if (eventToClass[eventType]) {
        for (let CustomEventClass of eventToClass[eventType]) {
          if (CaptureClass !== CustomEventClass)
            CustomEventClass.capturedEvent(eventType)
        }
      }
    }
  };
  customEvents.releaseEventTypeCapture = function (arrayOfEventNames) {
    for (let eventType of arrayOfEventNames) {
      delete eventToCaptureClass[eventType];
      removeEventListenerIfNeeded(eventType);
    }
  }
})();
