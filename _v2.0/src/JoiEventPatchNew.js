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

  const firstSymbol = Symbol("firstSymbol");

  function addPostPropagationCallback(event) {
    event._wrapper = function (e) {
      event._defaultAction && event._defaultAction.call(this, e);
      const node = getLastPropagationNode(event);
      node.removeEventListener(event.type, event._wrapper);
      delete node.addEventListener;
    };
    const lastNode = getLastPropagationNode(event);
    lastNode.addEventListener(event.type, event._wrapper);
    const addEventListenerOG = lastNode.addEventListener;

    lastNode.addEventListener = function (type, listener, options) {
      const res = addEventListenerOG.call(this, type, listener, options);
      if (event.type === type) {
        lastNode.removeEventListener(event.type, event._wrapper);
        addEventListenerOG.call(this, event.type, event._wrapper);
      }
      return res;
    }.bind(lastNode);
  }

  function findLowerNativeAction(path, start, end, event) {
    start = /*!start ? 0 : */path.indexOf(start);
    path = path.slice(start + 1, path.indexOf(end));
    path = path.filter(n => n.joiGetNativeAction).map(n => n.joiGetNativeAction(event)).filter(fun => fun);
    return path.length && path[0];
  }

  const dispatchEventOriginal = EventTarget.prototype.dispatchEvent;
  Object.defineProperty(EventTarget.prototype, "dispatchEvent", {
    value: function (e) {
      e.fromDispatchEvent = true;
      dispatchEventOriginal.call(this, e);
    }
  });

  const addEventListenerOriginal = EventTarget.prototype.addEventListener;
  Object.defineProperty(EventTarget.prototype, "addEventListener", {
    value: function (name, cb, options) {
      if (options && options.composed)
        throw new Error("you should bounce your events, not compose: true them.");
      addEventListenerOriginal.call(this, name, cb, options);
    }
  });

  const stopOG = Event.prototype.stopImmediatePropagation;
  const preventDefaultOG = Event.prototype.preventDefault;
  const preventedEvents = new WeakSet();
  Object.defineProperties(Event.prototype, {
    "setDefault": {
      value: function (cb) {
        if (!(cb instanceof Function))
          throw new Error("event.setDefault(cb) must be given a function as an argument. If you want to 'null out' a defaultAction, call preventDefault().");

        if (this.eventPhase === Event.CAPTURING_PHASE)
          throw new Error("event.setDefault(cb) must be called during the bubble phase!!! If not the implied logic breaks down. Do not do element.addEventListener(type, function(e){ ...e.setDefault(...)}, TRUE)!!! There is a problem here that host target phase event listeners are marked as AT_TARGET, don't know how to fix that.");
        //ie. if you do webCompWithShadowDom.addEventListener("click", e=> e.setDefault(...), true),
        // and the click is triggered on an element inside the shadowRoot of webCompWithShadowDom, you will not get an error msg.

        //adding a default action before the event is dispatched.
        //before the event is dispatched, calling setDefault(cb) will simply overwrite the value of the default action.
        if (this.eventPhase === 0)
          return this._defaultAction = cb;

        //already have a custom defaultAction placed from a lower DOM context, this should override the lightDOM default action unless the lightDOM specifically calls preventDefault().
        if (this._defaultAction)
          return;
        //already have a native defaultAction placed from a lower DOM context, this should override the lightDOM default action unless the lightDOM specifically calls preventDefault().
        const nativeAction = findLowerNativeAction(this.composedPath(), this._lastPrevented, this.currentTarget, this);
        if (nativeAction) {
          this._defaultAction = nativeAction;
          return;
        }
        //there is no lower defaultAction set, that has not also been cancelled before. You are free to add your own default action
        preventDefaultOG.call(this); //this is done to prevent slotted event listeners such as <a href> to *also* do their default action.
        preventedEvents.delete(this);
        this._defaultAction = cb;
        //todo this we only do for events dispatched by the browsers native event controllers
        if (!this._wrapper && !this.fromDispatchEvent)
          addPostPropagationCallback(this);
        //todo here I have done some stuff..
        // todo can we use .isTrusted as a proxy for not from dispatchEvent??

        //todo all events that are dispatched from a function in the DOM should bounce, no events should be composed: true.
      }
    },
    "preventDefault": {
      value: function () {
        preventDefaultOG.call(this);
        preventedEvents.add(this);
        const previousPrevent = this._lastPrevented;
        this._lastPrevented = this.currentTarget;
        if (this._defaultAction) {
          const res = this._defaultAction;
          delete this._defaultAction;
          return res;
        }
        return findLowerNativeAction(this.composedPath(), previousPrevent, this._lastPrevented, this);
      }
    },
    "defaultPrevented": {
      get: function () {
        return preventedEvents.has(this);
      }
    },
    //todo fix this so that all addEventListeners are wrapped, and that stopPropagation() works within the current DOM context.
    "stopPropagation": {
      value: function () {
        throw new Error("Event.stopPropagation() is disabled. See: CaptureTorpedo, ShadowTorpedo, and SlotTorpedo.");
      }
    },
    //todo fix this so that all addEventListeners are wrapped, and that stopPropagation() works within the current DOM context.
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
    value: function (options) {
      options instanceof Object ? options.mode = "open" : options = alwaysOpen;
      return shadowOg.call(this, options);
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
})();