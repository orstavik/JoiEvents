(function () {

  const lastNodeCache = new WeakMap();
  function getLastPropagationNode(event) {
    if (lastNodeCache.has(event))
      return lastNodeCache.get(event);
    const path = event.composedPath();
    let last;
    if (event.bubbles)
      last = path[path.length - 1];
    else if (!event.composed)//todo verify focus events.composed === true
      last = path[0];
    else {
      last = event.target;
      for (let i = 1; i < path.length - 1; i++) {
        if (path[i] instanceof ShadowRoot)
          last = path[i + 1];
      }
    }
    lastNodeCache.set(event, last);
    return last;
  }

  //ensure that we have proper ordering for event listeners on the window node.
  //add last
  //a post propagation callback is a callback that will run once for an event.
  //it will throw an Error if there is already a postPropagationListener added
  const firstSymbol = Symbol("firstSymbol");

  const postPropagationCallbacks = new WeakMap();

  function removePostPropagationListener(event) {
    const {wrapper, cb} = postPropagationCallbacks.get(event);
    postPropagationCallbacks.delete(event);
    const node = getLastPropagationNode(event);
    node.removeEventListener(event.type, wrapper);
    delete node.addEventListener;
    return cb;
  }

  function addPostPropagationCallback(event, cb) {
    const wrapper = function (e) {
      cb.call(this, e);
      removePostPropagationListener(event);
    };
    postPropagationCallbacks.set(event, {wrapper, cb});
    const lastNode = getLastPropagationNode(event);
    lastNode.addEventListener(event.type, wrapper);
    const addEventListenerOG = lastNode.addEventListener;

    lastNode.addEventListener = function (type, listener, options) {
      const res = addEventListenerOG.call(this, type, listener, options);
      if (event.type === type) {
        lastNode.removeEventListener(event.type, wrapper);
        addEventListenerOG.call(this, event.type, wrapper);
      }
      return res;
    }.bind(lastNode);
  }

  function hasPostPropagationCallback(event, nativeCutOff) {
    return postPropagationCallbacks.has(event) || lowestNativeAction(event, nativeCutOff)
  }

  function lowestNativeAction(event, cutoffPoint) {
    for (let el of event.composedPath()) {
      if (el === cutoffPoint)
        return null;
      let nativeAction;
      if (el.joiGetNativeAction && (nativeAction = el.joiGetNativeAction(event)))
        return nativeAction;
    }
    return null;
  }

  const stopOG = Event.prototype.stopImmediatePropagation;
  const preventDefaultOG = Event.prototype.preventDefault;
  const preventedEvents = new WeakSet();
  Object.defineProperties(Event.prototype, {
    "setDefault": {
      value: function (cb) {
        if (!(cb instanceof Function))
          throw new Error("event.setDefault(cb) must be given a function as an argument. If you want to 'null out' a defaultAction, call preventDefault().");
        preventedEvents.delete(this);
        if (hasPostPropagationCallback(this, this.currentTarget))
          return;                               //there is already a default action, we do nothing.
        preventDefaultOG.call(this);
        addPostPropagationCallback(this, cb);
        //to add a default action to an event that already has a default action, call preventDefault(), and then setDefault()
      }
    },
    "preventDefault": {
      value: function () {
        preventedEvents.add(this);
        preventDefaultOG.call(this);
        if (hasPostPropagationCallback(this))
          return removePostPropagationListener(this);
      }
    },
    "defaultPrevented": {
      get: function () {
        return preventedEvents.has(this);
      }
    },
    "stopPropagation": {
      value: function () {
        throw new Error("Event.stopPropagation() is disabled. See: CaptureTorpedo, ShadowTorpedo, and SlotTorpedo.");
      }
    },
    "stopImmediatePropagation": {
      value: function () {
        if (this[firstSymbol])
          return stopOG.call(this);
        throw new Error(
          "Event.stopImmediatePropagation() is disabled. " +
          "Only allowed for the very first event listener during EventGrabbing. " +
          "See also: CaptureTorpedo, ShadowTorpedo, and SlotTorpedo.");
      }
    }
  });

//disable closed shadowDOM.
  const shadowOg = HTMLElement.prototype.attachShadow;
  const alwaysOpen = {mode: "open"};
  Object.defineProperty(HTMLElement.prototype, "attachShadow", {
    value: function (ignored) {
      return shadowOg.call(this, alwaysOpen);
    }
  });

// const registry = new Map();        //this is a weak map, as it will die when the window dies  =8-)
// const wrapperRegistry = new WeakMap(); //this is a weak map, as it will die when the window dies  =8-)
// const captureOptions = {capture: true}, bubbleOptions = {};
// const addEventListenerOg = Window.prototype.addEventListener;
// const removeEventListenerOg = Window.prototype.removeEventListener;
// Object.defineProperty(Window.prototype, "removeEventListener", {
//   value: function (type, listener, options) {
//     options = options instanceof Object ? options : options ? captureOptions : bubbleOptions;
//     if (options.first)
//       listener = wrapperRegistry.get(listener);
//     const prevListeners = registry[type] || (registry[type] = []);
//     const index = prevListeners.findIndex(entry =>
//       entry.listener === listener && entry.options.capture === options.capture
//     );
//     prevListeners.splice(index, 1);
//     return removeEventListenerOg.call(this, type, listener, options);
//   }
// });
// Object.defineProperty(Window.prototype, "addEventListener", {
//   value: function (type, listener, options) {
//     options = options instanceof Object ? options : options ? captureOptions : bubbleOptions;
//     const prevListeners = registry[type] || (registry[type] = []);
//     const hasOtherListeners = prevListeners.length > 0;
//     const alreadyHasFirst = hasOtherListeners && prevListeners[0].first;
//
//     if (options.first && !options.capture)
//       throw new Error("'first' event listeners must be added with the capture event listener option.");
//     if (alreadyHasFirst && options.first)
//       throw new Error(
//         "There can be only one 'first' event listener. " +
//         "The first event listener must be removed first " +
//         "before another first event listener can be added.");
//
//     if (options.first) {
//       const wrapper = function (e) {
//         e[firstSymbol] = true;
//         listener.call(this, e);
//         delete e[firstSymbol];
//       }
//       wrapperRegistry.set(listener, wrapper);
//
//       for (let listener of prevListeners)
//         removeEventListenerOg.call(this, listener.type, listener.listener, listener);
//       prevListeners.unshift(Object.assign({}, options, {listener: wrapper, type}));
//       for (let listener of prevListeners)
//         addEventListenerOg.call(this, listener.type, listener.listener, listener);
//       return;
//     }
//
//     if (!options.first) {
//       prevListeners.push(Object.assign({}, options, {listener, type}));
//       return addEventListenerOg.call(this, type, listener, options);
//     }
//   }
// });

// const dispatchOg = DocumentFragment.prototype.dispatchEvent;
// Object.defineProperty(DocumentFragment.prototype, "dispatchEvent", {
//   value: function (event) {
//     if (!event.composed)
//       throw new Error("shadowRoot.dispatchEvent() is disabled for composed: false events.");
//     return dispatchOg.call(this, event);
//   }
// });
})
();