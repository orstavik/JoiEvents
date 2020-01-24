/**
 * I need to grabEvent
 */
(function () {
  function grabEvent(eventName, cb){
    //it would be natural to grabEvent on an event. But.. We might like to grab events that are not yet dispatched..
    //and so the event object itself is not the natural home..
    //also, we are grabbing from an actual position. Not everywhere.
    //we are grabbing events passing through window.
    //so
    // window.grabEventType("name", cb)
    //and
    // window.addEventTypeGrabbedCallback("name", cb)
    // window.removeEventTypeGrabbedCallback("name", cb)


    //it also would be natural to call Event.add/removeGrabCallback() statically on the Event prototype.
  }
})();

(function () {
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
  const eventToListener = {};

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

        const tasks = ComposedEventClass.triggerEvent(event);
        // for (let task of tasks || [])
        //   setTimeout(task, 0);

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
    if (!eventToListener[eventType])  /*eventToCaptureClass[eventType] || eventToClass[eventType]*/
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
})();
