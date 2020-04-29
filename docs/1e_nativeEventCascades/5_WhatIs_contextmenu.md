# WhatIs: `contextmenu`?

When you right-click or long-press on an element using a pointer device or press a contextmenu button on the keyboard, you will trigger the contextmenu event cascade. The trigger event for the function controlling this event is either:
 * `mousedown` or
 * `keypress`.
 
When the browser receives an appropriate trigger event, it will:
1. dispatch a `contextmenu` event, and then
2. either:
   * show you the context menu, or 
   * dispatch an `auxclick` event if `.preventDefault()` has been called on the `contextmenu` event.

## Demo: contextmenu

```html
<h1>Right click me!</h1>
<div>Right click me (no context menu)</div>

<script>
  (function () {
    window.addEventListener("mousedown", e => console.log(e.type));
    window.addEventListener("contextmenu", e => console.log(e.type));
    window.addEventListener("auxclick", e => console.log(e.type));

    const div = document.querySelector("div");
    div.addEventListener("contextmenu", e => e.preventDefault());
  })();
</script>
```       

Description of demo

## Demo: ContextMenuController

In the demo below a function `ContextMenuController` essentially recreates the logic of the `contextmenu` event cascade. The demo:

1. completely blocks all the native `contextmenu` events. 
2. then it adds a function `ContextMenuController` that listens for `mousedown` and `keydown` events.
3. The `ContextMenuController` filters the trigger events to only respond to:
   * right-button `mousedown` and
   * meta-key `keydown` events.
4. Once the `ContextMenuController` receives an appropriate trigger event, it
   1. creates a new `my-contextmenu` event,
   2. queues the first task of dispatching the new event in the event loop,
   3. queues the second task of showing a poor excuse for a context menu in the event loop, and
   4. updates the `.preventDefault()` of the `my-contextmenu` event object, so that if someone calls `.preventDefault()` on it, this will cancel the the second task of showing the context menu.    

* If you press on the header "Right click (no context menu)", an event listener will call `.preventDefault()` on the `my-context-menu` event.   
* If you press on the text "Right click here will show context menu", you will see a poor excuse for a context menu.   

```html
<body style="touch-action: none;">
<h1>Right click me!</h1>
<div>Right click me (no context menu)</div>

<script>
  (function () {

    //1. block all contextmenu events and stop their default actions
    window.addEventListener("contextmenu", e => e.preventDefault(), true);

    const ContextmenuController = {
      onMousedown: function (mousedownEvent) {
        if (mousedownEvent.button === 2)
          ContextmenuController.triggerContextMenu(mousedownEvent);
        else if (mousedownEvent.button === 1/*and this mouse only has a primary mouse button*/) 
          //setTimeout to trigger the contextmenu on long press
          //cancel timeout if the mouseup is given before this time.
          ContextmenuController.triggerContextMenu(mousedownEvent);
      },
      onTouchstart: function (mousedownEvent) {
        if (onlyOne)
          this.triggerContextMenu(mousedownEvent);
        if (mousedownEvent.button === 1/*and this mouse only has a primary mouse button*/) 
          //setTimeout to trigger the contextmenu on long press
          //cancel timeout if the mouseup is given before this time.
          ContextmenuController.triggerContextMenu(mousedownEvent);
      },
      onKeydown: function (keydownEvent) {
        if (keydownEvent.key === "meta key wtf?")
          ContextmenuController.triggerContextMenu(keydownEvent);
      },
      triggerContextMenu: function (triggerEvent) {
        setTimeout(function () {
          const myContextMenuEvent = new MouseEvent("my-contextmenu", {
            composed: true,
            bubbles: true,
            cancelable: true
          });
          triggerEvent.target.dispatchEvent(myContextMenuEvent);
          if (!triggerEvent.defaultPrevented) {
            alert("this is a bad excuse for a context menu..");
          } else {
            const myAuxclickEvent = new MouseEvent("my-auxclick", {composed: true, bubbles: true});
            triggerEvent.target.dispatchEvent(myAuxclickEvent);
          }
        });
      }
    };
    window.addEventListener("mousedown", ContextmenuController.onMousedown, true);
    window.addEventListener("touchstart", ContextmenuController.onTouchstart, true);
    window.addEventListener("keydown", ContextmenuController.onKeydown, true);

    window.addEventListener("mousedown", e => console.log(e.type));
    window.addEventListener("keydown", e => console.log(e.type));
    window.addEventListener("touchstart", e => console.log(e.type));
    window.addEventListener("my-contextmenu", e => console.log(e.type));
    window.addEventListener("my-auxclick", e => console.log(e.type));

    const div = document.querySelector("div");
    div.addEventListener("my-contextmenu", e => e.preventDefault());
  })();
</script>
</body>
```    

## References

 * dunno
