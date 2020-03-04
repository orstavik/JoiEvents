# WhatIs: `mouseover` and `mouseout`?

The `mouseover` and `mouseout` events are spin-offs of the `mousemove` event. When a `mousemove` event enters over a new element `target` in the DOM, then:
1. a `mouseout` event is dispatched on the previous `target` element of the `mousemove` event, and
2. a `mouseover` event is dispatched on the new `target` element of the `mousemove` event. 

`mouseover` and `mouseout` only consider the `target` element of the `mousemove`. This means that if the `mousemove` passes from a parent to a child, then the parent element will first get a `mouseout` event, and then the child element will get a `mouseover` event (that will propagate over the parent element that just received a `mouseout` event).

For `mouseover`, the `target` is the element that becomes the `target` for the `mousemove` event, and the `relatedTarget` is the old, previous `target` for the last `mouseover` event. For `mouseout` it is the exact opposite. Be aware. The `.relatedTarget` can be `null` when the mouse for example leaves the browser window.

## Demo: `mouseover`

```html
<style>
  * {margin: 0; padding: 0; border: none}
  #a1 {background: lightgray}
  #a2 {background: lightblue}
  #a3 {background: yellow}
  #b1 {background: lightgreen}
</style>
<div id="a1">
  a1
  <div id='a2'>
    a2
    <div id='a3'>a3</div>
  </div>
</div>
<div id="b1">b</div>

<script>
  window.addEventListener("mouseover", e => console.log(e.type, e.target, e.relatedTarget));
  window.addEventListener("mouseout", e => console.log(e.type, e.target, e.relatedTarget));

  // this DOM mutation will register if you hover over one of the other div elements.
  setTimeout(function () {
    const div = document.createElement("div");
    div.innerText = "After 3 sec a new element is added at the top of the document. " +
      "This DOM mutation DO trigger mouseover/mouseout events.";
    document.body.prepend(div);
  }, 3000);

  // this DOM mutation will not register if you hover over #b1.
  setTimeout(function () {
    const div = document.createElement("div");
    const b1 = document.querySelector("#b1");
    div.appendChild(b1.childNodes[0]);
    b1.appendChild(div);
  }, 6000);

</script>
```
1. When the **page loads**, Firefox dispatches the first `mouseover` event whereas Chrome do no dispatch the first `mouseover` event until the first `mousemove` event triggers it. Think of the `mouseover` and `mouseout` events as initiated by the first `mousemove` event in Chrome, whereas in Firefox, `mouseover` is initiated by page loading. 
2. When the `target` of the `mousemove` changes, a pair of `mouseout` and `mouseover` events are dispatched on the previous and new `mousemove` `target` respectively.
   * Both the `mouseover` and `mouseout` events have a `.relatedTarget` that represent the previous `target` for `mouseover` events and the new `target` for `mouseout` events.
3. **DOM mutations** also trigger `mouseover` and `mouseout` events. This behaves differently in Firefox and Chrome.
   * In Firefox, the `mouseout` and `mouseover` events are dispatched immediately when the `target` under the mouse cursor changes. Firefox behaves as if the mouse cursor can detect when the element under its mouse cursor tip changes (as if the cursor was a human finger pressing down on a piece of paper, and that the paper is moved/morphed).
   * In Chrome, the DOM mutation is recognized as triggering the `mouseover` event immediately if the DOM mutation changes the position of the previous `mouseover` target away from the mouse cursor position. However, if the DOM mutation changes the `target` of the `mousemove`, but do not change the position of the `mouseover` target, such as by wrapping another element inside the active `mousemove` target, then the DOM mutation is only detected after a little while (150ms?).

## Demo: MouseoverController

To imitate the native behavior of the function controlling `mouseover` (Firefox), we need to add *three* trigger events:
1. a `DOMContentLoaded` event listener,
2. a `mousemove` event listener, and
3. a `requestAnimationFrame()` poll that checks if no other element is positioned at the current registered mouse cursor position.

```html
<style>
  * {margin: 0; padding: 0; border: none}
  #a1 {background: lightgray}
  #a2 {background: lightblue}
  #a3 {background: yellow}
  #b1 {background: lightgreen}
</style>
<div id="a1">
  a1
  <div id='a2'>
    a2
    <div id='a3'>a3</div>
  </div>
</div>
<div id="b1">b</div>

<script>
  (function () {

    function hackToGetMouseTargetFromNothing() {
      const hovered = document.querySelectorAll(":not(gurba):hover");
      return hovered[hovered.length - 1];
    }

    const MouseoveroutController = {
      target: null,
      tryToDispatchMouseover: function (newTarget) {
        if (MouseoveroutController.target === newTarget)
          return;
        if (MouseoveroutController.target) {
          const oldTarget = MouseoveroutController.target;
          setTimeout(function () {
            const mouseoverEvent = new MouseEvent("my-mouseout", {composed: true, bubbles: true});
            Object.defineProperty(mouseoverEvent, 'relatedTarget', {value: newTarget});
            oldTarget.dispatchEvent(mouseoverEvent);
          }, 0);
        }
        if (newTarget) {
          const oldTarget = MouseoveroutController.target;
          setTimeout(function () {
            const mouseoverEvent = new MouseEvent("my-mouseover", {composed: true, bubbles: true});
            Object.defineProperty(mouseoverEvent, 'relatedTarget', {value: oldTarget});
            newTarget.dispatchEvent(mouseoverEvent);
          }, 0);
        }
        MouseoveroutController.target = newTarget;
      }, mousemove: function (e) {
        MouseoveroutController.tryToDispatchMouseover(e.target);
      },
      domContentLoaded: function () {
        requestAnimationFrame(() => {
          const hoverTarget = hackToGetMouseTargetFromNothing();
          MouseoveroutController.tryToDispatchMouseover(hoverTarget);
          MouseoveroutController.domContentLoaded();
        });
      }
    };
    window.addEventListener("mousemove", MouseoveroutController.mousemove);
    window.addEventListener("DOMContentLoaded", MouseoveroutController.domContentLoaded);
  })();

  window.addEventListener("my-mouseover", e => console.warn(e.type, e.target, e.relatedTarget));
  window.addEventListener("my-mouseout", e => console.warn(e.type, e.target, e.relatedTarget));
  window.addEventListener("mouseover", e => console.log(e.type, e.target, e.relatedTarget));
  window.addEventListener("mouseout", e => console.log(e.type, e.target, e.relatedTarget));

  // This DOM mutation will register immediately if you hover over one of the other div elements.
  setTimeout(function () {
    const div = document.createElement("div");
    div.innerText = "After 3 sec a new element is added at the top of the document. " +
      "This DOM mutation DO trigger mouseover/mouseout events.";
    document.body.prepend(div);
  }, 3000);

  // In Chrome, this DOM mutation will register after a little while if you hover over #b1.
  setTimeout(function () {
    const div = document.createElement("div");
    const b1 = document.querySelector("#b1");
    div.appendChild(b1.childNodes[0]);
    b1.appendChild(div);
  }, 6000);
</script>
```

The demo:
* uses a `requestAnimationFrame()` poll with a hacky a querySelector to find the `mousemove` `target` when it is driven by `DOMContentLoaded` or by DOM mutations. This is costly when done from JS. However, the browser can efficiently calculate the current `mousemove` target and queue a new mouse event every time it does its layout computation, so this is not inefficient from the perspective of a native event controller.
* shows also that Chrome does not register which elements are hovered before the first `mousemove` event.

## References

 * 
