/**
 * add earlybird event listeners on window.
 */
const reg = Symbol("eventListenerRegister");

function equivListener(list, cb, options) {
  return list.findIndex(function (cbOptions) {
    if (cbOptions.cb !== cb)
      return false;
    const a = cbOptions.options, b = options;
    const aBool = !!(a === true || (a instanceof Object && a.capture));       //todo test if the option can be truthy or if it must be boolean true
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
  EventTarget.prototype.addEventListener.call(this, name, cb, options);
};

Window.prototype.removeEventListener = function (name, cb, options) {
  if (!this[reg] || !this[reg][name])
    return;
  const index = equivListener(this[reg][name], cb, options);
  if (index === -1)
    return;
  this[reg][name].splice(index, 1);
  EventTarget.prototype.removeEventListener.call(this, name, cb, options);
};

/**
 * This method has an implied binding to stopPrevent().
 * Even when you addEventListenerFirst, any stopPrevent will always remain and run first.
 **/
export function addEventListenerFirst(window, name, cb, options) {
  window[reg] || (window[reg] = {});
  window[reg][name] || (window[reg][name] = []);

  for (let cbOptions of window[reg][name]) {
    if (cbOptions.cb !== stopPrevent)     //stopPrevent from blockEvent is left and thus put at the very beginning
      EventTarget.prototype.removeEventListener.call(window, name, cbOptions.cb, cbOptions.options);
  }
  EventTarget.prototype.addEventListener.call(window, name, cb, options);
  for (let cbOptions of window[reg][name]) {
    if (cbOptions.cb !== stopPrevent)     //as stopPrevent was not removed, it doesn't need to be added again
      EventTarget.prototype.addEventListener.call(window, name, cbOptions.cb, cbOptions.options);
  }
  const index = equivListener(window[reg][name], cb, options);
  if (index >= 0)
    window[reg][name].splice(index, 1);
  window[reg][name].unshift({cb, options});
}

const stopPrevent = function (e) {
  e.preventDefault();
  e.stopImmediatePropagation();
  const index = equivListener(window[reg][e.type], stopPrevent, stopPreventOptions);
  if (index >= 0)
    window[reg][e.type].splice(index, 1);
  if (blockers[e.type]) {
    clearTimeout(blockers[e.type]);
    blockers[e.type] = 0;
  }
};
const stopPreventOptions = {capture: true, once: true, passive: false};

const blockers = {};

export function blockEvent(eventName) {
  addEventListenerFirst(window, eventName, stopPrevent, stopPreventOptions);
  blockers[eventName] = setTimeout(function () {
    blockers[eventName] = 0;
    window.removeEventListener(eventName, stopPrevent, stopPreventOptions);
  }, 0);
}