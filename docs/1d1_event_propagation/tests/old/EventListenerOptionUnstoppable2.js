const beforePropagationRoot = {}; //todo adding semantics for calling stopPropagation before propagation begins

function getCurrentRoot(event) {
  if(!event.currentTarget)        //todo adding semantics for calling stopPropagation before propagation begins
    return beforePropagationRoot; //todo adding semantics for calling stopPropagation before propagation begins
  const root = event.currentTarget.getRootNode ? event.currentTarget.getRootNode() : event.currentTarget;
  return root === document ? window : root;
}

const stopPropagations = new WeakMap();//event => root => whenStopPropWasCalled
                                       //whenStopPropWasCalled:
                                       //  .stopPropagation() => {currentTarget, eventPhase}
                                       //  .stopImmediatePropagation() => true
const scopedStopPropagations = new WeakMap();//event => root => whenStopPropWasCalled
                                       //whenStopPropWasCalled:
                                       //  .stopPropagation() => {currentTarget, eventPhase}
                                       //  .stopImmediatePropagation() => true
function stopProp(event, value, scoped) {
  const map = scoped ? scopedStopPropagations : stopPropagations;
  let eventToRoot = map.get(event);
  if (!eventToRoot)
    map.set(event, eventToRoot = new WeakMap());
  const root = getCurrentRoot(event);
  if (value === true || !eventToRoot.has(root))
    eventToRoot.set(root, value);
}

//this is a "stopped in the DOM context of the current target"
function isCurrentlyStopped(event) {
  const isScoped = event.isScoped;
  //if the event is NOT scoped, we only need to check if there is set a normal stopPropagation other than on the current element in the current phase
  //or if the event has been blocked by a scoped stopPropagation().
  //else if the event IS scoped, then we we need to check if the event is blocked in the scope of both the maps. Then both maps are treated equally.
  const context = getCurrentRoot(event);
  const eventMap = stopPropagations.get(event);
  if (eventMap?.has(beforePropagationRoot)) //todo adding semantics for calling stopPropagation before propagation begins
    return true;                            //todo adding semantics for calling stopPropagation before propagation begins
  const stopProp = eventMap?.get(context);
  if (!stopProp)        //the event has not been stopped under this root
    return false;
  if (stopProp === true)//the event has been called stopImmediatePropagation, under this root
    return true;
  //stopPropagation was first called on this currentTarget in this eventPhase
  if (stopProp.currentTarget === event.currentTarget && stopProp.eventPhase === event.eventPhase)
    return false;
  return true;
}

//target* => cb* => type+" "+capture => cbOnce
const stoppableWrappers = new WeakMap();

function makeKey(type, options) {
  return type + " " + !!(options instanceof Object ? options.capture : options);
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
  let cbMap = stoppableWrappers.get(target);
  if (!cbMap)
    return null;
  let typeDict = cbMap.get(cb);
  if (!typeDict)
    return null;
  const result = typeDict[makeKey(type, options)];
  delete typeDict[makeKey(type, options)];
  return result;
}

export function addEventListenerOptionUnstoppable(EventTargetPrototype, EventPrototype) {
  const addEventListenerOG = EventTargetPrototype.addEventListener;
  const removeEventListenerOG = EventTargetPrototype.removeEventListener;

  function addEventListenerUnstoppable(type, cb, options) {
    let wrapped = cb;
    if (!(options instanceof Object && options.unstoppable)) {
      wrapped = function (e) {
        if (!isCurrentlyStopped(e))
          cb.call(this, e);
      };
      if(!setWrapper(this, type, cb, options, wrapped))
        return;
    }
    addEventListenerOG.call(this, type, wrapped, options);
  }

  function removeEventListenerUnstoppable(type, cb, options) {
    //tries to remove both the stoppable and the unstoppable wrapper. Don't know which one was added here.
    const args = removeWrapper(this, type, options, cb) || cb;
    removeEventListenerOG.call(this, type, args, options);
  }

  function stopPropagation(scoped) {
    stopProp(this, {currentTarget: this.currentTarget, eventPhase: this.eventPhase}, !!scoped);
  }

  function stopImmediatePropagation(scoped) {
    stopProp(this, true, !!scoped);
  }

  function getCancelBubble() {
    return stopPropagations.has(this);
  }

  function setCancelBubble(value) {
    return value && this.stopPropagation();
  }

  // function isStopped(){
  //   return isCurrentlyStopped(this);
  // }
  //
  // Object.defineProperty(EventPrototype, "isStopped", {get: isStopped});
  Object.defineProperty(EventPrototype, "cancelBubble", {get: getCancelBubble, set: setCancelBubble});
  Object.defineProperty(EventPrototype, "stopPropagation", {value: stopPropagation});
  Object.defineProperty(EventPrototype, "stopImmediatePropagation", {value: stopImmediatePropagation});
  Object.defineProperty(EventTargetPrototype, "addEventListener", {value: addEventListenerUnstoppable});
  Object.defineProperty(EventTargetPrototype, "removeEventListener", {value: removeEventListenerUnstoppable});
}