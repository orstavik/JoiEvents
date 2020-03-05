# Pattern: ExtendEventListenerOptions

In this chapter we implement two additional event listener options:
 1. `first` (custom option) 
 2. `grab` (custom option) 

## new EventListenerOption: `first`

`first` tells the `EventTarget` to put the event listener first in the EventTargetRegistry FIFO queue. To accomplish this, the extended `addEventListener(...)` method needs to:
1. remove all the registered event listeners in the underlying, native register, then
2. add the new event listener first in the EventTargetRegistry, and then
3. add all the event listeners in the EventTargetRegistry to the underlying, native register again.   

```javascript
EventTarget.prototype.addEventListener = function (name, listener, options) {
  this._eventTargetRegistry || (this._eventTargetRegistry = {});
  this._eventTargetRegistry[name] || (this._eventTargetRegistry[name] = []);
  const entry = options instanceof Object ? Object.assign({listener}, options) : {listener, capture: options};
  entry.capture = !!entry.capture;
  const index = findEquivalentListener(this._eventTargetRegistry[name], listener, entry.capture);
  if (index >= 0)
    return;
  if (options.immediateOnly){
    options.once = false;
    const immediateSelf = this, immediateCb = entry.listener, immediateCapture = entry.capture;
    const macroTask = toggleTick(function() {
      immediateSelf.removeEventListener(name, immediateCb, immediateCapture);
    });
    entry.listener = function(e){
      macroTask.cancel();
      immediateSelf.removeEventListener(name, immediateCb, immediateCapture);
      immediateCb(e);
    }
  } 
  if (options.once){
    const onceSelf = this, onceCb = entry.listener, onceCapture = entry.capture;
    entry.listener = function(e){
      onceSelf.removeEventListener(name, onceCb, onceCapture);
      onceCb(e);
    }
  }
  if (options.first){
    for (let listener of this._eventTargetRegistry[name]) 
      ogRemove.call(this, name, listener.listener, listener);
    this._eventTargetRegistry[name].unshift(entry);
    for (let listener of this._eventTargetRegistry[name]) 
      ogAdd.call(this, name, listener.listener, listener);
  } else {
    this._eventTargetRegistry[name].push(entry);
    ogAdd.call(this, name, listener, options);
  }
};
``` 

## new EventListenerOption: `grab`

`grab` tells the `EventTarget` to put the event listener 1) first in the EventTargetRegistry FIFO queue and 2) disallow other event listeners to be put before it.
 
```javascript
EventTarget.prototype.addEventListener = function (name, listener, options) {
  this._eventTargetRegistry || (this._eventTargetRegistry = {});
  this._eventTargetRegistry[name] || (this._eventTargetRegistry[name] = []);
  const entry = options instanceof Object ? Object.assign({listener}, options) : {listener, capture: options};
  entry.capture = !!entry.capture;
  const index = findEquivalentListener(this._eventTargetRegistry[name], listener, entry.capture);
  if (index >= 0)
    return;
  if (entry.immediateOnly){
    entry.once = false;
    const immediateSelf = this, immediateCb = entry.listener, immediateCapture = entry.capture;
    const macroTask = toggleTick(function() {
      immediateSelf.removeEventListener(name, immediateCb, immediateCapture);
    });
    entry.listener = function(e){
      macroTask.cancel();
      immediateSelf.removeEventListener(name, immediateCb, immediateCapture);
      immediateCb(e);
    }
  } 
  if (entry.once){
    const onceSelf = this, onceCb = entry.listener, onceCapture = entry.capture;
    entry.listener = function(e){
      onceSelf.removeEventListener(name, onceCb, onceCapture);
      onceCb(e);
    }
  }
  if (entry.grab){
    if (this._eventTargetRegistry[name][0].grab)
      throw new Error("The event " + name + " has already been grabbed.");
    entry.first = true;
  }
  if (entry.first){
    for (let listener of this._eventTargetRegistry[name]) 
      ogRemove.call(this, name, listener.listener, listener);
    if (!this._eventTargetRegistry[name][0].grab)
     this._eventTargetRegistry[name].unshift(entry);
    else
     this._eventTargetRegistry[name].splice(1,0,entry); // todo test this
    for (let listener of this._eventTargetRegistry[name]) 
      ogAdd.call(this, name, listener.listener, listener);
  } else {
    this._eventTargetRegistry[name].push(entry);
    ogAdd.call(this, name, listener, entry);
  }
};
``` 

