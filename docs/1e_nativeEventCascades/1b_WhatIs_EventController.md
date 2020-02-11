# WhatIs: an EventController?

An event cascade doesn't just magically appear. Somewhere in the browser a function of some kind must start and control it. We call this function an "event controller".

EventControllers manage one, two or more steps in the event cascade. The event controller is the function that evaluates:
1. *if* an event should be dispatched,
2. the `target` of the event, 
3. settings and properties of the event, and
4. if any other actions should be performed *before*, *after*, or *between* events. 

## The flow of control in an event controller

An event controller runs as follows:

1. A trigger event is passed to the controller *before* the event propagates. For example, a `mousemove` event is passed to a native `drag`-events controller.
2. The controller queries a) the target element, b) path elements, and/or c) other elements in the DOM for relevant settings/controls. For example, the event controller checks to see if there is a `draggable="true"` attribute associated with the target of an ancestor element in the propagation path. Sometimes, the data from the DOM is not needed (cf. `auxclick`).
3. The controller then checks any previous events it has cached for relevant information. For example, the controller compares the position of the preceding `mousedown` event with the position of the current `mousemove` event. 
4. The controller then uses this contextual data to:
   1. change its own state (such as becoming more or less active),
   2. find the targets for its subsequent actions/events (such as the `<details>` element to be opened if a `<summary>` is `click`ed or the next target to be `.focus()`ed), and/or
   3. adjust the controller's response, ie. alter its actions/events (such as `scroll-behavior: smooth` or `touch-action: pinch-zoom`).

```             
                [register of
                 previous events]
                  ^      v
trigger event => event controller => action/new event.
                  |      ^
                  v      |
                 target element
                   - path element
                      - other DOM elements  
```

## Demo: ContextmenuController

In this demo we mirror the behavior of the native EventController for `contextmenu` et.al. The contextmenu needs to listen for the `mousedown` event as its trigger and then queues a task in the event loop that will:
1. dispatch a `my-contextmenu` event, and then 
2. depending on whether `.preventDefault()` has been called on the `my-contextmenu` event choose whether to:
   * show the context menu or 
   * dispatch a `my-auxclick` event.

```html
<h1>Right click me!</h1>
<div>Right click me (no context menu)</div>

<script>
  (function () {

    //1. block all contextmenu events and stop their default actions
    window.addEventListener("contextmenu", e => e.preventDefault(), true);

    const ContextmenuController = {
      onMousedown: function (mousedownEvent) {
        if (mousedownEvent.button !== 2)
          return;

        setTimeout(function () {
          const myContextMenuEvent = new MouseEvent("my-contextmenu", {
            composed: true,
            bubbles: true,
            cancelable: true
          });
          mousedownEvent.target.dispatchEvent(myContextMenuEvent);
          if (!myContextMenuEvent.defaultPrevented) {
            alert("this is a bad excuse for a context menu..");
          } else {
            const myAuxclickEvent = new MouseEvent("my-auxclick", {composed: true, bubbles: true});
            mousedownEvent.target.dispatchEvent(myAuxclickEvent);
          }
        });
      }
    };
    window.addEventListener("mousedown", ContextmenuController.onMousedown, true);

    window.addEventListener("mousedown", e => console.log(e.type));
    window.addEventListener("my-contextmenu", e => console.log(e.type));
    window.addEventListener("my-auxclick", e => console.log(e.type));

    const div = document.querySelector("div");
    div.addEventListener("my-contextmenu", e => e.preventDefault());
  })();
</script>
```

## References 