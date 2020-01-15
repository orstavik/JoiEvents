(function () {
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

  /**
   * hasEventListener()
   */
  const reg = Symbol("eventListenerRegister");
  const grabbed = Symbol("grabbedEventTypes");

  function equivListener(list, cb, options) {
    return list.findIndex(function (cbOptions) {
      if (!(cb === undefined || cbOptions.cb === cb))
        return false;
      // if (options === undefined)
      //   return true;
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
    if (!this[grabbed] || !this[grabbed][name])
      ogAdd.call(this, name, cb, options);
    this[reg][name].push({cb, options});
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

    const wrappedCB = function(e){
      e.preventDefault();
      e.stopPropagation();
      cb(e);
    };
    for (let name of names) {
      for (let listener of this[reg][name] || [])
        ogRemove.call(this, name, listener.cb, listener.options);
      ogAdd.call(this, name, wrappedCB, captureActive);
      this[grabbed][name] = wrappedCB;
    }

    const eventsGrabbedEvent = new CustomEvent("events-grabbed", {details: names});
    CustomEvents.queueTaskInEventLoop(window.dispatchEvent.bind(window, eventsGrabbedEvent));
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

    const eventsGrabbedEvent = new CustomEvent("events-freed", {details: names});
    CustomEvents.queueTaskInEventLoop(window.dispatchEvent.bind(window, eventsGrabbedEvent));
  };
})();