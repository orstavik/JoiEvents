(function () {
  const reg = Symbol("eventListenerRegister");

  function lastIndexOf(list, cb, capture){
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

  //3. loop for evaluating CascadeEvents and defaultActions
  function processTriggerEvent(event) {
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

  //4. the customEvents.define(...)
  window.customEvents = {};
  customEvents.define = function (CustomEventClass, types) {
    const observedEvents = types || CustomEventClass.observedEvents;
    for (let eventType of observedEvents) {
      if (!eventToClass[eventType]) {
        eventToClass[eventType] = new Set();
        // (eventType === "click" || eventType === "auxclick" || eventType === "dblclick" || eventType === "contextmenu")?
        //   document.addEventListener(eventType, processTriggerEvent, thirdArg):
        //todo, do I need to go via document? I can ensure that the window.addEventListener is added later in many other ways.
        window.addEventListener(eventType, processTriggerEvent, thirdArg);
      }
      eventToClass[eventType].add(CustomEventClass);
    }
  };

  customEvents.undefine = function (CustomEventClass, types) {
    const observedEvents = types || CustomEventClass.observedEvents;
    for (let eventType of observedEvents) {
      eventToClass[eventType].delete(CustomEventClass);
      if (eventToClass[eventType].size === 0) {
        eventToClass[eventType] = undefined;
        // (eventType === "click" || eventType === "auxclick" || eventType === "dblclick" || eventType === "contextmenu")?
        //   document.removeEventListener(eventType, processTriggerEvent, thirdArg):
        window.removeEventListener(eventType, processTriggerEvent, thirdArg);
      }
    }
  };
})();
