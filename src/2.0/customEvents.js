(function () {
  const registers = {};     //

  const ogAdd = HTMLElement.prototype.addEventListener;
  HTMLElement.prototype.addEventListener = function (name, cb, options) {
    ogAdd(name, cb, options);
    if (!registers[name])
      registers[name] = new WeakSet();
    registers[name].add(this);
  };

  const ogRemove = HTMLElement.prototype.removeEventListener;
  HTMLElement.prototype.addEventListener = function (name, cb, options) {
    ogAdd(name, cb, options);
    if (!registers[name])
      registers[name] = new WeakSet();
    registers[name].delete(this);
  };

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
  customEvents.define = function (CustomEventClass) {
    const observedEvents = CustomEventClass.observedEvents;
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

  customEvents.undefine = function (CustomEventClass) {
    const observedEvents = CustomEventClass.observedEvents();
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
