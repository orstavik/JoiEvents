(function () {

  var idOrigin = {};
  var idCb = {};

  window.zetZeroTimeout = function (cb2) {
    const mid = "pm." + Math.random();    // IE 10 does not support location.origin
    const origin = window.location.origin || window.location.protocol + '//' + window.location.hostname + (window.location.port ? (':' + window.location.port) : '');
    idOrigin[mid] = origin;
    idCb[mid] = cb2;
    window.postMessage(mid, origin);
  };

  function onMessage(evt) {
    if (evt.source !== window)
      return;
    const mid = evt.data;
    if (!idOrigin[mid])
      return;
    if (idOrigin[mid] !== evt.origin)
      throw new Error("wtf");
    // window.removeEventListener("message", handle);
    evt.stopPropagation();
    const cb = idCb[mid];
    delete idOrigin[mid];
    delete idCb[mid];
    cb();
  }

  window.addEventListener("message", onMessage);
  /**
   * hasEventListener()
   */
  const reg = Symbol("eventListenerRegister");

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
    ogAdd.call(this, name, cb, options);
    this[reg][name].push({cb, options});
  };

  const ogRemove = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.removeEventListener = function (name, cb, options) {
    if (!this[reg] || !this[reg][name])
      return;
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

  function callListener(cb, event, currentTarget) {
    const updatedEvent = Object.defineProperty(event, "currentTarget", {value: currentTarget, writable: true});
    cb(updatedEvent);
  }

  EventTarget.prototype.dispatchEventNatively = function (event) {
    const composedPath = [];
    let target = this;
    while (target.parentNode !== null) {
      composedPath.push(target);
      target = target.parentNode;
    }
    composedPath.push(document, window);
    //capture
    for (let i = composedPath.length - 1; i >= 1; i--) {
      const target = composedPath[i];
      if (!target[reg] || !target[reg][event.type])
        continue;
      for (let listener of target[reg][event.type]) {
        if (listener.options === true || listener.options.capture === true)
          zetZeroTimeout(callListener.bind(null, listener.cb, event, target));
      }
    }
    //target
    if (this[reg] && this[reg][event.type]) {
      for (let listener of this[reg][event.type])
        zetZeroTimeout(callListener.bind(null, listener.cb, event, target));
    }
    //bubble
    for (let i = 1; i < composedPath.length; i++) {
      let target = composedPath[i];
      if (!target[reg] || !target[reg][event.type])
        continue;
      for (let listener of target[reg][event.type]) {
        if (!(listener.options === true || listener.options.capture === true))
          zetZeroTimeout(callListener.bind(null, listener.cb, event, target));
      }
    }
    //do default actions
    if (composedPath[0].tagName === "SUMMARY" && composedPath[1].tagName === "DETAILS")
      zetZeroTimeout(function () {
        composedPath[1].open = !composedPath[1].open;
      });
  };
})();