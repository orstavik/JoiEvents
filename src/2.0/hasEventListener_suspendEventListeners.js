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
    if (!this.isSuspendedEventListeners(name, options))
      ogAdd.call(this, name, cb, options);
    this[reg][nc] || (this[reg][nc] = []);
    if (lastIndexOf(this[reg][nc], cb) === -1)
      this[reg][nc].push({cb, options});
  };

  const ogRemove = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.removeEventListener = function (name, cb, options) {
    const nc = nameCapture(name, options);
    if (!this.isSuspendedEventListeners(name, options))
      ogRemove.call(this, name, cb, options);
    const index = lastIndexOf(this[reg][nc], cb);
    if (index >= 0)
      this[reg][nc].splice(index, 1);
  };

  /**
   *
   * @param name
   * @param options true/false || {capture: true/false}.
   *                if undefined, then both are accepted.
   * @returns {boolean}
   */
  EventTarget.prototype.hasEventListener = function (name, options) {
    if (!this[reg])
      return false;
    const one = nameCapture(name, options);
    if (this[reg][one])
      return true;
    if (options === undefined)
      return !!(this[reg][nameCapture(name, true)]);
    return false;
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