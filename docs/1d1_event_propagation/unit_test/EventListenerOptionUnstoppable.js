//target* => cb* => type+" "+capture => cbOnce
function getCurrentRoot(event) {
  const root = event.currentTarget.getRootNode ? event.currentTarget.getRootNode() : event.currentTarget;
  return root === document ? window : root;
}

const stopPropagations = new WeakMap();//event => root => whenStopPropWasCalled
                                       //whenStopPropWasCalled:
                                       //  .stopPropagation() => {currentTarget, eventPhase}
                                       //  .stopImmediatePropagation() => true
function stopProp(event, value) {
  let eventToRoot = stopPropagations.get(event);
  if (!eventToRoot)
    stopPropagations.set(event, eventToRoot = new WeakMap());
  const root = getCurrentRoot(event);
  if (value === true || !eventToRoot.has(root))
    eventToRoot.set(root, value);
}

function isCurrentlyStopped(event) {
  const stopProp = stopPropagations.get(event)?.get(getCurrentRoot(event));
  if (!stopProp)        //the event has not been stopped under this root
    return false;
  if (stopProp === true)//the event has been called stopImmediatePropagation, under this root
    return true;
  //stopPropagation was first called on this currentTarget in this eventPhase
  if (stopProp.currentTarget === event.currentTarget && stopProp.eventPhase === event.eventPhase)
    return false;
  return true;
}

const stoppableWrappers = new WeakMap();

export function addEventListenerOptionUnstoppable(EventTargetPrototype, EventPrototype) {
  const addEventListenerOG = EventTargetPrototype.addEventListener;
  const removeEventListenerOG = EventTargetPrototype.removeEventListener;

  //todo test:  add the same function to different targets, different event types, different phases

  function addEventListenerOnce(type, cb, options) {
    let wrapped = cb;
    if (!(options instanceof Object) || !options.unstoppable) {
      wrapped = function (e) {
        if (!isCurrentlyStopped(e))
          cb.call(this, e);
      };
      stoppableWrappers.set(cb, wrapped);
    }
    addEventListenerOG.call(this, type, wrapped, options);
  }

  function removeEventListenerOnce(type, cb, options) {
    //tries to remove both the stoppable and the unstoppable wrapper. Don't know which one was added here.
    const stoppableCb = stoppableWrappers.get(cb);
    if (stoppableCb)
      removeEventListenerOG.call(this, type, stoppableCb, options);
    removeEventListenerOG.call(this, type, cb, options);
  }

  function stopPropagation() {
    stopProp(this, {currentTarget: this.currentTarget, eventPhase: this.eventPhase});
  }

  function stopImmediatePropagation() {
    stopProp(this, true);
  }

  Object.defineProperty(EventPrototype, "stopPropagation", {value: stopPropagation});
  Object.defineProperty(EventPrototype, "stopImmediatePropagation", {value: stopImmediatePropagation});
  Object.defineProperty(EventTargetPrototype, "addEventListener", {value: addEventListenerOnce});
  Object.defineProperty(EventTargetPrototype, "removeEventListener", {value: removeEventListenerOnce});
}