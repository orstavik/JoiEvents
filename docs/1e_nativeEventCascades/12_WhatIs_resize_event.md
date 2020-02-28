# WhatIs: `resize`?

The `resize` event is dispatched when the `window` or `<iframe>` changes its `innerWidth`. The `resize` event is used when a script needs to react to changes of the visual context for the app. Commonly, developers tries to avoid using scripts for visual reactions, and instead write the rules for how the app should respond to changes in its viewport size as CSS media queries. But, sometimes developers need to go slightly outside this domain, and then the `resize` event comes in handy.

## Demo: `resize`  

```html
<h1>Hello sunshine!</h1>
<p>Resize the window and see the event being logged in the console.</p>
<script>
  window.addEventListener("resize", ()=> console.log("resize"));
</script>
```

## Demo: `ResizeController`

The browser can trigger the resize event using hooks in its core operating procedures. However, when we want to mirror the functionality of the event controller running `resize` events, we need to poll for changes in the viewport's width. 

```html
<h1>Hello sunshine!</h1>
<p>Resize the window and see the event being logged in the console.</p>

<script>
  (function () {
    const ResizeController = {
      width: window.innerWidth,
      height: window.innerHeight,
      lastTime: performance.now(),
      tick: function () {
        const widthNow = Math.round(window.innerWidth);
        const heightNow = Math.round(window.innerHeight);
        const timeNow = performance.now();
        if (ResizeController.width === widthNow /*&& ResizeController.height === heightNow*/) {
          const delay = timeNow - ResizeController.lastTime < 50 ? 45 : 150;
          setTimeout(ResizeController.tick, delay);
        }
        ResizeController.width = widthNow;
        ResizeController.height = heightNow;
        ResizeController.lastTime = timeNow;
        window.dispatchEvent(new UIEvent("my-resize"));
        requestAnimationFrame(ResizeController.tick);
      }
    };
    ResizeController.tick();
  })();

  window.addEventListener("my-resize", e => console.log("resize"));
</script>
```

## Pattern: polling-driven events

To listen for changes in the DOM or CSSOM or the layout model of a web app can be useful in many scenarios. Todo illustrate how the resize event controller can be updated to listen for changes in size of different element types, elements with a particular attribute, elements marked with a particular css property, and elements registered via JS.

## References

 * [MDN: `resize` event](https://developer.mozilla.org/en-US/docs/Web/API/Window/resize_event);