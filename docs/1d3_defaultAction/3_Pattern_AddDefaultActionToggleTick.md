# Pattern: add DefaultAction using `toggleTick(...)`

## Problem: race condition

There is a problem using `setTimeout(...)` to add default actions: `setTimeout(...)` is slow. Sometimes, multiple events are queued in the event loop seemingly at the same time, and then `setTimeout(...)` will falter.

```html
<div singleclick-action dblclick-action>
  default action added to both single click and dblclick event for this particular element
</div>

<script>
  function singleClickAction(event) {
    console.log("click default action trigger by ", event.type);
  }

  function dblclickAction(event) {
    console.log("dblclick default action trigger by ", event.type);
  }

  window.addEventListener("click", function (e) {
    const path = e.composedPath();
    for (let element of path) {
      if (element instanceof HTMLDivElement && element.hasAttribute("singleclick-action"))
        return setTimeout(() => singleClickAction(e));
    }
  });
  window.addEventListener("dblclick", function (e) {
    const path = e.composedPath();
    for (let element of path) {
      if (element instanceof HTMLDivElement && element.hasAttribute("dblclick-action"))
        return setTimeout(() => dblclickAction(e));
    }
  });

  window.addEventListener("click", e => console.log(e.type));
  window.addEventListener("dblclick", e => console.log(e.type));
</script>
```  
 Results in:
```
click
click default action trigger by  click
click
dblclick
click default action trigger by  click
dblclick default action trigger by  dblclick
```

In the result above, the `dblclick` event propagates *before* the "click default action" runs. This is because the `dblclick` event is queued in the event loop *before* the `setTimeout(...)`. So, we need to queue the default action in a way that ensures that it will run as the next tick of the event loop.

## How to *best* queue a custom default action? 

To run a default action task a) immediately after the currently processing event's propagation has completed *and* b) before any other previously added events, we must use `toggleTick(cb, raceEvents)`. The `toggleTick(...)` method is literally tailor made for this purpose, and so by switching out `setTimeout(defaultAction, 0)` with `toggleTick(defaultAction, currentEventName)` we solve the race condition with previous events.

## Demo: 

```html
<script src="../../1b_EventLoop/demo/toggleTick.js"></script>

<div singleclick-action dblclick-action>
  default action added to both single click and dblclick event for this particular element
</div>

<script>
  function singleClickAction(event) {
    console.log("click default action trigger by ", event.type);
  }

  function dblclickAction(event) {
    console.log("dblclick default action trigger by ", event.type);
  }

  window.addEventListener("click", function (e) {
    const path = e.composedPath();
    for (let element of path) {
      if (element instanceof HTMLDivElement && element.hasAttribute("singleclick-action"))
        return toggleTick(() => singleClickAction(e), e.type);
    }
  });
  window.addEventListener("dblclick", function (e) {
    const path = e.composedPath();
    for (let element of path) {
      if (element instanceof HTMLDivElement && element.hasAttribute("dblclick-action"))
        return toggleTick(() => dblclickAction(e), e.type);
    }
  });

  window.addEventListener("click", e => console.log(e.type));
  window.addEventListener("dblclick", e => console.log(e.type));
</script>
```
   