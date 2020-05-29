
//todo this distinguish between the window and document as propagation roots.
//todo this is not how the platform works today.
//todo don't know which way to land here. If the bounce behavior should be preserved here.
function getCurrentRoot(event) {
  return event.currentTarget.getRootNode ? event.currentTarget.getRootNode() : event.currentTarget;
}

const stopPropagations = new WeakMap(); //event => root => whenStopPropWasCalled
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
  if (!stopProp)
    return false;
  return stopProp === true || stopProp.currentTarget !== event.currentTarget || stopProp.eventPhase !== event.eventPhase;
}

Object.defineProperties(Event.prototype, {
  stopPropagation: {
    value: function () {
      stopProp(this, {currentTarget: this.currentTarget, eventPhase: this.eventPhase});
    }
  },
  stopImmediatePropagation: {
    value: function () {
      stopProp(this, true);
    }
  }
});

const listenerWrappers = new WeakMap();

const original = EventTarget.prototype.addEventListener;
Object.defineProperty(EventTarget.prototype, "addEventListener", {
  value: function (type, cb, options) {
    let wrapped = listenerWrappers.get(cb);
    if (!wrapped) {
      const unstoppable = options?.unstoppable;
      wrapped = function (e) {
        if (unstoppable || !isCurrentlyStopped(e))
          return cb.call(this, e);
      };
      listenerWrappers.set(cb, wrapped);
    }
    original.call(this, type, wrapped, options);
  }
});