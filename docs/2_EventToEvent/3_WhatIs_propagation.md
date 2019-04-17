# WhatIs: Propagation

For an introduction to event propagation and bubbling, see: [MDN: Event bubbling and capture](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
This chapter uses examples to explain event propagation.

## Example 1: Capture vs. Bubble phase

<code-demo src="/demo/BubbleCapture.html"></code-demo>
   
```html
<div id="box">
  <h1 id="sunshine">Hello sunshine!</h1>
</div>
<div id="outside">think</div>

<script>
  function log(e, extra) {
    const phase = e.eventPhase === 1 ? "capture" : (e.eventPhase === 3 ? "bubble" : "target");
    const name = e.currentTarget.tagName || "window";
    console.log(phase, name, e.type, extra || "");
  }

  const root = document.children[0];
  const body = root.children[1];
  const box = document.querySelector("#box");
  const outside = document.querySelector("#outside");
  const sunshine = document.querySelector("#sunshine");

  //bubble phase listeners
  window.addEventListener("click", log);
  root.addEventListener("click", log);
  body.addEventListener("click", log);
  box.addEventListener("click", log);
  outside.addEventListener("click", log);
  sunshine.addEventListener("click", function(e){log(e, "bubble");});

  //capture phase listeners
  window.addEventListener("click", log, true);
  root.addEventListener("click", log, true);
  body.addEventListener("click", log, true);
  box.addEventListener("click", log, true);
  outside.addEventListener("click", log, true);
  sunshine.addEventListener("click", function(e){log(e, "capture");}, true);

  //event listeners added last
  window.addEventListener("click", function(e){log(e, "added last");});
  window.addEventListener("click", function(e){log(e, "added last");}, true);
</script>
```

In the example above, you have a small DOM with a couple of elements. 
To these elements, there are added some click listeners.
If you click on "Hello sunshine!", you will see in the log that the event listeners will be 
called in the following sequence:

1. The event is *captured*. The sequence here is top-down, from the `window` towards the `target`. 
   
2. *At the target* the event listeners are processed in the sequence they were added, 
   completely disregarding if they were marked with `capture` or not. 
   This means that when you click on "Hello sunshine!", the `"bubble"` event listener will be 
   triggered before the `"capture"` event listener. 

3. The event is *bubbles*. The sequence here is down-top, from the `target` parentNode to the `window`.

 * If two event listeners are added on the same element in the same propagation phase,
   then they will be run in the order that they were added.

## Example 2: Native composed events (touchend -> mouseup -> click)

The domino-effect.

<code-demo src="/demo/TouchendMouseupClick.html"></code-demo>

```html
<div id="box">
  <h1 id="sunshine">Hello sunshine!</h1>
</div>

<script>
  function log(e) {
    const phase = e.eventPhase === 1 ? "capture" : (e.eventPhase === 3 ? "bubble" : "target");
    const name = e.currentTarget.tagName || "window";
    console.log(phase, name, e.type);
  }

  const root = document.children[0];
  const body = root.children[1];
  const box = document.querySelector("#box");
  const sunshine = document.querySelector("#sunshine");

  //click listeners
  window.addEventListener("click", log);
  root.addEventListener("click", log);
  body.addEventListener("click", log);
  box.addEventListener("click", log);
  sunshine.addEventListener("click", log);
  window.addEventListener("click", log, true);
  root.addEventListener("click", log, true);
  body.addEventListener("click", log, true);
  box.addEventListener("click", log, true);
  sunshine.addEventListener("click", log, true);

  //mouseup listeners
  window.addEventListener("mouseup", log);
  root.addEventListener("mouseup", log);
  body.addEventListener("mouseup", log);
  box.addEventListener("mouseup", log);
  sunshine.addEventListener("mouseup", log);
  window.addEventListener("mouseup", log, true);
  root.addEventListener("mouseup", log, true);
  body.addEventListener("mouseup", log, true);
  box.addEventListener("mouseup", log, true);
  sunshine.addEventListener("mouseup", log, true);

  //touchend listeners
  window.addEventListener("touchend", log);
  root.addEventListener("touchend", log);
  body.addEventListener("touchend", log);
  box.addEventListener("touchend", log);
  sunshine.addEventListener("touchend", log);
  window.addEventListener("touchend", log, true);
  root.addEventListener("touchend", log, true);
  body.addEventListener("touchend", log, true);
  box.addEventListener("touchend", log, true);
  sunshine.addEventListener("touchend", log, true);

</script>
```

The browser will automatically spawn a `mousedown`/`mouseup` events from 
`touchstart`/`touchend` events on mobile to support legacy web pages that only implement support for
mouse events. These spawned `mousedown` and `mouseup` events we can say are DOM Events composed from
other `touchstart`/`touchend` DOM Events.

The `click` event is composed from a pair of preceding:
 * `touchstart`+`touchend` events, if the original action was a touch event, or
 * `mousedown`+`mouseup` events, if the original event was a mouse event.

The example above illustrate how such native composed DOM Events propagate *one-by-one*.
The native composed events does not start their own propagation before their preceding trigger events
has completed their propagation. Thus, propagation spans three levels:

1. Macro level: Event listeners for native events dispatched by the browser are *first* triggered by 
   DOM Event type. Native events propagate *one-by-one* completely, ie. 
   a native trigger event will complete its propagation before another native composed event 
   begins its propagation.
   
2. Medium level: Event listeners are then triggered depending on propagation phase and DOM tree position.
   1. capture phase (from `window` to `target.parentNode`)
   2. target phase (on `target`, `capture: true/false` ignored)
   3. bubble phase (from `target.parentNode` to `window`)

3. Micro level: Event listeners are then triggered in the order they were added in the script.
   
## Example 3: Custom events (echo-click)

<code-demo src="/demo/EchoClick.html"></code-demo>

```html
<div id="box">
  <h1 id="sunshine">Hello sunshine!</h1>
</div>

<script>
  function echo(e){
    const echo = new CustomEvent("echo-" + e.type, {bubbles: true, composed: true});
    e.target.dispatchEvent(echo);
  }

  function log(e) {
    const phase = e.eventPhase === 1 ? "capture" : (e.eventPhase === 3 ? "bubble" : "target");
    const name = e.currentTarget.tagName || "window";
    console.log(phase, name, e.type);
  }

  const box = document.querySelector("#box");
  const sunshine = document.querySelector("#sunshine");

  sunshine.addEventListener("click", echo);
  sunshine.addEventListener("echo-click", echo);

  //click listeners
  window.addEventListener("click", log);
  box.addEventListener("click", log);
  sunshine.addEventListener("click", log);
  window.addEventListener("click", log, true);
  box.addEventListener("click", log, true);
  
  //echo-click listeners
  window.addEventListener("echo-click", log);
  box.addEventListener("echo-click", log);
  sunshine.addEventListener("echo-click", log);
  window.addEventListener("echo-click", log, true);
  box.addEventListener("echo-click", log, true);
  
  //echo-echo-click listeners
  window.addEventListener("echo-echo-click", log);
  box.addEventListener("echo-echo-click", log);
  sunshine.addEventListener("echo-echo-click", log);
  window.addEventListener("echo-echo-click", log, true);
  box.addEventListener("echo-echo-click", log, true);
</script>
```

When events are dispatched from JS via methods such as `.dispatchEvent(..)` or `.click()`,
then they do *not* propagate one-by-one, but propagate *nested one-inside-another*.
You see this in the example above that as soon as `.dispatchEvent(...)` for `echo-click` 
and `echo-echo-click` are called, they start to propagate down in the capture phase *before*
their trigger `click` and `echo-click` events have completed.

## References

 * [MDN: Event bubbling and capture](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture)