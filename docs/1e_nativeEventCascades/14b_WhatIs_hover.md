# WhatIs: `:hover`?

`:hover` is a CSS pseudo-class that show where the mouse/pointer is currently positioned. Common use of the `:hover` pseudo-class is to show the user which *interactive* abilities the web page provides, ie. where and when the user can accomplish different tasks. By adding different styles to elements based on when the user `:hover` over them, the web app can show the user what he/she CAN do in the NEAR future/NEAR location in the DOM.

## Bug: `:hover` can't stand being alone

**`querySelector(":hover")` and `*:hover { ... }` doesn't work.** On their own, both the `:hover` and `*:hover` selectors returns empty both from `querySelector(...)` in JS and in CSS rules. This is confusing. And I can't find any documentation specifying why. My guess is that this CSS selector is interpreted as a special, unique case that returns empty, and that this semantic interpretation is likely chosen as a (hacky?) solution to yield the fewest bugs in the current web ecosystem.
 
To bypass the "`:hover` alone don't exist" bug, you can use these two bite-size CSS selectors:
 * `*:not(body):not(:root):hover`. This gives you all the elements in the DOM except the two `<body>` and `<html>` elements.
 * `:not(mumbojumbo):hover`. This yields all the elements currently hovered.

## Demo:

```html
<style>
  #inner {
    background: green;
    height: 100px;
  }
  /* These two selectors work. you can see that there are two more right than left borders.  */
  *:not(body):not(:root):hover {
    border-right: 5px solid blue;
  }
  :not(mumbojumbo):hover {
    opacity: 1;
    border-left: 5px dashed blue;
  }
  /*doesnt work. Likely turned off by the browser as they would select the html and body element too*/
  *:hover {
    border-bottom: 10px dotted red;
  }
  :hover {
    border-top: 10px dotted red;
  }
</style>

<div id="div">
  outer
  <div id="inner">inner</div>
</div>

<script>
  setInterval(function () {
    console.log(document.querySelectorAll('*:not(body):not(:root):hover'));
    console.log(document.querySelector(':focus'));
  }, 5000);
</script>
```

## Demo: HoverControllers

There are two ways to control `:hover` pseudo-class: 
1. from within a MouseoveroutController function, or
2. from an independent HoverController being triggered by `mouseover` and `mouseout` events. 

### MouseoveroutController with :hover

When we now add our own `:hover` pseudo-class in the MouseoveroutController, we:
1. remove the responsive behavior for DOM mutation with its hacky use of the native `:hover` property to identify the would be `mousemove` `target`s, and
2. add a function `toggleMyHoverPseudoClass(...)` to add/remove our custom `_my_hover` pseudo-class. 

```html
<style>
  #inner {
    background: green;
    height: 100px;
  }
  /* These two selectors work. you can see that there are two more right than left borders.  */
  *:not(body):not(:root)._my_hover {
    border-right: 5px solid blue;
  }
  :not(mumbojumbo)._my_hover {
    opacity: 1;
    border-left: 5px dashed blue;
  }
  /* In this controller, these two work*/
  *._my_hover {
    border-bottom: 10px dotted red;
  }
  ._my_hover {
    border-top: 10px dotted green;
  }
</style>

<div id="div">
  outer
  <div id="inner">inner</div>
</div>

<script>
  (function () {

    // this is not the composedPath(), just a simplification for the purposes of this demo.
    function toggleMyHoverPseudoClass(target, add){
      for (let node = target; node.classList; node = node.parentNode)
        add ? node.classList.add("_my_hover") : node.classList.remove("_my_hover");
    }        

    const MouseoveroutController = {
      target: null,
      tryToDispatchMouseover: function (newTarget) {
        if (MouseoveroutController.target === newTarget)
          return;
        if (MouseoveroutController.target) {
          toggleMyHoverPseudoClass(MouseoveroutController.target, false);      //added this line
          const oldTarget = MouseoveroutController.target;
          setTimeout(function () {
            const mouseoverEvent = new MouseEvent("my-mouseout", {composed: true, bubbles: true});
            Object.defineProperty(mouseoverEvent, 'relatedTarget', {value: newTarget});
            oldTarget.dispatchEvent(mouseoverEvent);
          }, 0);
        }
        if (newTarget) {
          toggleMyHoverPseudoClass(newTarget, true);                           //added this line
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
      }
    };
    window.addEventListener("mousemove", MouseoveroutController.mousemove);
  })();

  window.addEventListener("my-mouseover", e => console.warn(e.type, e.target, e.relatedTarget));
  window.addEventListener("my-mouseout", e => console.warn(e.type, e.target, e.relatedTarget));
</script>
``` 

### HoverController

Another approach is to add the `:hover` pseudo-class to an element when a `mouseover` event targets that element or one of its descendants. The `:hover` pseudo class is then removed when a `mouseover` event would no longer have that element in its propagation path (which can be observed from a `mouseout` event on the element whose `relatedTarget` is not the element itself or one of its descendants).

```html
<style>
  #inner {
    background: lightgrey;
    height: 100px;
  }
  /* These two selectors work. you can see that there are two more right than left borders.  */
  *:not(body):not(:root)._my_hover {
    border-right: 5px solid orange;
  }
  :not(mumbojumbo)._my_hover {
    opacity: 1;
    border-left: 5px dashed blue;
  }
  /* In this controller, these two work*/
  *._my_hover {
    border-bottom: 10px dotted red;
  }
  ._my_hover {
    border-top: 10px dotted green;
  }
</style>

<div id="div">
  outer
  <div id="inner">inner</div>
</div>

<script>
  (function () {

    const HoverController = {
      onMouseout: function (e) {
        for (let loosingHover of e.composedPath())
          loosingHover.classList && loosingHover.classList.remove("_my_hover");
      },
      onMouseover: function (e) {
        for (let gainingHover of e.composedPath())
          gainingHover.classList && gainingHover.classList.add("_my_hover");
          //adding a class for the same pseudo class is simply ignored when done multiple times in a row.
      },
    };
    window.addEventListener("mouseover", HoverController.onMouseover);
    window.addEventListener("mouseout", HoverController.onMouseout);
  })();
</script>
```

## References

 * 
