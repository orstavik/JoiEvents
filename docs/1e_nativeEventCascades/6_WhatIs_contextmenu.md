# WhatIs: `contextmenu`?

There are many ways to trigger the showing of a contextmenu in a web app:
1. right-click on an element using a mouse
2. long press using touch in android,
3. the contextmenu button or another keyboard shortcut command, or
4. use a combination of keyboard and pointer action. 

Different browsers implement different means to do this: smart phones do not have a mouse and therefore rely on a long-press, and apple desktop often do not have two mouse buttons. With the exception of long-press, none of the trigger events require any state when interpreting potential trigger events.

When the browser receives an appropriate contextmenu trigger event, it will:
1. dispatch a `contextmenu` event, and then
2. show the context menu if `.preventDefault()` has not been called on the `contextmenu` event.

Showing the context menu disturbs the focus in the DOM and thus blocks the running of other event controllers such as that for `auxclick`. When `.preventDefault()` is called on the `contextmenu` event, then the browser will dispatch an `auxclick` event on the next `mouseup` event, otherwise not.

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

## Demo: ContextMenuController

In this demo we will:
1. Completely block all the native `contextmenu` events.
1. Implement some of the trigger mechanisms (for now), and listen for:
    * right button press on `mousedown`, 
    * ctrl+ left button press on `mousedown`,
    * contextmenu botton press on `keydown`, and
    * long-press on `touchstart`.
1. Queue a single task in the event loop using `setTimeout(...)` that will dispatch a `my-contextmenu` event and then display a mock context menul, if not prevented.

Most of what is happening in this demo have already been displayed in previous chapters. But, one thing is new: the long-press from `touchstart` require some additional use of timers as well as an alteration in state in the event controller that needs to start listening for events that might break the long-press.


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
          this.triggerContextMenu(mousedownEvent);
        else if (mousedownEvent.button === 1/*and this mouse only has a primary mouse button*/) 
          //setTimeout to trigger the contextmenu on long press
          //cancel timeout if the mouseup is given before this time.
          this.triggerContextMenu(mousedownEvent);
      },
      onTouchstart: function (mousedownEvent) {
        if (onlyOne)
          this.triggerContextMenu(mousedownEvent);
        if (mousedownEvent.button === 1/*and this mouse only has a primary mouse button*/) 
          //setTimeout to trigger the contextmenu on long press
          //cancel timeout if the mouseup is given before this time.
          this.triggerContextMenu(mousedownEvent);
      },
      onKeydown: function (keydownEvent) {
        if (keydownEvent.key === "meta key wtf?")
          this.triggerContextMenu(keydownEvent);
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