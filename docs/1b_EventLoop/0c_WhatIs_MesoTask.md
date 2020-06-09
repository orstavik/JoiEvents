# WhatIs: a mesotask?

## Demo: the behavior of the async `click` event

To understand what "mesotasks" are, we start by looking at a simple example.

```html
<h1>Hello sunshine</h1>
<script>
  var h1 = document.querySelector("h1");

  h1.addEventListener("click", function(){
    console.log("h1");
    Promise.resolve().then(()=>{
      console.log("h1 microtask");
    });
  });

  window.addEventListener("click", function(){
    console.log("window");
    Promise.resolve().then(()=>{
      console.log("window microtask");
    });
  });

  h1.click();                    //trigger the click event sync from script
</script>
```

When the example above loads, the `h1.click()` is triggered (from script) which results in the following output being console-logged.
```
1. h1
2. window
3. h1 microtask
4. window microtask
```

But, when we `click` on "Hello sunshine" using the mouse or touch, we get the following output to console.log:
```
1. h1
2. h1 microtask
3. window
4. window microtask
```

Why is `h1 microtask` printed in line 3 when triggered from `h1.click()`, and in line 2 when triggered by the user?

## WhatIs: "async events"?

All events that are triggered from script are **sync**. This means that all events triggered from `element.dispatchEvent(new MouseEvent('click'))`, `element.click()`, `formElement.requestSubmit()`, `inputElement.checkValidity()`, etc. are *sync*. I repeat: the browser does not allow events to be dispatched async from script.

But, when the browser automatically dispatches an event triggered by a user action, the browser can dispatch the event so-called *async*. When the browser dispatches an event async, **the browser queues/runs each event listener as its own macrotask**. An async event doesn't only mean that the start of the event propagation is queued in the event loop; an async event means that *both* a) the start of the event propagation as a whole *and* b) the start of each event listener is demarcated as the start of a new macrotask.

In the demo above, we saw this behavior in the async `click` event. When triggered by a user action (ie. `clickEvent.isTrusted === true`), then the browser will dispatch the `click` event as fully asynchronous. This means that the browser will not only queue the `click` event in the event loop: the browser will actually run each event listener as its own macrotask. However, when dispatched from a script, the browser dispatches the `click` event as sync.
 
This explains the following behavior:
1. the `click` event is *not* "async" when it is dispatched from a `<script>`. This means that when dispatched using `h1.click()`, the `click` event will:
   1. start to propagate immediately, and
   2. run *all* its event listeners as part of the current, single macrotask.
    
   Because the event listeners all run within one macrotasks, *both* event listeners are executed *before* the queued microtasks are free to run. Hence, the sync call to `console.log("window")` in the second event listener runs *before* the microtask which calls `console.log("h1 microtask")` is triggered.
 
## WhatIs: mesotasks

There is *one* important thing to note about the macrotask scope around "async event's macrotask listeners":
 * they always run before any other macrotask in the event loop.
 
We can therefore consider the scope of async event listeners in many different ways:
1. The async event listeners are "normal" macrotasks queued in a special "async event listener queue" in the event loop. The "async event listener queue" has supreme priority in the event loop, and when choosing its next macrotask, the browser will always pick the macrotask from the "async event listener queue" if it has any.
2. Async event listener macrotasks are immediately generated when needed, once the previous event listener macrotask has completed and the current event being processed still has more event listeners to run. This very much resembles perspective #1, but instead of queueing all the event listeners up front, it adds them one by one at the very front of the event loop when the previous event listener is finished.
3. Async event listeners are mesotasks. All microtasks within a mesotask must be completed (or queued as a macrotask) before the next mesotask can begin; and all mesotasks within a macrotask must be completed before the next macrotask can begin.

The browser doesn't use mesotasks for any other purpose than async event listeners. The browser doesn't provide any direct means to instantiate mesotasks from script, except one: `ratechangeTick` as we will describe in a later chapter. 

## References

  * dunno