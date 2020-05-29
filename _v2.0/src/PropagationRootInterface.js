const addEventListenerOriginal = EventTarget.prototype.addEventListener;
Object.defineProperty(EventTarget.prototype, "addEventListener", {
  value: function (name, cb, options) {
    //activate event controller if necessary
    if (name.indexOf("-") >= 0)   //todo remove this - eventually...
      (this.activateEvent ? this : this.getRootNode()).activateEvent(name);
    addEventListenerOriginal.call(this, name, cb, options);
    // todo if (!this.isConnected)
    // todo   throw new Error("Don't add event listeners on elements not connected to the DOM. Not cool.");
    // todo.. no i don't know how to do this now..
    //todo maybe the monitoring service for automatic gc of unused event controllers should run as a true event observer on the
    //todo propagation root instead.. This is not necessary. As long as we have a method deactivate, then it is all good.
  }
});

export function addPropagationRootInterface(clazz) {
  Object.defineProperties(clazz, {
    defineEvent: {
      //define event. we need the name to be an array of names of events that this event controller might dispatch.
      //the clazz, can be a clazz or a link to a clazz.
      //if the link is a class, then the class name is assumed to be either options.className or the filename itself.
      //options.useLocal will force the search from the activate event controller to use this definition first, not get a definition from the parent.
      value: function (name, clazz, options) {
        const eventControllers = this._eventControllers || (this._eventControllers = new Map());
        if (eventControllers.has(name))
          throw new Error("defining the same event twice on the same root, you must make up your mind about one.");
        //so here we need to iterate names to add them all.
        eventControllers.set(name, {clazz, options});
        //this is the registry of event definitions only. but, we need to pass in names.
      }
    },
    //here, we will search the registry for the names of the event controllers, and then use the local first if options.useLocal
    // we use the parent root again, we need to make this into a universal method.
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
    //here, we need to get the definition, turn it on, and then add it to the registry of active event listeners.
    //these event listeners can have two states. They can be queued, or just active. But, they are queued for different
    //event names. This can be a little complex to manage in the controller.
    //we need to deactivate it, also. This require a search for the appropriate event controller, and then deactivate it.
    //this is a GC process, we don't need to do this immediately, we can do it when we have time/need to gc.
    //idleCallback() sound good here.
    activateEvent: {
      value: function (name) {
        const activeEventListeners = this._activeEventListeners || (this._activeEventListeners = new Map());
        if (activeEventListeners.has(name))
          return;
        const controllerClass = this.getEventControllerDefinition(name)?.clazz;
        const controller = new controllerClass(this);
        controller.connect();
        controller && activeEventListeners.set(name, controller);
      }
    }
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