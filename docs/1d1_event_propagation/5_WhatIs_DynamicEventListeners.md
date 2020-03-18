# WhatIs: dynamic event listeners

Questions:

1. If an element does not have any event listener for the current event when the event begins propagation, will that element still be included in the propagation path? Ie. will dynamically adding an event listener to that element be included or excluded from the current event propagation?
2. Will event listeners dynamically added to the current target in the same phase be executed during the ongoing event propagation cycle?
3. Can an event listener positioned to an *element* early in the propagation path dynamically remove an event listener added to *another element* later in the propagation path?
4. Will event listeners dynamically removed from the current target in the same phase be executed during the ongoing event propagation cycle?

As these questions contains some inconsistencies, we give the answers up front:

1. Yes. The element is included in the propagation path, and the event listener will potentially run if the propagation cycle has not yet gotten to that element in that phase.
2. No. Once the event propagation has begun running on an element, the list of event listeners to be executed is fixed. 

       todo check if this is true for async execution too.

3. Yes. If an event listener removes another event listener registered on another element (or on the same element, but scheduled to be run in a different propagation phase), then that event listener will not run.
4. Yes. And hence the behavior of `addEventListener()` and `removeEventListener()` differs on this point (2 = yes / 4 = no)! If you:
   1. remove an event listener that
   2. was scheduled to run during the ongoing event propagation then 
   3. the removed event listener will *not* run if it has not run already,
   4. even if you remove that event listener on the current target of event propagation and in the current phase.
   5. This is not true for adding event listeners.
   6. Event listeners added to the current target of event propagation and in the current phase of event propagation will not run during the ongoing event propagation cycle. 

## Demo: native behavior 

```html
<div id="a">
  <div id="b">
    <h1 id="c">Click on me!</h1>
  </div>
</div>

<script>
  function log(e) {
    console.log(e.type + " on #" + e.currentTarget.id);
  } 
  function log2(e) {
    console.log("log2: " + e.type + " on #" + e.currentTarget.id);
  } 
  function logDynamic(e) {
    console.log("logDynamic: " + e.type + " on #" + e.currentTarget.id);
  }                         

  const a = document.querySelector("#a");
  const b = document.querySelector("#b");
  const c = document.querySelector("#c");
  
  a.addEventListener("click", log);
  c.addEventListener("click", log);
  //1: adding an event listener to an element in the propagation path, 
  //   but that has no other event listener for this event type. 
  c.addEventListener("click", function(){
    b.addEventListener("click", logDynamic);
  });
  //2: adding an event listener to the current target in the propagation path i the same phase
  c.addEventListener("click", function(){
    c.addEventListener("click", logDynamic, true);  
    c.addEventListener("click", logDynamic);  
    //AT_TARGET phase doesn't distinguish between capture and bubble phase, none is run in the first pass
  });
  //3: removing an event listener from another element in the propagation path that has not yet run.
  c.addEventListener("click", function(){
    a.removeEventListener("click", log);  
  });
  //3: removing an event listener from the current target that has not yet run
  c.addEventListener("click", function(){
    c.removeEventListener("click", log2);  
  });
  c.addEventListener("click", log2);

  c.dispatchEvent(new MouseEvent("click", {bubbles: true}));
</script>
```   

Results:

```
click on #c
logDynamic: click on #b
```

This confirms our answers above:
1. `removeEventListener()` always works on event listeners not yet run, both on other elements and on the current target element.
2. `addEventListener()` works on other elements, even if they do not have any other event listeners added. But, `addEventListener()` does not work in the ongoing event propagation cycle when they are added on the current target in the same phase. 

## Implementation

There is an inconsistency:
 * As `addEventListener()` DOES NOT add event listeners to the current element in the current phase in the ongoing event propagation cycle, then the list of event listeners for the current target element in the current event phase should be FROZEN at the beginning of iterating over event listeners for an element in each phase*. 
 
   vs.
 
 * As `removeEventListener()` DO remove event listeners to the current element in the current phase in the ongoing event propagation cycle, then the list of event listeners for the current target element in the current event phase should be DYNAMIC during the iteration over event listeners for an element in each phase.
 
To solve this conundrum, we opt to:
1. *freeze* the list of event listeners at the beginning of the iteration of event listeners for the current target in the current phase, but
2. *check* that each event listener has not been removed (by an earlier event listener on the same target) before executing it.  

This require us to do two changes to our masquerade `dispatchEvent` function:

1. We need to check if the event listener is still added to the current target before we run it using a  `.hasEventListener(type, listener)` function, and
2. Instead of only retrieving the callback function from the `EventTarget`, we pass the complete listener registry object with that wraps the callback and options. 

```javascript
function callListenersOnElement(currentTarget, event, phase) {
  const listeners = currentTarget.getEventListeners(event.type, phase);
  if (!listeners)
    return;
  Object.defineProperty(event, "currentTarget", {value: currentTarget, writable: true});
  for (let listener of listeners)
    if (currentTarget.hasEventListener(event.type, listener.listener, listener.options))
      listener.listener(event);
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
      if (currentTarget.hasEventListener(event.type, listener.listener, listener.options))
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

<div id="a">
  <div id="b">
    <h1 id="c">Click on me!</h1>
  </div>
</div>

<script>
  function log(e) {
    console.log(e.type + " on #" + e.currentTarget.id);
  }
  function log2(e) {
    console.log("log2: " + e.type + " on #" + e.currentTarget.id);
  }
  function logDynamic(e) {
    console.log("logDynamic: " + e.type + " on #" + e.currentTarget.id);
  }

  const a = document.querySelector("#a");
  const b = document.querySelector("#b");
  const c = document.querySelector("#c");

  a.addEventListener("click", log);
  c.addEventListener("click", log);
  //1: adding an event listener to an element in the propagation path,
  //   but that has no other event listener for this event type.
  c.addEventListener("click", function(){
    b.addEventListener("click", logDynamic);
  });
  //2: adding an event listener to the current target in the propagation path i the same phase
  c.addEventListener("click", function(){
    c.addEventListener("click", logDynamic, true);
    //AT_TARGET phase doesn't distinguish between capture and bubble phase
  });
  //3: removing an event listener to another element in the propagation path that has not yet run.
  c.addEventListener("click", function(){
    a.removeEventListener("click", log);
  });
  //3: removing an event listener from the current target that has not yet run
  c.addEventListener("click", function(){
    c.removeEventListener("click", log2);
  });
  c.addEventListener("click", log2);

  dispatchEvent(c, new MouseEvent("click", {bubbles: true}));
</script>
```

## References

  * todo find this described in the spec.