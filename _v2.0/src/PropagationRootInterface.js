const nonBubblingEvents = ["toggle", "load", "unload", "scroll", "blur", "focus", "DOMNodeRemovedFromDocument", "DOMNodeInsertedIntoDocument", "loadstart", "loadend", "progress", "abort", "error", "mouseenter", "mouseleave", "pointerenter", "pointerleave", "pointerleave", "rowexit", "beforeunload", "stop", "start", "finish", "bounce", "Miscellaneous", "afterprint", "propertychange", "filterchange", "readystatechange", "losecapture"];

//I need to here
const addEventListenerOriginal = EventTarget.prototype.addEventListener;
Object.defineProperty(EventTarget.prototype, "addEventListener", {
  value: function (name, fun, options) {
    //activate event controller if necessary
    if (name.indexOf("-") >= 0)
      (this.activateEvent ? this : this.getRootNode()).activateEvent(name);
    addEventListenerOriginal.call(this, name, fun, options);
    // todo if (!this.isConnected)
    // todo   throw new Error("Don't add event listeners on elements not connected to the DOM. Not cool.");
  }
});

export function addPropagationRootInterface(clazz) {
  Object.defineProperties(clazz, {
    defineEvent: {
      value: function (name, clazz, options) {
        const eventControllers = this._eventControllers || (this._eventControllers = new Map());
        if (eventControllers.has(name))
          throw new Error("defining the same event twice on the same root, you must make up your mind about one.");
        eventControllers.set(name, {clazz, options});
      }
    },
    getEventControllerDefinition: {
      value: function (name) {
        const localController = this._eventControllers?.get(name);
        if (this === window || localController?.options?.useLocal)
          return localController;
        const parent = this === document ? window : this.host?.getRootNode();
        const parentController = parent.getEventControllerDefinition(name);
        return parentController || localController;
      }
    },
    activateEvent: {
      value: function (name) {
        const activeEventListeners = this._activeEventListeners || (this._activeEventListeners = new Map());
        if (activeEventListeners.has(name))
          return;
        const controller = this.getEventControllerDefinition(name)?.clazz;
        if (!controller)
          return;
        const stateMachine = new controller(this);
        activeEventListeners.set(name, stateMachine);
        stateMachine.connect();
      }
    },
    getActivateEventController: {
      value: function (name, nonRecursive) {
        const localController = this._activeEventListeners && this._activeEventListeners.get(name);
        if (localController || nonRecursive)
          return localController;
        const parent = this === document ? window : this.host?.getRootNode();
        return parent && parent.getActivateEventController(name, nonRecursive);
      }
    },
    bounceDefaultAction: {
      value: function (name, defaultAction) {
        const parent = this === document ? window : this.host?.getRootNode();
        const upperController = parent?.getActivateEventController(name);
        return !!(upperController && (upperController.defaultAction = defaultAction));
      }
    },
    addGuaranteedBubbleListener: {
      value: function (name, cb, onTarget) {
        if (nonBubblingEvents.indexOf(name) === -1 && !onTarget)
          return this.addEventListener(name, cb);
        const onTargetWrapper = function (e) {
          e.target.addEventListener(name, cb, {once: true, unstoppable: true});
        }
        return this.addEventListener(name, onTargetWrapper, {capture: true});
      }
    },
  });
}

// todo
//  function undefineEvent(name, clazz, options){
//    this._eventControllers.delete(name);
//  }
//  function deactivateEvent(name) {
//    const controller = this._activeEventListeners.get(name);
//    controller.disconnect();
//    this._activeEventListeners.delete(name);
//  }