# WhatIs: `resize`?

```html
<style>
    #a {
        height: 300px;
        width: 100vw;
        background-color: yellow;
    }

    #b {
        height: 300px;
        width: 80vw;
        background-color: brown;
    }
</style>
<div id="a" resize-notify></div>
<div id="b" resize-notify></div>

<script>
  (function () {

    const ResizeController = {
      rafEntries: [],
      observedElements: document.querySelectorAll("*[resizeNotify]"),
      
      clientRects: function () {
        if (!ResizeController.observedElements)
          return;
        setTimeout(function () {
          requestAnimationFrame(ResizeController.clientRects);
          let res = new WeakMap();
          for (let element of ResizeController.observedElements) {
            let elemWidth = element.getClientRects();
            res.set(element, elemWidth[0].width);

            if (ResizeController.rafEntries.length >= 3) {
              // value which was active 3 iteration ago
              let previous = ResizeController.rafEntries[ResizeController.rafEntries.length - 3].get(element);
              let current = ResizeController.rafEntries[ResizeController.rafEntries.length - 1].get(element);
              if (previous !== current) {
                // according to spec(https://www.w3.org/TR/2014/WD-DOM-Level-3-Events-20140925/#event-type-resize) - resize event neither *bubble* nor *cancelable*
                let details = {initialSize: previous.toFixed(3), currentSize: current.toFixed(3)};
                let resizeEvent = new CustomEvent("my-resize", {composed: true, detail: details});
                element.dispatchEvent(resizeEvent);
              }
            }

          }
          ResizeController.rafEntries.push(res);

        }, 150);
      }
    };


    ResizeController.clientRects();

  })();

  document.querySelectorAll("*[resizeNotify]").forEach(element => element.addEventListener("my-resize", e => console.log(e.type, e.target, "+ ", e.detail)));
    
</script>
```


## References

 * [MDN: `submit` event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event);