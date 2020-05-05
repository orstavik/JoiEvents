(function () {


  const firstSymbol = Symbol("firstSymbol");

//dev time restrictions:
// 1. stopPropagation() restrictions can most often be skipped runtime. However, they might not. You can have a web component that only calls stopProp in certain edge cases, that you do not see design-time.
// 2. dispatchEvent() restrictions on the shadowRoots can be skipped run-time. Again, there might be a component that does this under very rare contexts, but most likely you will be fine.

//run time restrictions: attachShadow must be open.


//disable regular .stopPropagation(). It should never be used.
  Object.defineProperty(Event.prototype, "stopPropagation", {
    value: function () {
      throw new Error("Event.stopPropagation() is disabled. See: CaptureTorpedo, ShadowTorpedo, and SlotTorpedo.");
    }
    // , writable: false
  });

//disable regular .stopImmediatePropagation() for all but the very first event listner. Same reason as for stopPropagation().
  Object.defineProperty(Event.prototype, "stopImmediatePropagation", {
    value: function () {
      if (this[firstSymbol])
        return stopOg.call(this);
      throw new Error("Event.stopImmediatePropagation() is disabled. Only allowed for the very first event listener during EventGrabbing. See also: CaptureTorpedo, ShadowTorpedo, and SlotTorpedo.");
    }
    // , writable: false
  });

//disable closed shadowDOM.
  const shadowOg = HTMLElement.prototype.attachShadow;
  const alwaysOpen = {mode: "open"};
  Object.defineProperty(HTMLElement.prototype, "attachShadow", {
    value: function (ignored) {
      return shadowOg.call(this, alwaysOpen);
      //problem is that you cannot see if native defaultAction is added to a composed: true event in a closed shadowDOM from an outside event listener.
      //you can add an event listener for all such events in the native DOM instead, but until the event.hasDefaultAction is set, then it is better to have all composedPath() be complete not only up, but also down.
    }
  });

//disallow dispatching composed: false events directly at a shadowRoot.
//This would make the capture phase safe for all shadowRoots.
//dev-time restriction only possible
  const dispatchOg = DocumentFragment.prototype.dispatchEvent;
  Object.defineProperty(DocumentFragment.prototype, "dispatchEvent", {
    value: function (event) {
      if (event.composed)
        return dispatchOg.call(this, event);
      throw new Error("shadowRoot.dispatchEvent() is disabled for composed: false events.");
      //the alternative approach is to make DocumentFragment.addEventListener(...) work like window.addEventListener(...).
      //but, this is much more overhead. and the likelihood is that no call to DocumentFragment.dispatchEvent will be made.
      //so, this is the most efficient, least obtrusive way to block this bad behavior.

      //this restriction could be added only when composed:false event controllers run.
      //if this is done, then it would be possible to check for the event name too.
      //make a blockDispatchOnShadowRootsForComposedFalseEvents(eventName){  Object.define(....       if (event.composed && event.type !== eventName) ... }
    }
  });

  //add first event listener option for window node.
  //This could be added globally to the EventTarget interface,
  //but we don't do that because that will be heavier.
  //do we need to add this to the DocumentFragment too?
  //so that we can grab composed: false events within shadowRoot too?
  //no, this is not necessary,
  //inside a shadowDOM, devs are expected to be able to control first event listener themselves.
  //the only problem being the desire to call stopPropagation before an event is slotted..
/*
  const registry = new Map();        //this is a weak map, as it will die when the window dies  =8-)
  const wrapperRegistry = new WeakMap(); //this is a weak map, as it will die when the window dies  =8-)
  const captureOptions = {capture: true}, bubbleOptions = {};
  const addEventListenerOg = Window.prototype.addEventListener;
  const removeEventListenerOg = Window.prototype.removeEventListener;
  Object.defineProperty(Window.prototype, "removeEventListener", {
    value: function (type, listener, options) {
      options = options instanceof Object ? options : options ? captureOptions : bubbleOptions;
      if (options.first)
        listener = wrapperRegistry.get(listener);
      const prevListeners = registry[type] || (registry[type] = []);
      const index = prevListeners.findIndex(entry =>
        entry.listener === listener && entry.options.capture === options.capture
      );
      prevListeners.splice(index, 1);
      return removeEventListenerOg.call(this, type, listener, options);
    }
  });
  Object.defineProperty(Window.prototype, "addEventListener", {
    value: function (type, listener, options) {
      options = options instanceof Object ? options : options ? captureOptions : bubbleOptions;
      const prevListeners = registry[type] || (registry[type] = []);
      const hasOtherListeners = prevListeners.length > 0;
      const alreadyHasFirst = hasOtherListeners && prevListeners[0].first;

      if (options.first && !options.capture)
        throw new Error("'first' event listeners must be added with the capture event listener option.");
      if (alreadyHasFirst && options.first)
        throw new Error(
          "There can be only one 'first' event listener. " +
          "The first event listener must be removed first " +
          "before another first event listener can be added.");

      if (options.first) {
        for (let listener of prevListeners)
          removeEventListenerOg.call(this, listener.type, listener.listener, listener);
        const wrapper = function (e) {
          e[firstSymbol] = true;
          listener.call(this, e);
          delete e[firstSymbol];
        }
        wrapperRegistry.set(listener, wrapper);
        const newListener = Object.assign({}, options, {listener: wrapper, type});
        prevListeners.unshift(newListener);
        for (let listener of prevListeners)
          addEventListenerOg.call(this, listener.type, listener.listener, listener);
        return;
      }

      if (!options.first) {
        prevListeners.push(Object.assign({}, options, {listener, type}));
        return addEventListenerOg.call(this, type, listener, options);
      }
    }
  });
  */

  function getLastPropagationNode(event) {
    const path = event.composedPath();
    if (event.bubbles)
      return path[path.length - 1];
    if (!event.composed)//todo verify focus events.composed === true
      return path[0];
    //else if (event.composed && !event.bubbles)
    let last = event.target;
    for (let i = 1; i < path.length - 1; i++) {
      if (path[i] instanceof ShadowRoot)
        last = path[i + 1];
    }
    return last;
  }


  //ensure that we have proper ordering for event listeners on the window node.
  //add last
  function addLastEventListener(node, lastType, lastListener) {
    node.addEventListener(lastType, lastListener);
    const ogAddEventListener = node.addEventListener;
    node.addEventListener = function (type, listener, options) {
      if (lastType !== type)
        return ogAddEventListener.call(this, type, listener, options);

      node.removeEventListener(lastType, lastListener);
      ogAddEventListener.call(this, type, listener, options);
      return ogAddEventListener.call(this, lastType, lastListener);
    }.bind(node);
  }

  //a post propagation callback is a callback that will run once for an event.
  //it will throw an Error if there is already a postPropagationListener added
  const postPropagationCallbacks = new WeakMap();
  const postPropagationCallbackWrappers = new WeakMap();

  Object.defineProperty(Event.prototype, "postPropagationCallback", {
    set: function (callback) {
      //cancelling a non-existing postPropagationCallback()
      if (!callback && !postPropagationCallbacks.has(this))
        return;
      postPropagationCallbacks.set(this, callback);

      const lastNode = getLastPropagationNode(this);
      if (!postPropagationCallbackWrappers.has(this)) {
        const wrapper = e => {
          this.postPropagationCallback(e);
          this.postPropagationCallback = null;
        }
        postPropagationCallbackWrappers.set(this, wrapper);
        addLastEventListener(lastNode, this.type, wrapper);
      }
      if (!callback) {
        const wrapper = postPropagationCallbackWrappers.get(this);
        lastNode.removeEventListener(this.type, wrapper);
        delete lastNode.addEventListener;
        postPropagationCallbacks.delete(this);
        postPropagationCallbackWrappers.delete(this);
      }
    },
    get() {
      return postPropagationCallbacks.get(this);
    }
  });

  //preventDefault() returns the default action task that is stopped, so that it can be used by others.
  const preventDefaultOg = Event.prototype.preventDefault;
  Object.defineProperty(Event.prototype, "preventDefault", {
    value: function () {
      preventDefaultOg.call(this);//todo here I need to find the function for native defaultActions
      if (!this.postPropagationCallback)
        return;
      const defaultAction = this.postPropagationCallback;
      this.postPropagationCallback = null;
      return defaultAction;
    }
  });

  //addDefaultAction
  //if the event has a default action, then the defaultAction will not overwrite as default mode.
  //to overwrite, you need to first call preventDefault(), which returns the previous default action if it is possible to overwrite,
  //and then wrap it, if you want, and then after that call setDefaultAction().
  //if you want to wrap the existing default action, then you must call preventDefault() first to get the default action, and
  //then call the setDefault method
  Object.defineProperty(Event.prototype, "setDefault", {
    value: function (cb) {
      if (!this.postPropagationCallback)
        this.postPropagationCallback = cb;
    }
  });

//conventions:
//1. grab is only done on the very first node in propagation.
//for composed true events, they are added as window.addEventListener(composed-type, grabbing function that can call .stopImmediatePropagation() and .preventDefault(). Its only grab that needs to ensure that it is the very first, event controllers such as drag'n'drop
//2. event controllers are added as a capture phase event listener on the root of the propagation. They should not distinguish between targets in the propagation phase, they must ensure that they are not run in the target phase..
//2x. maybe we need to separate this on the target. If so, then we need to control the sequence on all event Target nodes, and that is heavy.
//3. event listeners that add default actions are added in the target and bubble phase.
//4.
})();
