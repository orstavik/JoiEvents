# WhatIs: `.stopPropagation()`?

`stopPropagation()` works very much the same as `bubbles: false`, except that it can be called on the event at any time during event propagation and that it will take effect from the next element in the event propagation path, regardless of which phase the event listener is in.

## Demo: native behavior

```html
<div id="outer">
  <h1 id="inner">Click on me!</h1>
</div>

<script>
  function log(e) {
    const phase = e.eventPhase === 1 ? "CAPTURE" : e.eventPhase === 2 ? "TARGET" : "BUBBLE";
    console.log(e.type + " on #" + e.currentTarget.tagName + " - " + phase);
  }

  function stopProp(e) {
    e.stopPropagation();
    console.log(e.type + ".stopPropagation();");
  }

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");

  outer.addEventListener("click", log, true);   //yes
  inner.addEventListener("click", stopProp);    //yes
  inner.addEventListener("click", log, true);   //yes, same current target as when stopPropagation() was called
  inner.addEventListener("click", log);         //yes, same current target as when stopPropagation() was called
  outer.addEventListener("click", log);         //no

  document.body.addEventListener("dblclick", stopProp, true); //yes
  outer.addEventListener("dblclick", log, true);              //no, stopPropagation() can block in all event phases.
  inner.addEventListener("dblclick", log);                    //no, stopPropagation() can block in all event phases.
  outer.addEventListener("dblclick", log);                    //no, stopPropagation() can block in all event phases.

  inner.dispatchEvent(new MouseEvent("click", {bubbles: true}));
  inner.dispatchEvent(new MouseEvent("dblclick", {bubbles: true}));
</script>
```

Result: 

```           
click on #DIV - CAPTURE
click.stopPropagation();
click on #H1 - TARGET
click on #H1 - TARGET
dblclick.stopPropagation();
```              

## Implementation

`.stopPropagation()` is a method on `Event` objects, and therefore it would be natural to associate a corresponding property on `Event` objects that declares whether this particular event has been stopped or not. This property can then be checked when the event propagation function tries to call event listeners on the next potential target in the propagation path.    

```javascript
function callListenersOnElement(currentTarget, event, phase) {
  if (event._propagationStopped)
    return;
  if (phase === Event.BUBBLING_PHASE && (event.cancelBubble || !event.bubbles))
    return;
  if (event.cancelBubble)
    phase = Event.CAPTURING_PHASE;
  const listeners = currentTarget.getEventListeners(event.type, phase);
  Object.defineProperty(event, "currentTarget", {value: currentTarget, writable: true});
  for (let listener of listeners)
    listener(event);
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
  for (let currentTarget of propagationPath.slice().reverse())
    callListenersOnElement(currentTarget, event, Event.CAPTURING_PHASE);
  callListenersOnElement(target, event, Event.AT_TARGET);
  for (let currentTarget of propagationPath)
    callListenersOnElement(currentTarget, event, Event.BUBBLING_PHASE);
}
```

## Demo: masquerade dispatchEvent function

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
    if (event._propagationStopped === true)
      return;
    if (phase === Event.BUBBLING_PHASE && (event.cancelBubble || !event.bubbles))
      return;
    if (event.cancelBubble)
      phase = Event.CAPTURING_PHASE;
    const listeners = currentTarget.getEventListeners(event.type, phase);
    Object.defineProperty(event, "currentTarget", {value: currentTarget, writable: true});
    for (let listener of listeners)
      listener(event);
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
    const phase = e.eventPhase === 1 ? "CAPTURE" : e.eventPhase === 2 ? "TARGET" : "BUBBLE";
    console.log(e.type + " on #" + e.currentTarget.tagName + " - " + phase);
  }

  function stopProp(e) {
    e.stopPropagation();
    console.log(e.type + ".stopPropagation();");
  }

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");

  outer.addEventListener("click", log, true);   //yes
  inner.addEventListener("click", stopProp);    //yes
  inner.addEventListener("click", log, true);   //yes, same current target as when stopPropagation() was called
  inner.addEventListener("click", log);         //yes, same current target as when stopPropagation() was called
  outer.addEventListener("click", log);         //no

  document.body.addEventListener("dblclick", stopProp, true); //yes
  outer.addEventListener("dblclick", log, true);              //no, stopPropagation() can block in all event phases.
  inner.addEventListener("dblclick", log);                    //no, stopPropagation() can block in all event phases.
  outer.addEventListener("dblclick", log);                    //no, stopPropagation() can block in all event phases.

  inner.dispatchEvent(new MouseEvent("click", {bubbles: true}));
  inner.dispatchEvent(new MouseEvent("dblclick", {bubbles: true}));
</script>
``` 

## bubbles vs stopPropagation

1. `stopPropagation()` and `bubbles = false` is *not* the same.
   * `stopPropagation()` prevents the event propagation from going to the *next element* in the event's propagation path in *all phases*.
   * `bubbles = false` also prevents the event propagation from going to the *next element* in the event's propagation path, but *only within the last bubbling phase*.
   
2. Both `stopPropagation()` and `bubbles = false` allows the event propagation to finish calling all event listeners added to the current element before stopping.  

## References

  * todo find this described in the spec.