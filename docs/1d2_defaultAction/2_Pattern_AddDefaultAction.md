# Pattern: AddDefaultAction

In this chapter we will add a method to the `Event` interface called `.addDefaultAction()`.

We want this method to behave the following:

1. `event.addDefaultAction(cb)` would run the function `cb` after the event cascade of `event` has been completed. The `event.addDefaultAction(cb)` does not cancel the browsers native default actions for the same event, as this can be controlled from the `preventDefault()` method. The function will not be added/cancelled if `preventDefault()` is called on the event. 
2. `event.addDefaultAction(cb, false)` will run `cb` after the native event cascade is completed as above, except that it will not be cancelled by calling `preventDefault()` on the event.
3. `event.addDefaultAction(cb, true, eventName)` will run `cb` only once either immediately before the subsequent eventName or as soon as the event cascade for the event is completed, and can be cancelled by `preventDefault()`.

## Making `.addDefaultAction(cb, cancellable, preEvent)` 

1. The callback function `cb` in `.addDefaultAction(cb, cancellable, preEvent)` should be run no later than the first `toggleTick()`. Hence, the `cb` is added to a `toggleTick()` task.
2. If a preEvent name is given, then the `cb` is also added to a once, EarlyBird event listener for such an immediately following event. If this EarlyBird event listener is triggered, it will cancel the `toggleTick` task.
3. The `cancellable` arguments defaults to `true`. If the `cancellable` argument is `true`, then the `cb` function will not be executed when time comes. Iff the `cancellable` argument is `false`, then no check will be done of the `event.defaultPrevented` before `cb` is executed.   

```javascript
//requires the event listener option immediatelyOnly and the toggleTick function
Object.defineProperty(Event.prototype, "addDefaultAction", {
  value: function (cb, cancellable, preEvent) {
    if (cancellable === undefined)
      cancellable = true;
    if (typeof (cancellable) !== 'boolean' && !(cancellable instanceof Boolean))
      throw new Error("The second argument 'cancellable' in Event.addDefaultAction(cb, cancellable, preEvent) is neither undefined nor a boolean.");
    if (cancellable) {
      if (this.defaultPrevented)
        return;
      const cbOG = cb;
      cb = function () {
        if (!this.defaultPrevented)
          cbOG();
      }.bind(this);
    }
    const toggleTask = toggleTick(cb);
    if (preEvent)
      window.addEventListener(preEvent, function () {
        toggleTask.cancel();
        cb();
      }, {immediateOnly: true, first: true});
  },
  writable: false
});
``` 

## Demo: 

