# WhatIs: `click`?

`click` is the most important event, el numero uno! `click` is the basic means for communication between the user and the web page. Therefore, the `click` event also has by far the most default actions associated with it. And it is one of, if not the most common event to bind event listeners too.

`click` is also an old event. Proper OG. It was there from the beginning, in the very first original browsers. This has the side-effect that some of the native, builtin behavior in the browsers associated with `click` works in peculiar, legacy ways. Primarily the sequence of actions when `click`s are done on `<input type="checkbox">` and the use of `<base href="...">`.  
## `click` details

`click` is generated when the left mouse button is pressed down and then released first over an element (or one of its descendants) in the DOM. 

There are some edge cases to consider surrounding the generation of `click` events:

1. The `click` event *only* looks to the primary mouse button behavior and will disregard any `mousedown` or `mouseup` events associated with other mouse buttons. 

2. The `click` event doesn't accept any DOM mutations of the `target` element or one of its ancestors between the `mousedown` and the `mouseup`. You can imagine it as if a `disconnectedCallback()` is attached to the `target` element that will turn off any ongoing click event controller for that element.

3. If more than two mouse buttons are pressed down together, the first mouse button to be released will win the day and get its click event. This means that if you:'
   1) mousedown left, 
   2) mousedown right, 
   3) mouseup **left**, and 
   4) mouseup right, 
   * you will get the `click` event between 3 and 4, but no `auxclick` event after 4.
    
   Similarly, if you 
   1) mousedown left, 
   2) mousedown right, 
   3) mouseup **right**, and 
   4) mouseup left, 
   * you will get the `auxclick` event between 3 and 4, but no `click` event after 4.

   The `click` and `auxclick` can be understood as competing for the triggering `mouseup` event. Later in this chapter, we will look more in detail about event controllers competing for trigger events. 
   
## Demo: `click`
    
```html
<h1>Hello sunshine!</h1>
<p>
  Normal. Text selection will not turn off click events.
  The contextmenu behavior is turned off in this demo, so you will can auxclick's too.
</p>
<a href="#one">normal. Dragging will turn off click.</a>
<br>
<br>
<a href="#two" draggable="false">
  draggable=false.
  Here you can mousedown, drag around the mouse, and then if you return over the element again before you mouseup,
  you get a click.</a>
<br>
<br>
<p id="three">The element is disconnected from and then connected again to the DOM on mousedown,
  and therefore cannot be "click"ed.</p>
<script>
  window.addEventListener("contextmenu", e=> e.preventDefault());

  const three = document.querySelector("#three");
  three.addEventListener("mousedown", ()=> document.body.appendChild(three));

  window.addEventListener("mousedown", e => console.log(e.type, e.composedPath()));
  window.addEventListener("mouseup", e => console.log(e.type, e.composedPath()));
  window.addEventListener("click", e => console.log(e.type, e.composedPath()));
  window.addEventListener("auxclick", e => console.log(e.type, e.composedPath()));
</script>
```

## Finding `click` target

To find the `click` target, the browser must find the lowest common `target` element in the `.composedPath()` of both the `mousedown` and `mouseup` events.

```javascript
function getComposedPath(target, composed) {
  const path = [];
  while (true) {
    path.push(target);
    if (target.parentNode) {
      target = target.parentNode;
    } else if (target.host) {
      if (!composed)
        return path;
      target = target.host;
    } else if (target.defaultView) {
      target = target.defaultView;
    } else {
      break;
    }
  }
  return path;
}

function findCommonTarget(pathA, pathB){
  let i;
  for (i = 0; i < pathA.length && i < pathB.length; i++) {
    if( pathA[i] !== pathB[i])
      return pathA[i-1];
  }
  return pathA[i-1];
}

let mousedownPath;
let mouseupPath;

window.addEventListener("mousedown", e=> mousedownPath = getComposedPath(e.target, e.composed));
window.addEventListener("mouseup", e=> mouseupPath = getComposedPath(e.target, e.composed));
window.addEventListener("mouseup", e=> console.log(findCommonTarget(mousedownPath, mouseupPath)));
```

