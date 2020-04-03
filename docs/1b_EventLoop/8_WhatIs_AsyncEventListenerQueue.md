# WhatIs: the AsyncListenerQueue

In the next chapter, we will dive into event listeners and how events are dispatched. But. We need to make part of this discussion part of this chapter too. Because sometimes event listeners are queued in a special macrotask queue: AsyncListenerQueue.

The AsyncListenerQueue *always* has a:
1. *lower* priority than the microtask queue and
2. *higher* priority than the UI event macrotask queue.

The AsyncListenerQueue only applies to events that run *async*. Events that run *sync* are not queued in the AsyncListenerQueue; sync events run a) all their event listeners, b) their default action, before c) any microtask queued from any event listener. This causes problems such as NestedPropagation and SyncDefaultActions, which we will look more in depth at soon.

## Demo 1: AsyncListenerQueue vs. the microtask queue

In this demo, we add three event listeners that will be triggered when the user clicks on "Click me!". In each event listener we queue both a normal microtask and a nested microtask. A nested microtask is a microtask that is added from within a microtask.    

```html
<div id="c">
  <div id="b">
    <div id="a">Click me!</div>
  </div>
</div>

<script>
  const a = document.querySelector("#a");
  const b = document.querySelector("#b");
  const c = document.querySelector("#c");

  function log(e) {
    const name = e.currentTarget.id;
    console.log(name);
    Promise.resolve().then(function(){
      console.log(name + " (normal microtask)");
    });
    Promise.resolve().then(function(){
      Promise.resolve().then(function(){
        console.log(name + " (nested microtask)");
      });
    });
  }

  a.addEventListener("click", log);
  b.addEventListener("click", log);
  c.addEventListener("click", log);
</script>
``` 

Results:

```
a
a (normal microtask)
a (nested microtask)
b
b (normal microtask)
b (nested microtask)
c
c (normal microtask)
c (nested microtask)
```

As we can see in the demo above, both the normal and nested microtasks are run *before* the next event listener callback. This proves that async event listeners are run one by one from some sort of queue, and that this queue has a lower priority than the microtask queue.  

The purpose of nested microtasks is to show that the event listener callbacks themselves are not queued in the microtask queue by the browser.

## Demo 2: AsyncListenerQueue vs. UI events

In this demo, we trigger a sequence of 5 `toggle` event listeners that each consume a second from the browser. The `toggle` event is dispatched async, and while the 5 second async event propagation of the `toggle` event takes place, the user clicks on the `<div>` element. Will any of the `click` events be processed in between any of the event listeners for `toggle`? 

```html
<details>
  <summary>click here!</summary>
  <div style="background: orange">CLICK on ORANGE for 2 SEC and then wait!!!</div>
</details>

<script>
  const details = document.querySelector("details");
  const div = document.querySelector("div");

  function onClick() {
    console.log("click");
  }

  function onToggle() {
    console.log("toggle");
    const time = new Date().getTime();
    while (time + 1000 > new Date().getTime()) ; //consume a second
  }

  details.addEventListener("toggle", onToggle);
  details.addEventListener("toggle", onToggle.bind({}));
  details.addEventListener("toggle", onToggle.bind({}));
  details.addEventListener("toggle", onToggle.bind({}));
  details.addEventListener("toggle", onToggle.bind({}));
  div.addEventListener("click", onClick);
</script>
``` 

Results:

```
toggle
toggle
toggle
toggle
toggle
click
click
click
click
click
click
...
```

No. The event listeners queued in the AsyncListenerQueue is *always* prioritized over the UI `click` event.
   
## References

  * dunno