# WhatIs: `.stopImmediatePropagation()`?

`stopImmediatePropagation()` is the same as `stopPropagation()`, except that it also blocks subsequent event listeners added to the same target element.

 * `stopPropagation()` *allows* the event propagation function to finish calling all event listeners added to the current element before stopping.  
 * `stopImmediatePropagation()` *prevents* the event propagation function to call any other event listeners, including later event listeners added to the current element being processed.  

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

  function stopImmediately(e) {
    e.stopImmediatePropagation();
    console.log(e.type + ".stopImmediatePropagation();");
  }

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");

  outer.addEventListener("click", log, true);            //yes
  inner.addEventListener("click", stopImmediately, true);//yes
  inner.addEventListener("click", log, true);            //no
  inner.addEventListener("click", log);                  //no
  outer.addEventListener("click", log);                  //no

  inner.dispatchEvent(new MouseEvent("click", {bubbles: true}));
</script>
```

Result: 

```           
click on #DIV - CAPTURE
click.stopImmediatePropagation();
```              

## Implementation

`.stopImmediatePropagation()` is a method on the `Event` prototype. We therefore here associate a corresponding property on `Event` objects that declares whether this particular event has been stopped immediately. This very much resemble what `cancelBubble` does for `stopPropagation()`. However, this property must be checked for each new event listener retrieved, not just for each new element in the propagation path.

```javascript
function callListenersOnElement(currentTarget, event, phase) {
    if (event.cancelBubble || event._propagationStoppedImmediately || (phase === Event.BUBBLING_PHASE && !event.bubbles))
      return;
  const listeners = currentTarget.getEventListeners(event.type, phase);
  Object.defineProperty(event, "currentTarget", {value: currentTarget, writable: true});
  for (let listener of listeners){
    if (event._propagationStoppedImmediately)
      return;
    if (currentTarget.hasEventListener(event.type, listener))
      listener.cb(event);
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

## References

  * todo find this described in the spec.