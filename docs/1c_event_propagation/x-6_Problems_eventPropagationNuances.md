## Problem 0: Does non-bubbling events trickle down in the capture phase?

## Non-bubbling events?

Some events do not bubble. But. And hold on to your hat! Non-bubbling events still propagate *down* in the *capture phase*. It is *only phase 3, the upward propagation from the `target`'s parent to the `window` that is stopped*. Non-bubbling events operate exactly like bubbling events that has an event listener that calls `.stopPropagation()` on its target element. 
                           
<code-demo src="demo/NonBubblingEventsDoStillCapture.html"></code-demo>

Examples of non-bubbling events are:

1. Resource life-cycle events: `load`, `error`, `abort`, `beforeunload`, `unload`.
2. Legacy UI events: `focus`/`blur`, `mouseenter`/`mouseleave`. These non-bubbling event pairs has been given a bubbling cousin pair: `focusin`/`focusout` and `mouseover`/`mouseout`.
3. Legacy DOM mutation events: `DOMNodeRemovedFromDocument`/`DOMNodeInsertedIntoDocument`. These DOM mutation events have been replaced by `MutationObserver`.
4. The `resize`, `online`, `offline` events.
5. The `toggle` event.

When you make your own custom events, the **the default option is `bubble: true`**. The real question is: would you ever make a non-bubbling event, and if so, why?
1. You would not make a custom event `bubble: false` for performance reasons. For non-bubbling events, the browser still needs to compute a list of event listeners for both the capture and target phases. Thus, no underlying computation is really avoided by listing functions from only two, instead of three propagation phases.
2. If the custom event always targets the `window`, the custom event will never do anything but propagation phase, so it doesn't matter if the `bubble` is `true` or `false` or `Schrodinger's cat`.  
3. Two facts:
   * To check if the `eventListener` is added to the `target` element, you can choose from two simple checks: `event.currentTarget === event.target` or `event.phase === 2`. 
   * To listen for an event that does not bubble, you either need to know its non-bubbling target (in the target phase) or step into the capture phase that in a sense bypasses the non-bubbling property.
   
   This means that you can make all eventListeners `non-bubbly` by either adding `if(event.phase > 2) return;` to them, and/or by adding `if(event.phase === 2) event.stopPropagation();` to the event listener added to the `target`. 

In my opinion, there rarely would be any benefit of using `bubble: false` in a customEvent. Some use-cases for your custom event might benefit from bubbling, and to make it more reusable, it should likely `bubble: true`. From my current position, I do not see any use-case for reusable custom events where the benefits of `bubble: false` would likely outweigh the benefits of `bubble: true`.

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