//target* => cb* => type+" "+capture => cbOnce
const targetToCb = new WeakMap();

function makeKey(type, options) {
  return type + " " + !!(options instanceof Object ? options.capture : options);
}

function addOnceWrapper(target, type, cb, options, realCb) {
  let cbToDict = targetToCb.get(target);
  cbToDict || targetToCb.set(target, cbToDict = new WeakMap());
  let dictToRealCb = cbToDict.get(cb);
  dictToRealCb || cbToDict.set(cb, dictToRealCb = {});
  const typeCapture = makeKey(type, options);
  if (dictToRealCb[typeCapture])   //todo this is dev time checking, i think this should be removed during production
    return false;                  // throw new Error("once event listener option patch not working as it should!!");
  dictToRealCb[typeCapture] = realCb;
  return true;
}

function removeOnceWrapper(target, type, cb, options) {
  const cbToDict = targetToCb.get(target);
  if (!cbToDict)
    return false;
  const dictToRealCb = cbToDict.get(cb);
  if (!dictToRealCb)
    return false;
  const typeCapture = makeKey(type, options);
  const actual = dictToRealCb[typeCapture];
  if (!actual)   //todo this is dev time checking, i think this should be removed during production
    return false;//  throw new Error("once event listener option patch not working as it should!!");
  delete dictToRealCb[typeCapture];
  return actual;
}

export function patchEventListenerOptionOnce(EventTargetPrototype) {
  const addEventListenerOG = EventTargetPrototype.addEventListener;
  const removeEventListenerOG = EventTargetPrototype.removeEventListener;

  function addEventListenerOnce(type, cb, options) {
    //the cb is already added, either once or not
    let actualCb = cb;
    if (options instanceof Object && options.once) {
      options = Object.assign({}, options);
      options.once = false;
      actualCb = function onceWrapped(e) {
        //this is the patch.. that the removeEventListener goes via the JS method, not happens in the background..
        //this means that other patches such as updating the event listener registry works.
        this.removeEventListener(type, cb, options);
        cb(e);
      }
    }
    if (addOnceWrapper(this, type, cb, options, actualCb))
      addEventListenerOG.call(this, type, actualCb, options);
  }

  function removeEventListenerOnce(type, cb, options) {
    const actualCb = removeOnceWrapper(this, type, cb, options);
    actualCb && removeEventListenerOG.call(this, type, actualCb, options);
  }

  Object.defineProperty(EventTargetPrototype, "addEventListener", {value: addEventListenerOnce});
  Object.defineProperty(EventTargetPrototype, "removeEventListener", {value: removeEventListenerOnce});
}