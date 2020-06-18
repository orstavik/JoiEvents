const targetToListeners = new WeakMap();

//this thing returns immutable listeners
export function getEventListeners(target, type, phase) {
  const allListeners = targetToListeners.get(target);
  if (!allListeners)
    return [];
  if (!type && !phase)
    return allListeners.slice();
  if (!allListeners[type])
    return [];
  if (!phase || phase === Event.AT_TARGET)
    return allListeners[type].slice();
  if (phase === Event.CAPTURING_PHASE)
    return allListeners[type].filter(listener => listener.capture);
  if (phase === Event.BUBBLING_PHASE)
    return allListeners[type].filter(listener => !listener.capture);
  throw new Error("Illegal event phase for getEventListeners: phase can only be Event.BUBBLING_PHASE, Event.CAPTURING_PHASE, or Event.AT_TARGET.");
}

//todo do we need this??
// export function hasEventListener(target, type, phase, cb){
//   const listeners = getEventListeners(target, type, phase);
//   return listeners.indexOf(cb) !== -1;
// }

function findEquivalentListener(registryList, listener, useCapture) {
  return registryList.findIndex(cbOptions => cbOptions.listener === listener && cbOptions.capture === useCapture);
}

function addListener(target, type, listener, options) {
  let allListeners = targetToListeners.get(target);
  if (!allListeners)
    targetToListeners.set(target, allListeners = {});
  let typeListeners = allListeners[type] || (allListeners[type] = []);
  const capture = !!(options instanceof Object ? options.capture : options);
  const index = findEquivalentListener(typeListeners, listener, capture);
  if (index !== -1)
    return null;
  const entry = makeListenerObject(type, listener, options);
  typeListeners.push(entry);
  return entry;
}

function removeListener(target, type, listener, options) {
  let allListeners = targetToListeners.get(target);
  if (!allListeners)
    return null;
  let typeListeners = allListeners[type];
  if (!typeListeners)
    return null;
  const capture = !!(options instanceof Object ? options.capture : options);
  const index = findEquivalentListener(typeListeners, listener, capture);
  if (index === -1)
    return null;
  return typeListeners.splice(index, 1)[0];  //mutates
}

function makeListenerObject(type, listener, options) {
  const listenerObject = options instanceof Object ?
    Object.assign({}, options, {listener, type}) :
    {listener, type, capture: !!options};
  listenerObject.capture = !!listenerObject.capture;
  listenerObject.bubbles = !!listenerObject.bubbles;
  listenerObject.once = !!listenerObject.once;
  listenerObject.passive = !!listenerObject.passive;
  return listenerObject;
}

export function addEventTargetRegistry(EventTargetPrototype) {
  const ogAdd = EventTargetPrototype.addEventListener;
  const ogRemove = EventTargetPrototype.removeEventListener;

  function addEventListenerRegistry(type, listener, options) {
    const entry = addListener(this, type, listener, options);
    if (entry)             //addListener returns false when equivalent listener is already added.
      ogAdd.call(this, type, listener, entry);
    //the inside of the system sees the more elaborate options object.
    //this will break the native getListeners in dev tools, but do nothing else.
  }

  function removeEventListenerRegistry(type, listener, options) {
    const entry = removeListener(this, type, listener, options);
    if (entry)  //removeListener returns false when there is no listener to be removed.
      ogRemove.call(this, type, listener, entry);
  }

  Object.defineProperty(EventTargetPrototype, "addEventListener", {value: addEventListenerRegistry});
  Object.defineProperty(EventTargetPrototype, "removeEventListener", {value: removeEventListenerRegistry});
}

