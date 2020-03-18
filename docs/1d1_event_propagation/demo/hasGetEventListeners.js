function findEquivalentListener(registryList, listener, useCapture) {
  return registryList.findIndex(cbOptions => cbOptions.listener === listener && cbOptions.capture === useCapture);
}

const ogAdd = EventTarget.prototype.addEventListener;
const ogRemove = EventTarget.prototype.removeEventListener;

EventTarget.prototype.addEventListener = function (name, listener, options) {
  this._eventTargetRegistry || (this._eventTargetRegistry = {});
  this._eventTargetRegistry[name] || (this._eventTargetRegistry[name] = []);
  const entry = options instanceof Object ? Object.assign({listener}, options) : {listener, capture: options};
  entry.capture = !!entry.capture;
  const index = findEquivalentListener(this._eventTargetRegistry[name], listener, entry.capture);
  if (index >= 0)
    return;
  this._eventTargetRegistry[name].push(entry);
  ogAdd.call(this, name, listener, options);
};

EventTarget.prototype.removeEventListener = function (name, listener, options) {
  if (!this._eventTargetRegistry || !this._eventTargetRegistry[name])
    return;
  const capture = !!(options instanceof Object ? options.capture : options);
  const index = findEquivalentListener(this._eventTargetRegistry[name], listener, capture);
  if (index === -1)
    return;
  this._eventTargetRegistry[name].splice(index, 1);
  ogRemove.call(this, name, listener, options);
};

EventTarget.prototype.getEventListeners = function (name, phase) {
  if (!this._eventTargetRegistry || !this._eventTargetRegistry[name])
    return null;
  if (phase === Event.AT_TARGET)
    return this._eventTargetRegistry[name].slice();
  if (phase === Event.CAPTURING_PHASE)
    return this._eventTargetRegistry[name].filter(listener => listener.capture);
  //(phase === Event.BUBBLING_PHASE)
  return this._eventTargetRegistry[name].filter(listener => !listener.capture);
};

EventTarget.prototype.hasEventListener = function (name, cb, options) {
  if (!this._eventTargetRegistry || !this._eventTargetRegistry[name])
    return false;
  const capture = !!(options instanceof Object ? options.capture : options);
  const index = findEquivalentListener(this._eventTargetRegistry[name], cb, capture);
  return index !== -1;
};