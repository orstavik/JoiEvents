/**
 * hasEventListener()
 */
const reg = Symbol("eventListenerRegister");

function equivListener(list, cb, options) {
  return list.findIndex(function (cbOptions) {
    if (!(cb === undefined || cbOptions.cb === cb))
      return false;
    const a = cbOptions.options;
    const b = options;
    const aBool = !!(a === true || (a instanceof Object && a.capture));
    const bBool = !!(b === true || (b instanceof Object && b.capture));
    return aBool === bBool;
  });
}

const ogAdd = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function (name, cb, options) {
  this[reg] || (this[reg] = {});
  this[reg][name] || (this[reg][name] = []);
  if (equivListener(this[reg][name], cb, options) >= 0)
    return;
  ogAdd.call(this, name, cb, options);
  this[reg][name].push({
    cb,
    options
  });
};

const ogRemove = EventTarget.prototype.removeEventListener;
EventTarget.prototype.removeEventListener = function (name, cb, options) {
  if (!this[reg] || !this[reg][name])
    return;
  ogRemove.call(this, name, cb, options);
  const index = equivListener(this[reg][name], cb, options);
  if (index >= 0)
    this[reg][name].splice(index, 1);
};

EventTarget.prototype.hasEventListenerInstance = function (name, listenerKey) {
  return this[reg] && this[reg][name] && (this[reg][name].indexOf(listenerKey) !== -1);
};

EventTarget.prototype.getEventListenerInstances = function (name, phase) {
  if (!this[reg] || !this[reg][name])
    return [];
  if (phase === Event.AT_TARGET)
    return this[reg][name];
  if (phase === Event.CAPTURING_PHASE)
    return this[reg][name].filter(listener => listener.options === true || (listener.options && listener.options.capture === true));
  //(phase === Event.BUBBLING_PHASE)
  return this[reg][name].filter(listener => !(listener.options === true || (listener.options && listener.options.capture === true)));
};

function getComposedPath(target) {
  const path = [];
  for (; target.parentNode !== null; target = target.parentNode)
    path.push(target);
  path.push(document, window);
  return path;
}

function callListenersOnElement(currentTarget, event, phase, async) {
  if (event._propagationStopped || event._immediatePropagationStopped)
    return;
  if (!event.bubbles && phase === Event.BUBBLING_PHASE)
    return;
  //1. lock the listeners being iterated. We cannot add listeners anymore.
  const listeners = currentTarget.getEventListenerInstances(event.type, phase);
  //2. update the event object to set the currentTarget to be the element currently propagated
  const updatedEvent = Object.defineProperty(event, "currentTarget", {
    value: currentTarget,
    writable: true
  });
  //3. iterate all event listeners for the current phase on this target
  for (let listener of listeners) {
    //4. check to see if the listener has been removed! cause we can remove, just not add them anymore.
    if (!currentTarget.hasEventListenerInstance(event.type, listener))
      continue;
    //5. catch all errors, so that an error in one event listener doesn't prevent the next event listener from running
    try {
      //6. invoke the event listener
      if (async)
        setTimeout(function () {
          const updatedEvent = Object.defineProperty(event, "currentTarget", {
            value: currentTarget,
            writable: true
          });
          if (updatedEvent._immediatePropagationStopped)
            return;
          if (currentTarget !== updatedEvent._lastTargetTriggered) {
            if (updatedEvent._propagationStopped && (!updatedEvent.bubbles && phase === Event.BUBBLING_PHASE))
              return;
          }
          updatedEvent._lastTargetTriggered = currentTarget;
          listener.cb(updatedEvent);
        });
      else
        listener.cb(updatedEvent);
    } catch (err) {
      //7. if the event listener fails, write the error message to the console.
      console.error(err.message);
    }
  }
}

// function dispatchEventAsync(target, event) {
//   event.stopPropagation = function () {
//     this._propagationStopped = true;
//   };
//   event.stopImmediatePropagation = function () {
//     this._immediatePropagationStopped = true;
//   };
//   const propagationPath = getComposedPath(target);                        //locks the propagation path at the outset of event dispatch
//   for (let i = propagationPath.length - 1; i >= 1; i--)
//     setTimeout(callListenersOnElement.bind(null, propagationPath[i], event, Event.CAPTURING_PHASE));
//   setTimeout(callListenersOnElement.bind(null, target, event, Event.AT_TARGET));
//   for (let i = 1; i < propagationPath.length; i++)
//     setTimeout(callListenersOnElement.bind(null, propagationPath[i], event, Event.BUBBLING_PHASE));
// }
//
function dispatchEvent(target, event, async) {
  event.stopPropagation = function () {
    this._propagationStopped = true;
  };
  event.stopImmediatePropagation = function () {
    this._immediatePropagationStopped = true;
  };
  //locks the propagation path at the outset of event dispatch
  const propagationPath = getComposedPath(target).slice(1);
  for (let currentTarget of propagationPath.reverse())
    callListenersOnElement(currentTarget, event, Event.CAPTURING_PHASE, async);
  callListenersOnElement(target, event, Event.AT_TARGET, async);
  for (let currentTarget of propagationPath)
    callListenersOnElement(currentTarget, event, Event.BUBBLING_PHASE, async);
}