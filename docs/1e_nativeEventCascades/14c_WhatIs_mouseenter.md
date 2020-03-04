# WhatIs: `mouseenter` and `mouseleave`?

The `mouseenter`/`mouseleave` event are dispatched when an element gains/looses `:hover`. The `mouseenter`/`mouseleave` events do not `bubble` and are intended as JS hooks that should be caught directly on the element inspected and not on a container element.

Technically, The `mouseenter` event fires when *the first* `mouseover` event hits an element or one of its descendant elements. The `mouseleave` event fires has been targeted by a `mouseenter` event, and then is targeted by a `mouseout` event whose `relatedTarget` is not the element itself or one of its descendants.

> See MDN for a more in depth description of `mouseenter` vs. `mouseover`.

**Tip!** The *main* events are `mouseover` and `mouseout`. `mouseenter` and `mouseleave` are filtered events of `mouseover` and `mouseout` that are duplicated and sent to multiple targets when appropriate. You can *always* accomplish what you need with `mouseover` instead of `mouseenter`, but not vice versa. But sometimes your use of `mouseover` exactly overlap with the situation in which `mouseenter` appears. In such circumstances you can rely on `mouseenter`. Thus, consider `mouseenter`  and `mouseleave` as convenience events.   
 
## Demo: 

```html
<style>
  * {margin: 0; padding: 0; border: none}
  :not(body):not(:root):hover {border-left: 5px solid green}
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
  window.addEventListener("mouseout", ()=> console.log("---"), true);
  window.addEventListener("mouseout", (e)=> console.log("mouseout on window", e.target), true);
  // window.addEventListener("mouseleave", (e)=> console.log("mouseleave on window", e.target), true);//doesn't work in Chrome
  document.addEventListener("mouseleave", (e)=> console.log("mouseleave on document", e.target), true);
  window.addEventListener("mouseover", (e)=> console.log("mouseover on window", e.target), true);
  // window.addEventListener("mouseenter", (e)=> console.log("mouseenter on window", e.target), true);//doesn't work in Chrome
  document.addEventListener("mouseenter", (e)=> console.log("mouseenter on document", e.target), true);
</script>
```

`mouseenter` and `mouseleave` don't `bubble`. So, you will not be able to capture a `mouseenter` or `mouseleave` event on the `window` element in the bubble phase. 

**Bug: Missing `mouseenter` on `window` in Chrome**. In Chrome, if you don't have an event listener for `mouseenter` or `mouseleave` on the `document` element or below, then `mouseenter` and `mouseleave` will not be dispatched to the `window` in the capture phase neither. Be aware of this when debugging, it can be a nuisance.

## Demo: MouseenterController

The MouseenterController is almost as simple as the HoverController we saw in the last chapter. The only thing to take note of is the need to explicitly filter the propagation paths, and the need to dispatch multiple `mouseenter` and `mouseleave` events.

```html
<style>
  * {margin: 0; padding: 0; border: none}
  :not(body):not(:root):hover {border-left: 5px solid green}
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
  window.addEventListener("mouseout", () => console.log("---"), true);

  window.addEventListener("mouseout", (e) => console.log("mouseout on window", e.target), true);
  document.addEventListener("my-mouseleave", (e) => console.log("mouseleave on document", e.target), true);
  window.addEventListener("mouseover", (e) => console.log("mouseover on window", e.target), true);
  document.addEventListener("my-mouseenter", (e) => console.log("mouseenter on document", e.target), true);

  (function () {

    const MouseenterController = {
      onMouseout: function (e) {
        for (let loosingHover of e.composedPath()) {
          if (!e.relatedTarget || (loosingHover instanceof Node && !loosingHover.contains(e.relatedTarget))) {
            setTimeout(function () {
              loosingHover.dispatchEvent(new MouseEvent("my-mouseleave", {composed: true}));
            }, 0);
          }
        }
      },
      onMouseover: function (e) {
        for (let gainingHover of e.composedPath()) {
          if (!e.relatedTarget || (gainingHover instanceof Node && !gainingHover.contains(e.relatedTarget))) {
            setTimeout(function () {
              gainingHover.dispatchEvent(new MouseEvent("my-mouseenter", {composed: true}));
            }, 0);
          }
        }
      },
    };
    window.addEventListener("mouseover", MouseenterController.onMouseover);
    window.addEventListener("mouseout", MouseenterController.onMouseout);
  })();
</script>
```

The implementation above is not accurate. First of all, it doesn't queue the `mouseenter` and `mouseleave` in the right sequential order: the native `mouseout` are dispatched before `my-mouseenter`. 

## References

 * 
