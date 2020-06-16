const targetToListeners = new WeakMap();

//this thing returns immutable listeners
export function getEventListeners(target, type, phase) {
  const allListeners = targetToListeners.get(target);
  if (!allListeners || (!type && !phase))
    return allListeners;
  if (!allListeners[type])
    return null;
  if (!phase || phase === Event.AT_TARGET)
    return allListeners[type].slice();
  if (phase === Event.CAPTURING_PHASE)
    return allListeners[type].filter(listener => listener.capture);
  if (phase === Event.BUBBLING_PHASE)
    return allListeners[type].filter(listener => !listener.capture);
  throw new Error("Illegal event phase for getEventListeners: phase can only be Event.BUBBLING_PHASE, Event.CAPTURING_PHASE, or Event.AT_TARGET.");
}

function findEquivalentListener(registryList, listener, useCapture) {
  return registryList.findIndex(cbOptions => cbOptions.listener === listener && cbOptions.capture === useCapture);
}

function addListener(target, type, listenerObj) {
  let allListeners = targetToListeners.get(target);
  if (!allListeners)
    targetToListeners.set(target, allListeners = {});
  let typeListeners = allListeners[type] || (allListeners[type] = []);
  const index = findEquivalentListener(typeListeners, listenerObj.listener, listenerObj.capture);
  if (index === -1)
    return false;
  typeListeners.push(listenerObj);
  return true;
}

function removeListener(target, type, listener, capture) {
  let allListeners = targetToListeners.get(target);
  if (!allListeners)
    return false;
  let typeListeners = allListeners[type];
  if (!typeListeners)
    return false;
  const index = findEquivalentListener(typeListeners, listener, capture);
  if (index === -1)
    return false;
  typeListeners.splice(index, 1);//mutates
  return true;
}

function makeListenerObject(type, listener, options) {
  return options instanceof Object ?
    Object.assign({}, options, {listener, type, capture: !!options.capture}) :
    {listener, type, capture: !!options};
}

export function addEventTargetRegistry(eventTargetPrototype){
  const ogAdd = eventTargetPrototype.addEventListener;
  const ogRemove = eventTargetPrototype.removeEventListener;

  eventTargetPrototype.addEventListener = function (type, listener, options) {
    const entry = makeListenerObject(type, listener, options);
    addListener(this, type, entry); //if this returns false, then we should be able to skip the below step
    ogAdd.call(this, type, listener, options);
  };

  eventTargetPrototype.removeEventListener = function (type, listener, options) {
    const capture = !!(options instanceof Object ? options.capture : options);
    removeListener(this, type, listener, capture);
    ogRemove.call(this, type, listener, options);
  };  
}

