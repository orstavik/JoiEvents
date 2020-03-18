# WhatIs: the propagation path?

As we saw in the first chapter, the path of propagation is a round trip from the window to the target and back to the window. Thus, if we follow the ancestor chain of the element, then we can quickly build a view of the propagation path from top to bottom.

But. What happens if we *alter* the DOM during one event listener so as to *alter* the location of an element in the propagation chain? For example if we move the target element, or remove another element in the propagation path, before its event listeners are called?

## Demo: Does DOM mutations affect propagation path? 
```html
<div id="outer">
  <div id="middle">
    <h1 id="inner">Click on me!</h1>
  </div>
</div>

<script>
  function log(e) {
    console.log(e.type + " on #" + e.currentTarget.id);
  }

  const inner = document.querySelector("#inner");
  const middle = document.querySelector("#middle");
  const outer = document.querySelector("#outer");

  outer.addEventListener("click", function(){
    outer.appendChild(inner);
    middle.remove();
    console.log(middle.isConnected);
  }, true);

  middle.addEventListener("click", function(){
    document.body.appendChild(inner);
  }, true);

  outer.addEventListener("click", log, true);
  middle.addEventListener("click", log, true);
  inner.addEventListener("click", log, true);

  inner.dispatchEvent(new MouseEvent("click", {bubbles: true}));
</script>
```  

No. Any change to the DOM during the course of event propagation will *not!!* affect *which elements* event listeners are called on during event propagation. The event propagation path is **static** from the outset of the event and onwards.

## Implementation: 

```javascript
function dispatchEvent(target, event) {
  const propagationPath = getPath(target).slice(1);
  //Both the target and propagationPath is locked at the outset.
  //No changes of the DOM during event propagation will affect which element the event propagates to next. 
  for (let currentTarget of propagationPath.slice().reverse())
    callListenersOnElement(currentTarget, event, Event.CAPTURING_PHASE);
  callListenersOnElement(target, event, Event.AT_TARGET);
  for (let currentTarget of propagationPath)
    callListenersOnElement(currentTarget, event, Event.BUBBLING_PHASE);
}
```              

## Demo

```html
<script src="hasGetEventListeners.js"></script>
<script>
  function getPath(target) {
    const path = [];
    while (target.parentNode !== null) {
      path.push(target);
      target = target.parentNode;
    }
    path.push(document, window);
    return path;
  }

  function callListenersOnElement(currentTarget, event, phase) {
    const listeners = currentTarget.getEventListeners(event.type, phase);
    if (!listeners)
      return;
    Object.defineProperty(event, "currentTarget", {value: currentTarget, writable: true});
    for (let listener of listeners)
      listener.listener(event);
  }

  function dispatchEvent(target, event) {
    Object.defineProperty(event, "target", {value: target});
    const propagationPath = getPath(target).slice(1);
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

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");

  //two log functions will be added, as the second log is a different function object
  inner.addEventListener("click", log);
  inner.addEventListener("click", log);
  inner.addEventListener("click", log.bind({}));  //log.bind({}) creates a new function object instance

  //only one log will be added,
  //the only option the addEventListener distinguishes is the boolean capture equivalent
  outer.addEventListener("click", log);
  outer.addEventListener("click", log, false);
  outer.addEventListener("click", log, {capture: false});
  outer.addEventListener("click", log, {capture: false, passive: false});

  //only one log on outer capture phase will be added
  outer.addEventListener("click", log, true);
  outer.addEventListener("click", log, {capture: true});
  //but then this log function is removed too, even though the options don't match on
  //other properties than capture
  outer.removeEventListener("click", log, {capture: true, passive: true});

  dispatchEvent(inner, new MouseEvent("click", {bubbles: true}));
  // dispatchEventSync(inner, (new MouseEvent("click", {bubbles: true}));
  // dispatchEventAsync(inner, (new MouseEvent("click", {bubbles: true}));
</script>
```

## References

  * todo find this described in the spec.