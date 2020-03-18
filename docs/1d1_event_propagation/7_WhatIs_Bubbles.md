# WhatIs: bubbles?

The bubbling phase is the name given for the propagation phase going from the target and up to either the `window` or `shadowRoot`.

When events are created, they can have the property `bubbles` set to `true` or `false` (`false` is the default value). It is easy to forget about the capture phase and think of non-bubbling events as "target only events". But that is not true. Non-bubbling events also propagates down the propagation path in the capture phase. (To control propagation across all event phases, use `stopPropagation()` and `stopImmediatePropagation()`.)

> Non-bubbling = capture + target phase!! 

Non-bubbling events operate exactly like normal, bubbling events that has an event listener on its innermost target element that either calls `.stopPropagation()` or sets `cancelBubbles = true`. 

## Demo: native behavior

```html
<div id="outer">
  <h1 id="inner">Click on me!</h1>
</div>

<script>
  function log(e) {
    const phase = e.eventPhase === 1 ? "CAPTURE" : e.eventPhase === 2 ? "TARGET" : "BUBBLE";
    console.log(e.type + " bubbles = " + e.bubbles + " on #" + e.currentTarget.tagName + " - " + phase);
  }

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");

  outer.addEventListener("click", log, true);     //yes, capture phase is run when bubbles: false
  inner.addEventListener("click", log, true);     //yes
  inner.addEventListener("click", log);           //yes, at_target phase
  outer.addEventListener("click", log);           //no, bubbles: false

  inner.dispatchEvent(new MouseEvent("click", {bubbles: false}));
</script>
```

```
click bubbles = false on #DIV - CAPTURE
click bubbles = false on #H1 - TARGET
click bubbles = false on #H1 - TARGET
```              

## Implementation

To check for bubbling, we need to add a check when we call listeners on a new element in the propagation path:
1. If the phase is bubbling and the event is non-bubbling (`bubbles = false`), we do not call any event listeners on the target.

```javascript
function callListenersOnElement(currentTarget, event, phase) {
  if (phase === Event.BUBBLING_PHASE && !event.bubbles)
    return;
  //...

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
    if (phase === Event.BUBBLING_PHASE && !event.bubbles)
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
    console.log(e.type + " bubbles = " + e.bubbles + " on #" + e.currentTarget.tagName + " - " + phase);
  }

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");

  outer.addEventListener("click", log, true);     //yes, capture phase is run when bubbles: false
  inner.addEventListener("click", log, true);     //yes
  inner.addEventListener("click", log);           //yes, at_target phase
  outer.addEventListener("click", log);           //no, bubbles: false

  dispatchEvent(inner, new MouseEvent("click", {bubbles: false}));
</script>
```

## Discussion: why non-bubbling events?

When you make your own custom events, set **`bubble: true`** by default. The real question is: would you ever make a non-bubbling event, and if so, why?

1. You would not make a custom event `bubble: false` for performance reasons. For non-bubbling events, the browser still needs to compute a list of event listeners for both the capture and target phases. Thus, no underlying computation is really avoided by listing functions from only two, instead of three propagation phases.

2. If the custom event always targets the `window`, the custom event will only be in the `AT_TARGET` phase. Here, it doesn't matter if `bubble` is `true` or `false` or `Schrodinger's cat`. 

3. Two facts:
   * To check if the `eventListener` is added to the `target` element, you can choose from two simple checks: `event.currentTarget === event.target` or `event.phase === 2`. 
   * To listen for an event that does not bubble, you either need to know its non-bubbling target (in the target phase) or step into the capture phase that in a sense bypasses the non-bubbling property.
   
   This means that you can make all eventListeners `non-bubbly` by either adding `if(event.phase > 2) return;` to them, and/or by adding `if(event.phase === 2) event.stopPropagation();` to the event listener added to the `target`. 

In my opinion, there rarely would be any benefit of using `bubble: false` in a customEvent. Some use-cases for your custom event might benefit from bubbling, and to make it more reusable, it should likely `bubble: true`. From my current position, I do not see any use-case for reusable custom events where the benefits of `bubble: false` would likely outweigh the benefits of `bubble: true`.

## Examples of native non-bubbling events are:

1. Resource life-cycle events: `load`, `error`, `abort`, `beforeunload`, `unload`.
2. Legacy UI events: `focus`/`blur`, `mouseenter`/`mouseleave`. These non-bubbling event pairs has been given a bubbling cousin pair: `focusin`/`focusout` and `mouseover`/`mouseout`.
3. Legacy DOM mutation events: `DOMNodeRemovedFromDocument`/`DOMNodeInsertedIntoDocument`. These DOM mutation events have been replaced by `MutationObserver`.
4. The `resize`, `online`, `offline` events.
5. The `toggle` event.

## old? do we need this any more?

<code-demo src="demo/NonBubblingEventsDoStillCapture.html"></code-demo>

## References

  * todo find this described in the spec.