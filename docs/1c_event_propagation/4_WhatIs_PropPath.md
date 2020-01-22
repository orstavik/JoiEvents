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

No. Any change to the DOM during the course of event propagation will *not!!* affect *which elements* event listeners are called on during event propagation.

## Demo: 

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

## References

  * todo find this described in the spec.