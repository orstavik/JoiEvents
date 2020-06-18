//target* => type+" "+capture => [lastCb, lastCbOptions]
const targetToTypeCapture = new WeakMap();

function makeKey(type, options) {
  return type + " " + !!(options instanceof Object ? options.capture : options);
}

function getLast(target, type, options) {
  const dictToLastCb = targetToTypeCapture.get(target);
  return dictToLastCb && dictToLastCb[makeKey(type, options)];
}

function setLast(target, type, lastCb, options) {
  let dictToLastCb = targetToTypeCapture.get(target);
  dictToLastCb || targetToTypeCapture.set(target, dictToLastCb = {});
  const key = makeKey(type, options);
  if(dictToLastCb[key])
    return false;//we don't need to throw here..
  return dictToLastCb[key] = [lastCb, options];
}

function removePreviousLastIfItIsTheCb(target, type, cb, options) {
  let dictToLastCb = targetToTypeCapture.get(target);
  if(!dictToLastCb)
    return false;
  const key = makeKey(type, options);
  if(!dictToLastCb[key] || dictToLastCb[key][0] !== cb)
    return false;
  delete dictToLastCb[key];
  return true;
}

export function addEventListenerOptionLast(EventTargetPrototype) {
  const addEventListenerOG = EventTargetPrototype.addEventListener;
  const removeEventListenerOG = EventTargetPrototype.removeEventListener;

  function addEventListenerLast(type, cb, options) {
    const last = options instanceof Object && !!options.last;
    const lastEntry = getLast(this, type, options);
    let previousLast, previousLastOptions;
    if(lastEntry)
      [previousLast, previousLastOptions] = lastEntry;
    if (last && options.capture)
      throw new Error("last option can only be used with bubble phase (at_target bubble phase) event listeners");
    if (last && previousLast) {
      throw new Error("only one event listener {last: true} can be added to a target for the same event type and capture/bubble event phase.");
    } else if (last) {
      setLast(this, type, cb, options);
      addEventListenerOG.call(this, type, cb, options);
    } else if (previousLast) {
      this.removeEventListener(type, previousLast, previousLastOptions)
      addEventListenerOG.call(this, type, cb, options);
      this.addEventListener(type, previousLast, previousLastOptions);
    } else {
      addEventListenerOG.call(this, type, cb, options);
    }
  }

  function removeEventListenerLast(type, cb, options) {
    removePreviousLastIfItIsTheCb(this, type, cb, options);//todo this will return true if the removed listener also was "last".
    removeEventListenerOG.call(this, type, cb, options);
  }

  Object.defineProperty(EventTargetPrototype, "addEventListener", {value: addEventListenerLast});
  Object.defineProperty(EventTargetPrototype, "removeEventListener", {value: removeEventListenerLast});
}