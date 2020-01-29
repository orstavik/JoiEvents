# WhatIs: `.stopPropagation()`?

`stopPropagation()` works very much the same as `bubbles: false`, except that it can be called on the event at any time during event propagation and that it will take effect from the next element in the event propagation path, regardless of which phase the event listener is in.

But! `stopPropagation()` works exactly like `cancelBubble = false`. `cancelBubble` is a legacy property from the good old Internet Explorer days, and in the aftermath of the browser war when the event propagation algorithms of Netscape Navigator (cf. capture) and Internet Explorer (cf. bubble) was merged, it was decided that `cancelBubble` should simply echo the new `stopPropagation()` method. Therefore:
 * When you call `stopPropagation()`, then `cancelBubble` becomes `true`.
 * To set `cancelBubble = false` is the same as calling `stopPropagation()`. 
 
If propagation first is stopped, it is irreversible. There is no `resumePropagation()` nor `cancelBubble = false`.    

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
    console.log(e.type + ".stopPropagation(); cancelBubble = " + e.cancelBubble);
  }

  function cancelBubble(e) {
    e.cancelBubble = true;
    console.log(e.type + ".cancelBubble; cancelBubble = " + e.cancelBubble);
  }

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");

  outer.addEventListener("mouseup", log, true);   //yes
  inner.addEventListener("mouseup", cancelBubble);//yes
  inner.addEventListener("mouseup", log, true);//yes, same target as when stopPropagation() was called
  inner.addEventListener("mouseup", log);      //yes, same target as when stopPropagation() was called
  outer.addEventListener("mouseup", log);      //no

  outer.addEventListener("click", log, true);//yes
  inner.addEventListener("click", stopProp); //yes
  inner.addEventListener("click", log, true);//yes, same current target as when stopPropagation() was called
  inner.addEventListener("click", log);      //yes, same current target as when stopPropagation() was called
  outer.addEventListener("click", log);      //no

  document.body.addEventListener("dblclick", stopProp, true); //yes
  outer.addEventListener("dblclick", log, true); //no, stopPropagation() can block in all event phases.
  inner.addEventListener("dblclick", log);       //no, stopPropagation() can block in all event phases.
  outer.addEventListener("dblclick", log);       //no, stopPropagation() can block in all event phases.

  inner.dispatchEvent(new MouseEvent("mouseup", {bubbles: true}));
  inner.dispatchEvent(new MouseEvent("click", {bubbles: true}));
  inner.dispatchEvent(new MouseEvent("dblclick", {bubbles: true}));
</script>
```

Result: 

```           
mouseup on #DIV - CAPTURE
mouseup.cancelBubble; cancelBubble = true
mouseup on #H1 - TARGET
mouseup on #H1 - TARGET
click on #DIV - CAPTURE
click.stopPropagation(); cancelBubble = true
click on #H1 - TARGET
click on #H1 - TARGET
dblclick.stopPropagation(); cancelBubble = true```              
```

## Implementation

We check the `cancelBubbles` property on the event when the event propagation function tries to trigger event listeners on the next potential target in the propagation path.    

```javascript
function callListenersOnElement(currentTarget, event, phase) {
  if (event.cancelBubble || (phase === Event.BUBBLING_PHASE && !event.bubbles))
    return;
  //...
}
```

## Demo: masquerade dispatchEvent function

```html
<script src="hasGetEventListeners.js"></script>
<script>
  function getComposedPath(target, event) {
    const path = [];
    while (true) {
      path.push(target);
      if (target.parentNode) {
        target = target.parentNode;
      } else if (target.host) {
        if (!event.composed)
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
    if (event.cancelBubble || (phase === Event.BUBBLING_PHASE && !event.bubbles))
      return;
    const listeners = currentTarget.getEventListeners(event.type, phase);
    if (!listeners)
      return;
    Object.defineProperty(event, "currentTarget", {value: currentTarget, writable: true});
    for (let listener of listeners)
      if (currentTarget.hasEventListener(event.type, listener.listener, listener.capture))
        listener.listener(event);
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
    console.log(e.type + ".stopPropagation(); cancelBubble = " + e.cancelBubble);
  }

  function cancelBubble(e) {
    e.cancelBubble = true;
    console.log(e.type + ".cancelBubble; cancelBubble = " + e.cancelBubble);
  }

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");

  outer.addEventListener("mouseup", log, true);   //yes
  inner.addEventListener("mouseup", cancelBubble);//yes
  inner.addEventListener("mouseup", log, true);//yes, same target as when stopPropagation() was called
  inner.addEventListener("mouseup", log);      //yes, same target as when stopPropagation() was called
  outer.addEventListener("mouseup", log);      //no

  outer.addEventListener("click", log, true);//yes
  inner.addEventListener("click", stopProp); //yes
  inner.addEventListener("click", log, true);//yes, same current target as when stopPropagation() was called
  inner.addEventListener("click", log);      //yes, same current target as when stopPropagation() was called
  outer.addEventListener("click", log);      //no

  document.body.addEventListener("dblclick", stopProp, true); //yes
  outer.addEventListener("dblclick", log, true); //no, stopPropagation() can block in all event phases.
  inner.addEventListener("dblclick", log);       //no, stopPropagation() can block in all event phases.
  outer.addEventListener("dblclick", log);       //no, stopPropagation() can block in all event phases.

  dispatchEvent(inner, new MouseEvent("mouseup", {bubbles: true}));
  dispatchEvent(inner, new MouseEvent("click", {bubbles: true}));
  dispatchEvent(inner, new MouseEvent("dblclick", {bubbles: true}));
</script>
``` 

## bubbles vs stopPropagation

1. `stopPropagation()` and `bubbles = false` is *not* the same.
   * `stopPropagation()` prevents the event propagation from going to the *next element* in the event's propagation path in *all phases*.
   * `bubbles = false` also prevents the event propagation from going to the *next element* in the event's propagation path, but *only within the last bubbling phase*.
   
2. Both `stopPropagation()` and `bubbles = false` allows the event propagation to finish calling all event listeners added to the current element before stopping.  

## References

  * todo find this described in the spec.