# WhatIs: `target` and `currentTarget`?

The `target` is the node in the DOM at which the whole event is directed. 
The `currentTarget` is the node on which the event listener is attached.

## Demo: a changing `currentTarget` 

In the demo below we see how the `target` remains the same and how the `currentTarget` changes for both event listeners.
```html
<div id="outer">
  <h1 id="inner">Click me!</h1>
</div>

<script>
  function log(e) {
    console.log(e.type, e.currentTarget.id, e.target.id);
  }

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");

  inner.addEventListener("click", log);
  outer.addEventListener("click", log);

  inner.dispatchEvent(new MouseEvent("click", {bubbles: true}));
</script>
```

Results:

```
click, #inner, #inner
click, #inner, #outer
```

Setting the `target` is done *once* at *the beginning* of each event propagation. Setting the `currentTarget` is done every time the event propagation function calls event listeners on a new node in the event propagation path.

## Demo: Setting `target` and `currentTarget`

To set the `target` and `currentTarget` property on the event we need to use `Object.defineProperty(...)`.

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
    Object.defineProperty(event, "currentTarget", {value: currentTarget, writable: true});
    for (let listener of listeners)
      listener(event);
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
    console.log(e.type, e.currentTarget.id, e.target.id);
  }

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");

  inner.addEventListener("click", log);
  outer.addEventListener("click", log);

  dispatchEvent(inner, new MouseEvent("click", {bubbles: true}));
</script>
```

You might already have detected that we added the currentTarget in the previous chapter.

## References

  * todo find this described in the spec.