## Demo: EventTargetRegistry

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
    if (options.immediateOnly){
      options.once = false;
      const immediateSelf = this, immediateCb = entry.listener, immediateCapture = entry.capture;
      const macroTask = toggleTick(function() {
        immediateSelf.removeEventListener(name, immediateCb, immediateCapture);
      });
      entry.listener = function(e){
        macroTask.cancel();
        immediateSelf.removeEventListener(name, immediateCb, immediateCapture);
        immediateCb(e);
      }
    }
    if (options.once){
      const onceSelf = this, onceCapture = entry.capture;
      entry.listener = function(e){
        onceSelf.removeEventListener(name, entry.listener, onceCapture);
        listener(e);
      }
    }
    if (options.first)
      options.priority = Number.MAX_SAFE_INTEGER;
    if (options.priority !== undefined) {
      if (options.priority > Number.MAX_SAFE_INTEGER)
        options.priority = Number.MAX_SAFE_INTEGER;
      if (options.priority < Number.MIN_SAFE_INTEGER)
        options.priority = Number.MIN_SAFE_INTEGER;
      if (!Number.isInteger(options.priority))
        options.priority = parseInt(options.priority);
      if (isNaN(options.priority)){
        delete options.priority;
      } else {
        for (let listener of this._eventTargetRegistry[name])
          ogRemove.call(this, name, listener.listener, listener);
        const index = this._eventTargetRegistry[name].findIndex(listener => (listener.priority || 0) <= options.priority);
        this._eventTargetRegistry[name].splice(index, 0, entry);
        for (let listener of this._eventTargetRegistry[name])
          ogAdd.call(this, name, listener.listener, listener);
      }
    }
    if (options.priority === undefined){
      this._eventTargetRegistry[name].push(entry);
      ogAdd.call(this, name, entry.listener, options);
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
</script>

<h1>Click me!</h1>

<script>
  function log1(e) {
    console.log(e.type + " one");
  }
  function log2(e) {
    console.log(e.type + " two");
  }
  function log3(e) {
    console.log(e.type + " three");
  }

  const h1 = document.querySelector("h1");

  h1.addEventListener("click", log3, {once: true});
  h1.addEventListener("click", log2, {first: true});
  h1.addEventListener("click", log1, {first: true});
  h1.dispatchEvent(new MouseEvent("click"));
  h1.dispatchEvent(new MouseEvent("click"));

  window.addEventListener("click", function(e){
    console.log("this click was supposed to be first.");
  }, true);
  window.addEventListener("mousedown", function(e){
    console.log("mousedown");
    window.addEventListener("click", function(e){
      e.stopImmediatePropagation();
      e.preventDefault();
      console.log("stopped click");
    }, {capture: true, first: true, immediateOnly: true});
  }, true);

  h1.addEventListener("mouseup", log1, {priority: 1});
  h1.addEventListener("mouseup", log2, {priority: 2});
  h1.addEventListener("mouseup", log3, {priority: 3});
</script>
```

Result:

```
click one
click two
click three
click one
click two
mousedown
mouseup three
mouseup two
mouseup one
stopped click
```

## References

 * [MDN: `EventTarget`](https://developer.mozillthea.org/en-US/docs/Web/API/EventTarget)
 * [Google: `getEventListeners(target)`](https://developers.google.com/web/updates/2015/05/get-and-debug-event-listeners)