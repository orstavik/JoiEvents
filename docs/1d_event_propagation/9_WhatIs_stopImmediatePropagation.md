# WhatIs: `.stopImmediatePropagation()`?

`stopImmediatePropagation()` is the same as `stopPropagation()`, except that it also blocks subsequent event listeners added to the same target element.

 * `stopPropagation()` *allows* the event propagation function to finish calling all event listeners added to the current element before stopping.  
 * `stopImmediatePropagation()` *prevents* the event propagation function to call any other event listeners, including later event listeners added to the current element being processed.  

## Demo: native behavior

```html
<h1>Click on me!</h1>

<script>
  function log(e) {
    console.log(e.type + " on #" + e.currentTarget.tagName);
  }

  function stopImmediately(e) {
    e.stopImmediatePropagation();
    console.log(e.type + ".stopImmediatePropagation();");
  }

  const h1 = document.querySelector("h1");

  document.body.addEventListener("click", log, true);    //yes
  h1.addEventListener("click", log);                  //yes
  h1.addEventListener("click", stopImmediately);      //yes
  h1.addEventListener("click", log.bind({}));         //no
  document.body.addEventListener("click", log);          //no

  h1.dispatchEvent(new MouseEvent("click", {bubbles: true}));
</script>
```

Result: 

```           
click on #BODY
click on #H1
click.stopImmediatePropagation();
```              

## Implementation

`.stopImmediatePropagation()` is a method on the `Event` prototype. We therefore here associate a corresponding property on `Event` objects that declares whether this particular event has been stopped immediately. This very much resemble what `cancelBubble` does for `stopPropagation()`. However, this property must be checked for each new event listener retrieved, not just for each new element in the propagation path.

```javascript
function callListenersOnElement(currentTarget, event, phase) {
  if (event.cancelBubble || event._propagationStoppedImmediately || (phase === Event.BUBBLING_PHASE && !event.bubbles))
    return;
  const listeners = currentTarget.getEventListeners(event.type, phase);
  if (!listeners)
    return;
  Object.defineProperty(event, "currentTarget", {value: currentTarget, writable: true});
  for (let listener of listeners){
    if (event._propagationStoppedImmediately)
      return;
    if (currentTarget.hasEventListener(event.type, listener.listener, listener.capture))
      listener.listener(event);
  }
}

function dispatchEvent(target, event) {
  const propagationPath = getComposedPath(target, event.composed).slice(1);
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
<script src="hasGetEventListeners.js"></script>
<script>
  function getComposedPath(target, composed) {
    const path = [];
    while (true) {
      path.push(target);
      if (target.parentNode) {
        target = target.parentNode;
      } else if (target.host) {
        if (!composed)
          return path;
        target = target.host;
      } else if (target.defaultView) {
        target = target.defaultView;
      } else {
        break;
      }
    }
    return path;
  }

  function callListenersOnElement(currentTarget, event, phase) {
    if (event.cancelBubble || event._propagationStoppedImmediately || (phase === Event.BUBBLING_PHASE && !event.bubbles))
      return;
    const listeners = currentTarget.getEventListeners(event.type, phase);
    if (!listeners)
      return;
    Object.defineProperty(event, "currentTarget", {value: currentTarget, writable: true});
    for (let listener of listeners){
      if (event._propagationStoppedImmediately)
        return;
      if (currentTarget.hasEventListener(event.type, listener.listener, listener.capture))
        listener.listener(event);
    }
  }

  function dispatchEvent(target, event) {
    const propagationPath = getComposedPath(target, event.composed).slice(1);
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

</script>

<h1>Click on me!</h1>

<script>
  function log(e) {
    console.log(e.type + " on #" + e.currentTarget.tagName);
  }

  function stopImmediately(e) {
    e.stopImmediatePropagation();
    console.log(e.type + ".stopImmediatePropagation();");
  }

  const h1 = document.querySelector("h1");

  document.body.addEventListener("click", log, true);    //yes
  h1.addEventListener("click", log);                  //yes
  h1.addEventListener("click", stopImmediately);      //yes
  h1.addEventListener("click", log.bind({}));         //no
  document.body.addEventListener("click", log);          //no

  h1.dispatchEvent(new MouseEvent("click", {bubbles: true}));
</script>
```

## References

  * todo find this described in the spec.