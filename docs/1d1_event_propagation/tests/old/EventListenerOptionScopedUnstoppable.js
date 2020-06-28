//target* => cb* => type+" "+capture => cbOnce
const stoppableWrappers = new WeakMap();

function makeKey(type, options) {
  return (options instanceof Object ? options.capture : options) ? type + " capture" : type;
}

function setWrapper(target, type, cb, options, wrapped) {
  let cbMap = stoppableWrappers.get(target);
  if (!cbMap)
    stoppableWrappers.set(target, cbMap = new WeakMap());
  let typeDict = cbMap.get(cb);
  if (!typeDict)
    cbMap.set(cb, typeDict = {});
  const key = makeKey(type, options);
  if (typeDict[key])
    return null;
  return typeDict[key] = wrapped;
}

function removeWrapper(target, type, options, cb) {
  const typeDict = stoppableWrappers.get(target)?.get(cb);
  if (!typeDict)
    return null;
  const key = makeKey(type, options);
  const result = typeDict[key];
  delete typeDict[key];//todo typeDict[key] = undefined?? is this call cheaper??
  return result;
}

//scoped event listeners will only obey stopPropagations called inside the same scope.
//unstoppable event listeners will not obey any stopPropagations.
export function addEventListenerOptionScopedUnstoppable(EventTargetPrototype) {
  const addEventListenerOG = EventTargetPrototype.addEventListener;
  const removeEventListenerOG = EventTargetPrototype.removeEventListener;

  function addEventListenerUnstoppable(type, cb, options) {
    let wrapped;
    if (options instanceof Object && options.unstoppable) {
      wrapped = cb;
    } else if (options instanceof Object && options.scoped) {
      wrapped = function (e) {
        !isStopped(e, true) && cb.call(this, e);
      };
    } else {
      wrapped = function (e) {
        !isStopped(e, e.isScoped) && cb.call(this, e);
      };
    }
    if (setWrapper(this, type, cb, options, wrapped))
      addEventListenerOG.call(this, type, wrapped, options);
  }

  function removeEventListenerUnstoppable(type, cb, options) {
    //tries to remove both the stoppable and the unstoppable wrapper. Don't know which one was added here.
    const args = removeWrapper(this, type, options, cb) || cb;
    removeEventListenerOG.call(this, type, args, options);
  }

  Object.defineProperties(EventTargetPrototype, {
    addEventListener: {value: addEventListenerUnstoppable},
    removeEventListener: {value: removeEventListenerUnstoppable}
  });
}