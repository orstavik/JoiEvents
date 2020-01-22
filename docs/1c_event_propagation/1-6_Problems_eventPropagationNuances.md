## Problem 0: Does non-bubbling events trickle down in the capture phase?

```html
<div id="outer">
  <h1 id="inner">Click on me!</h1>
</div>
 
<script>
  function log(e) {
    const phase = e.eventPhase === 1 ? "capture" :
      e.eventPhase === 2 ? "target" : "bubble";
    console.log(e.type + " on #" + e.currentTarget.id + " in phase: " + phase);
  }
  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");
  outer.addEventListener("click", log, true);
  inner.addEventListener("click", log);
  outer.addEventListener("click", log);
  inner.dispatchEvent(new MouseEvent("click", {bubbles: false}));
  // dispatchEventSync(inner, new MouseEvent("click", {bubbles: true}));
  // dispatchEventAsync(inner, new MouseEvent("click", {bubbles: true}));
</script>
```     

Results:

```
click on #outer in phase: capture
click on #inner in phase: target
```

Yes, capture phase event listeners will still be called on parent elements/document/window for non-bubbling events. 

## Problem 1: Can an early event listener remove a later event listener?

```html
<div id="outer">
  <h1 id="inner">Click on me!</h1>
</div>

<script>
  function log(e) {
    console.log(e.type + " on #" + e.currentTarget.id);
  }                         

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");
  
  inner.addEventListener("click", log);
  inner.addEventListener("click", function(){
    outer.removeEventListener("click", log);
  });
  outer.addEventListener("click", log);

  inner.dispatchEvent(new MouseEvent("click", {bubbles: true}));
  // dispatchEventSync(inner, new MouseEvent("click", {bubbles: true}));
  // dispatchEventAsync(inner, new MouseEvent("click", {bubbles: true}));
</script>
```   

Yes, an event listener can remove other event listeners later in the propagation order.

## Problem 2: Can an event listener alter the composed path for event propagation?

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

  outer.addEventListener("click", log, true);
  middle.addEventListener("click", log, true);
  inner.addEventListener("click", log, true);

//  inner.dispatchEvent(new MouseEvent("click", {bubbles: true}));
//  dispatchEventSync(inner, new MouseEvent("click", {bubbles: true}));
//  dispatchEventAsync(inner, new MouseEvent("click", {bubbles: true}));
</script>
```  

No, any change to the DOM during the course of event propagation will *not!!* affect on which elements event listeners are called for the current event (the "composed path" for the current event propagation). 

## Problem 3: Dynamically altering event listeners

Looking at the two previous problems, there are two questions:
 1. If an element does not have an event listener when the event starts, will that element be included or excluded from the event propagation and its the composed path set up at the event propagation's outset?
 2. Can I add more event listeners dynamically to the element currently running its event listeners?
 3. Can I remove more event listeners dynamically from the current element?

```html
<div id="outer">
  <h1 id="inner">Click on me!</h1>
</div>

<script>
  function log(e) {
    console.log(e.type + " on #" + e.currentTarget.id);
  }                         
  function log2() {
    console.log("log2");
  }                         

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");
  
  inner.addEventListener("click", function(){
    inner.removeEventListener("click", log2);
    inner.addEventListener("click", log);
    outer.addEventListener("click", log);
  });
  inner.addEventListener("click", log2);

  inner.dispatchEvent(new MouseEvent("click", {bubbles: true}));
  // dispatchEventSync(inner, (new MouseEvent("click", {bubbles: true}));
  // dispatchEventAsync(inner, (new MouseEvent("click", {bubbles: true}));
</script>
```

Results:

```
click on #outer
```

The answers are:
1. yes, the composed path for event propagation is not excluding any elements that do not have an event listener added at the outset.
2. no, once the event dispatching functions has started to run event listeners, it will not accept new event listeners for the current element.
3. But. The event dispatching function will still let you delete such event listeners. So yes, you can remove event listeners dynamically from the current element being processed by the event dispatch propagation function.

## Problem 4: Errors in event listeners

What happens when an error occurs during the execution of an event listener function? Does that affect the running of later event listeners?

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

  inner.dispatchEvent(new MouseEvent("click", {bubbles: true}));
  // dispatchEventSync(inner, (new MouseEvent("click", {bubbles: true}));
  // dispatchEventAsync(inner, (new MouseEvent("click", {bubbles: true}));
</script>
```

Results:

```
2x Error: event listener break down
click on #inner
click on #outer
```

