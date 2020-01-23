# WhatIs: Errors in event listeners

When an `Error` occurs during the execution of an event listener function, this `Error` does not directly influence the event propagation function nor the running of later event listeners. Instead, the `Error` is simply caught by the event propagation function and an `error` event is added to the event loop.

The `error` event is dispatched *synchronously*. This means that any event listener for the `error` event *plus* the default action of the error event of printing the error message to the console is done *before* any other event listeners are called.  

```html
<div id="outer">
  <h1 id="inner">Click on me!</h1>
</div>

<script>
  function log(e) {
    console.log(e.type + " on #" + e.currentTarget.id);
  }
  function error() {
    throw new Error("event listener break down");
  }

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");

  outer.addEventListener("click", error, true);
  inner.addEventListener("click", error);
  inner.addEventListener("click", log);
  outer.addEventListener("click", log);

  window.addEventListener("error", ()=> console.log("error on window"));

  inner.dispatchEvent(new MouseEvent("click", {bubbles: true}));
</script>
```

Results:

```
error on window
  Uncaught Error: event listener break down
    at HTMLDivElement.error ...
error on window
  Uncaught Error: event listener break down
    at HTMLHeadingElement.error ...
click on #inner
click on #outer
```

As we can see, a break down in one event listener doesn't affect the running of later event listeners in the propagation chain, not even when the breakdown occur in an event listener on the same element.

## Implementation

To avoid breaking the iterations of event listeners and propagation targets, we need to capture any errors that occur during the event listener callback. If an error occurs, we *synchronously* dispatch an `error` event on the `window` object. And if no one calls `preventDefault()` on this `error` event, we print the error message to the console.   

```javascript
try {
  listener.cb(event);
} catch (err) {
  const error = new ErrorEvent(
    'Uncaught Error', 
    {error : err, message : 'event listener break down'}
  );                       
  dispatchEvent(window, error);   //asusing the propagation demo dispatchEvent function to also dispatch the error event
  if (!error.defaultPrevented)
    console.error(error);
}
```

## Demo: dispatchEvent masquerade function

```html
<script>
  function matchEventListeners(funA, optionsA, funB, optionsB) {
    if (funA !== funB)
      return false;
    const a = optionsA === true || (optionsA instanceof Object && optionsA.capture === true);
    const b = optionsB === true || (optionsB instanceof Object && optionsB.capture === true);
    return a === b;
  }

  const ogAdd = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (name, cb, options) {
    this._eventListeners || (this._eventListeners = {});
    this._eventListeners[name] || (this._eventListeners[name] = []);
    const index = this._eventListeners[name]
      .findIndex(cbOptions => matchEventListeners(cbOptions.cb, cbOptions.options, cb, options));
    if (index >= 0)
      return;
    ogAdd.call(this, name, cb, options);
    this._eventListeners[name].push({cb, options});
  };

  const ogRemove = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.removeEventListener = function (name, cb, options) {
    if (!this._eventListeners || !this._eventListeners[name])
      return;
    const index = this._eventListeners[name]
      .findIndex(cbOptions => matchEventListeners(cbOptions.cb, cbOptions.options, cb, options));
    if (index === -1)
      return;
    ogRemove.call(this, name, cb, options);
    this._eventListeners[name].splice(index, 1);
  };

  EventTarget.prototype.getEventListeners = function (name, phase) {
    if (!this._eventListeners || !this._eventListeners[name])
      return [];
    if (phase === Event.AT_TARGET)
      return this._eventListeners[name].slice();
    if (phase === Event.CAPTURING_PHASE) {
      return this._eventListeners[name]
        .filter(listener => listener.options === true || (listener.options && listener.options.capture === true));
    }
    //(phase === Event.BUBBLING_PHASE)
    return this._eventListeners[name]
      .filter(listener => !(listener.options === true || (listener.options && listener.options.capture === true)));
  };

  EventTarget.prototype.hasEventListener = function (name, listener) {
    return this._eventListeners && this._eventListeners[name] && (this._eventListeners[name].indexOf(listener) !== -1);
  };

  function getComposedPath(target, event) {
    const path = [];
    while (true) {
      path.push(target);
      if (target.parentNode)
        target = target.parentNode;
      else if (target.host) {
        if (!event.composed)
          return path;
        target = target.host;
      } else {
        break;
      }
    }
    path.push(document, window);
    return path;
  }

  function callListenersOnElement(currentTarget, event, phase) {
    if (event._propagationStopped || event._propagationStoppedImmediately)
      return;
    if (phase === Event.BUBBLING_PHASE && (event.cancelBubble || !event.bubbles))
      return;
    if (event.cancelBubble)
      phase = Event.CAPTURING_PHASE;
    const listeners = currentTarget.getEventListeners(event.type, phase);
    Object.defineProperty(event, "currentTarget", {value: currentTarget, writable: true});
    for (let listener of listeners) {
      if (event._propagationStoppedImmediately)
        return;
      if (!currentTarget.hasEventListener(event.type, listener))
        continue;
      try {
        listener.cb(event);
      } catch (err) {
        const error = new ErrorEvent(
          'error',
          {error: err, message: 'Uncaught Error: event listener break down'}
        );
        dispatchEvent(window, error);
        if (!error.defaultPrevented)
          console.error(error);
      }
    }
  }

  function dispatchEvent(target, event) {
    const propagationPath = getComposedPath(target, event).slice(1);
    Object.defineProperty(event, "target", {
      get: function () {
        let lowest = target;
        for (let t of propagationPath) {
          if (t === this.currentTarget)
            return lowest;
          if (t instanceof DocumentFragment && t.mode === "closed")
            lowest = t.host || lowest;
        }
      }
    });
    Object.defineProperty(event, "stopPropagation", {
      value: function () {
        this._propagationStopped = true;
      }
    });
    Object.defineProperty(event, "stopImmediatePropagation", {
      value: function () {
        this._propagationStoppedImmediately = true;
      }
    });
    for (let currentTarget of propagationPath.slice().reverse())
      callListenersOnElement(currentTarget, event, Event.CAPTURING_PHASE);
    callListenersOnElement(target, event, Event.AT_TARGET);
    for (let currentTarget of propagationPath)
      callListenersOnElement(currentTarget, event, Event.BUBBLING_PHASE);
  }

</script>

<div id="outer">
  <h1 id="inner">Click on me!</h1>
</div>

<script>
  function log(e) {
    console.log(e.type + " on #" + e.currentTarget.id);
  }

  function error() {
    throw new Error("event listener break down");
  }

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");

  outer.addEventListener("click", error, true);
  inner.addEventListener("click", error);
  inner.addEventListener("click", log);
  outer.addEventListener("click", log);

  window.addEventListener("error", log);

  dispatchEvent(inner, new MouseEvent("click", {bubbles: true}));
</script>
```

## References

  * todo find this described in the spec.