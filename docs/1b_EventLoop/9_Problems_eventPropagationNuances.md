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
  inner.dispatchEvent(new MouseEvent("click", {
    bubbles: false
  }));
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

## Conclusion

The function that drives event propagation freezes the composed path at the outset, but the act of adding and removing event listeners are dynamic will affect the execution of event listeners positioned later in the propagation order for the current event.

## References

  * todo find this described in the spec.