As we can see, a break down in one event listener doesn't affect the running of later event listeners in the propagation chain, not even when the breakdown occur in an event listener on the same element.

## Problem 5: Adding the same event listener twice on the same element?

What happens if we add the same event listener twice on the same element?

```html
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
  inner.addEventListener("click", log.bind(null));

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

  inner.dispatchEvent(new MouseEvent("click", {bubbles: true}));
  // dispatchEventSync(inner, (new MouseEvent("click", {bubbles: true}));
  // dispatchEventAsync(inner, (new MouseEvent("click", {bubbles: true}));
</script>
```

Results:

```
click on #inner
click on #inner
click on #outer
```

The test above shows that `addEventListener(...)` and `removeEventListener(...)` :
1. compares the event listener functions as objects. Thus two logs are added to `#inner`.
2. converts the `options` argument into a boolean value corresponding only to the options `capture` value. When checking if an event listener function can be added/removed from an element, the browser only compares the event listener function object and the options capture property.     

## Problem 6: stopPropagation and .bubbles = false?

What is `stopPropagation()`? Is `stopPropagation()` and `bubble = false` doing exactly the same?

```html
<div id="outer">
  <h1 id="inner">Click and dblclick on me!</h1>
</div>

<script>
  function log(e) {
    console.log(e.type + " on #" + e.currentTarget.id);
  }                         

  function bubblesFalse(e) {
    e.bubbles = false;
  }                         

  function stopProp(e) {
    e.stopPropagation();
  }                         

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");
  
  outer.addEventListener("click", bubblesFalse, true);
  outer.addEventListener("click", log, true);
  inner.addEventListener("click", log);
  outer.addEventListener("click", log);

  outer.addEventListener("dblclick", stopProp, true);
  outer.addEventListener("dblclick", log, true);
  inner.addEventListener("dblclick", log);
  outer.addEventListener("dblclick", log);

  inner.dispatchEvent(new MouseEvent("click", {bubbles: true}));
  inner.dispatchEvent(new MouseEvent("dblclick", {bubbles: true}));
  // dispatchEventSync(inner, (new MouseEvent("click", {bubbles: true}));
  // dispatchEventAsync(inner, (new MouseEvent("click", {bubbles: true}));
</script>
```

Results:

```
click on #outer
click on #inner
dblclick on #outer
```

1. `stopPropagation()` and `bubbles = false` is *not* the same.
   * `stopPropagation()` prevents the event propagation from going to the *next element* in the event's propagation path in *all phases*.
   * `bubbles = false` also prevents the event propagation from going to the *next element* in the event's propagation path, but *only within the last bubbling phase*.
   
2. Both `stopPropagation()` and `bubbles = false` allows the event propagation to finish calling all event listeners added to the current element before stopping.  


## Problem 7: How is `stopPropagationImmediate()` different from `stopPropagation()`?

How is `stopPropagationImmediate()` different from `stopPropagation()`?

```html
<div id="outer">
  <h1 id="inner">Click and dblclick on me!</h1>
</div>

<script>
  function log(e) {
    console.log(e.type + " on #" + e.currentTarget.id);
  }                         

  function stopProp(e) {
    e.stopPropagation();
  }                         

  function stopImmediate(e) {
    e.stopImmediatePropagation();
  }                         

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");
  
  outer.addEventListener("click", log, true);
  inner.addEventListener("click", stopProp);
  inner.addEventListener("click", log);
  outer.addEventListener("click", log);

  outer.addEventListener("dblclick", log, true);
  inner.addEventListener("dblclick", stopImmediate);
  inner.addEventListener("dblclick", log);
  outer.addEventListener("dblclick", log);

  inner.dispatchEvent(new MouseEvent("click", {bubbles: true}));
  inner.dispatchEvent(new MouseEvent("dblclick", {bubbles: true}));
  // dispatchEventSync(inner, (new MouseEvent("click", {bubbles: true}));
  // dispatchEventAsync(inner, (new MouseEvent("click", {bubbles: true}));
</script>
```

Results:

```
click on #outer
click on #inner
dblclick on #outer
```

 * `stopPropagation()` *allows* the event propagation function to finish calling all event listeners added to the current element before stopping.  
 * `stopImmediatePropagation()` *prevents* the event propagation function to call any other event listeners, including later event listeners added to the current element being processed.  

## Conclusion

The function that drives event propagation freezes the composed path at the outset, but the act of adding and removing event listeners are dynamic will affect the execution of event listeners positioned later in the propagation order for the current event.

## References

  * todo find this described in the spec.