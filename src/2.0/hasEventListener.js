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
    ogAdd(name, cb, options);
    this[reg][name] || (this[reg][name] = []);
    const capture = !!(options === true || (options && options.capture));
    if (lastIndexOf(this[reg][name], cb, capture) === -1)
      this[reg][name].push({cb, capture});
  };

  const ogRemove = HTMLElement.prototype.removeEventListener;
  HTMLElement.prototype.removeEventListener = function (name, cb, options) {
    ogRemove(name, cb, options);
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