## Demo: `ClickController`

To implement a basic ClickController is simple:

```html
<h1>Hello sunshine!</h1>
<p>
  Normal. Text selection will not turn off click events.
  The contextmenu behavior is turned off in this demo, so you will can auxclick's too.
</p>
<a href="#one">normal. Dragging will turn off click.</a>
<br>
<br>
<a href="#two" draggable="false">
  draggable=false.
  Here you can mousedown, drag around the mouse, and then if you return over the element again before you mouseup,
  you get a click.</a>
<br>
<br>
<p id="three">The element is disconnected from and then connected again to the DOM on mousedown,
  and therefore cannot be "click"ed.</p>
<script>
  (function () {
    function findCommonTarget(pathA, pathB) {
      pathA = pathA.slice().reverse();
      pathB = pathB.slice().reverse();
      let i;
      for (i = 0; i < pathA.length && i < pathB.length; i++) {
        if (pathA[i] !== pathB[i])
          return pathA[i - 1];
      }
      return pathA[i - 1];
    }

    class DisconnectWrapper extends HTMLElement {
      disconnectedCallback() {
        ClickController.reset();
      }
    }

    customElements.define("disconnected-wrapper", DisconnectWrapper);

    const ClickController = {
      mousedownPath: undefined,
      onMousedown: function (e) {
        if (e.button !== 0)
          return;
        ClickController.mousedownPath = e.composedPath();
        window.removeEventListener("mousedown", ClickController.onMousedown, true);
        window.addEventListener("mouseup", ClickController.onMouseup, true);
        window.addEventListener("auxclick", ClickController.reset, true);
        ClickController.mousedownPath[0].addEventListener("DOMNodeRemoved", ClickController.reset, true);
      },
      onMouseup: function (e) {
        if (e.button !== 0)
          return;
        const target = findCommonTarget(ClickController.mousedownPath, e.composedPath());
        const myClick = new MouseEvent("my-click", {composed: true, bubbles: true, cancelable: true});
        setTimeout(() => target.dispatchEvent(myClick), 0);
        ClickController.reset();
      },
      reset: function () {
        window.addEventListener("mousedown", ClickController.onMousedown, true);
        window.removeEventListener("mouseup", ClickController.onMouseup, true);
        window.removeEventListener("auxclick", ClickController.reset, true);
        ClickController.mousedownPath[0].removeEventListener("DOMNodeRemoved", ClickController.reset, true);
        ClickController.mousedownPath = undefined;
      }
    };

    window.addEventListener("mousedown", ClickController.onMousedown, true);
  })();
</script>
<script>
  window.addEventListener("contextmenu", e => e.preventDefault());

  const three = document.querySelector("#three");
  three.addEventListener("mousedown", () => document.body.appendChild(three));

  window.addEventListener("mousedown", e => console.log(e.type, e.composedPath()));
  window.addEventListener("mouseup", e => console.log(e.type, e.composedPath()));
  window.addEventListener("click", e => console.log(e.type, e.composedPath()));
  window.addEventListener("auxclick", e => console.log(e.type, e.composedPath()));
  window.addEventListener("my-click", e => console.log(e.type, e.composedPath()));
</script>
```

## Further reading

In this chapter we will look at the ins and outs of `click`:
1. We start in this chapter looking at how the browser generates `click`.
2. Then we look at how `auxclick` works, `click`'s cousin.
3. We then look at how the browser generates the universal `dblclick` event from `click` events. The `dblclick` is always generated if appropriate.
4. Then we look at the native element's behavior that is triggered by `click`:
   1. `click` on `<summary>` to `open` and  `toggle` the content of the parent `<details>`.   
   1. `click` on `<a href="...">` to navigate to a new document.   
   1. `click` on `<a href="...">` to navigate to a new document.   
   1. `click` on `<img usemap="...">` to navigate to a new document.   
   1. `click` on `<input type="submit">` to `submit`.   

## References

 * dunno