```html
<script>
  function toggleTick(cb) {
    const details = document.createElement("details");
    details.style.display = "none";
    details.ontoggle = cb;
    document.body.appendChild(details);
    details.open = true;
    Promise.resolve().then(details.remove.bind(details));
    return {
      cancel: function () {
        details.ontoggle = undefined;
      },
      resume: function () {
        details.ontoggle = cb;
      }
    };
  }

  /**
   * getEventListeners(name, phase) returns a list of all the event listeners entries
   * matching that event name and that event phase.
   *
   * @param name
   * @param phase either Event.CAPTURING_PHASE, Event.AT_TARGET, or Event.BUBBLING_PHASE.
   *        Defaults to Event.BUBBLING_PHASE.
   * @returns {[{listener, capture}]}
   */
  EventTarget.prototype.getEventListeners = function (name, phase) {
    if (!this._eventTargetRegistry || !this._eventTargetRegistry[name])
      return null;
    if (phase === Event.AT_TARGET)
      return this._eventTargetRegistry[name].slice();
    if (phase === Event.CAPTURING_PHASE)
      return this._eventTargetRegistry[name].filter(listener => listener.capture);
    //(phase === Event.BUBBLING_PHASE)
    return this._eventTargetRegistry[name].filter(listener => !listener.capture);
  };

  /**
   * hasEventListeners(name, cb, options) returns a list of all the event listeners entries
   * matching that event name and that event phase. To query for an event listener in BOTH the
   * capture and bubble propagation phases, one must do two queries:
   *
   *    el.hasEventListener(name, cb, false) || el.hasEventListener(name, cb, true)
   *
   * @param name
   * @param cb
   * @param options the only option used in identifying the event listener is capture/useCapture.
   * @returns true if an equivalent event listener is in the list
   */
  EventTarget.prototype.hasEventListener = function (name, cb, options) {
    if (!this._eventTargetRegistry || !this._eventTargetRegistry[name])
      return false;
    const capture = !!(options instanceof Object ? options.capture : options);
    const index = findEquivalentListener(this._eventTargetRegistry[name], cb, capture);
    return index !== -1;
  };

  function findEquivalentListener(registryList, listener, useCapture) {
    return registryList.findIndex(cbOptions => cbOptions.listener === listener && cbOptions.capture === useCapture);
  }

  const ogAdd = EventTarget.prototype.addEventListener;
  const ogRemove = EventTarget.prototype.removeEventListener;

  EventTarget.prototype.addEventListener = function (name, listener, options) {
    this._eventTargetRegistry || (this._eventTargetRegistry = {});
    this._eventTargetRegistry[name] || (this._eventTargetRegistry[name] = []);
    const entry = options instanceof Object ? Object.assign({listener}, options) : {listener, capture: options};
    entry.capture = !!entry.capture;
    const index = findEquivalentListener(this._eventTargetRegistry[name], listener, entry.capture);
    if (index >= 0)
      return;
    if (entry.immediateOnly) {
      entry.once = false;
      const immediateSelf = this, immediateCb = entry.listener, immediateCapture = entry.capture;
      const macroTask = toggleTick(function () {
        immediateSelf.removeEventListener(name, entry.listener, immediateCapture);
      });
      entry.listener = function (e) {
        macroTask.cancel();
        immediateSelf.removeEventListener(name, entry.listener, immediateCapture);
        immediateCb(e);
      }
    }
    if (entry.once) {
      const onceSelf = this;
      const onceCapture = entry.capture;
      entry.listener = function (e) {
        onceSelf.removeEventListener(name, entry.listener, onceCapture);
        listener(e);
      }
    }
    if (entry.grab) {
      if (this._eventTargetRegistry[name][0].grab)
        throw new Error("The event " + name + " has already been grabbed.");
      entry.first = true;
    }
    if (entry.first) {
      for (let listener of this._eventTargetRegistry[name])
        ogRemove.call(this, name, listener.listener, listener);
      if (!this._eventTargetRegistry[name][0].grab)
        this._eventTargetRegistry[name].unshift(entry);
      else
        this._eventTargetRegistry[name].splice(1, 0, entry); // todo test this
      for (let listener of this._eventTargetRegistry[name])
        ogAdd.call(this, name, listener.listener, listener);
    } else {
      this._eventTargetRegistry[name].push(entry);
      ogAdd.call(this, name, entry.listener, entry);
    }
  };

  EventTarget.prototype.removeEventListener = function (name, listener, options) {
    if (!this._eventTargetRegistry || !this._eventTargetRegistry[name])
      return;
    const capture = !!(options instanceof Object ? options.capture : options);
    const index = findEquivalentListener(this._eventTargetRegistry[name], listener, capture);
    if (index === -1)
      return;
    this._eventTargetRegistry[name].splice(index, 1);
    ogRemove.call(this, name, listener, options);
  };

  Object.defineProperty(Event.prototype, "addDefaultAction", {
    value: function (cb, cancellable, preEvent) {
      if (cancellable === undefined)
        cancellable = true;
      if (typeof (cancellable) !== 'boolean' && !(cancellable instanceof Boolean))
        throw new Error("The second argument 'cancellable' in Event.addDefaultAction(cb, cancellable, preEvent) is neither undefined nor a boolean.");
      if (cancellable) {
        if (this.defaultPrevented)
          return;
        const cbOG = cb;
        cb = function () {
          if (!this.defaultPrevented)
            cbOG();
        }.bind(this);
      }
      const toggleTask = toggleTick(cb);
      if (preEvent)
        window.addEventListener(preEvent, function () {
          toggleTask.cancel();
          cb();
        }, {immediateOnly: true, first: true});
    },
    writable: false
  });
</script>

<div id="one">click.addDefaultAction(()=> console.log("one"));</div>
<div id="two">click.addDefaultAction(()=> console.log("two"), true);</div>
<div id="three">click.addDefaultAction(()=> console.log("three"), false);</div>
<div id="four">click.addDefaultAction(()=> console.log("four"), undefined);</div>
<div id="five">click.addDefaultAction(()=> console.log("five"), undefined, "dblclick");</div>
<div id="six">click.addDefaultAction(()=> console.log("six"), "throwMeAnError");</div>

<script>
  window.addEventListener("click", e => e.preventDefault());
  window.addEventListener("click", e => console.log(e.type));
  window.addEventListener("dblclick", e => console.log(e.type));
  const one = document.querySelector("#one");
  const two = document.querySelector("#two");
  const three = document.querySelector("#three");
  const four = document.querySelector("#four");
  const five = document.querySelector("#five");
  const six = document.querySelector("#six");
  one.addEventListener("click", e => e.addDefaultAction(() => console.log("one")));
  two.addEventListener("click", e => e.addDefaultAction(() => console.log("two"), true));
  three.addEventListener("click", e => e.addDefaultAction(() => console.log("three"), false));
  four.addEventListener("click", e => e.addDefaultAction(() => console.log("four"), undefined));
  five.addEventListener("click", e => e.addDefaultAction(() => console.log("five"), undefined, "dblclick"));
  six.addEventListener("click", e => e.addDefaultAction(() => console.log("six"), "throwMeAnError"));
</script>
```