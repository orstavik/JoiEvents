# WhatIs: `.preventDefault()`

Put simply, `.preventDefault()` is **stop the default task associated with an event**, such as stopping the `show context menu` action from the `contextmenu` event.

The principal difference between `.stopPropagation()` and `.preventDefault()` is that:
1. `stopPropagation()` halts the inner cycle of event propagation, without affecting the outer cycle of the EventCascade, and 
2. `preventDefault()` stops an event in the outer cycle of the EventCascade from triggering its default actions, without affecting the current, ongoing inner cycle of event propagation.

Conceptually, `.preventDefault()` is like a scissor that once-and-for-all will cut the ties between an event and its ensuing action(s).
``` 
                ↱---- queue ----↴    ↱---- queue --x
trigger(A) ⇒ eval(A) ⇒ prop(A) ⇒ eval(B) ⇒ prop(B) x    run(C)
                       ↓    ↑              ↓    ↑    ↑
                     cap    bub          cap    bub  ↑         
                       ↳tar ⮥              ↳tar ⮥   ↑ 
                                               ↓     ↑
                                              .prevDef() 
```

## Demo: `.preventDefault()` and `contextmenu`

```html
<h1>Right click me!</h1>
<div>Right click me (no context menu)</div>

<script>
  (function () {
    window.addEventListener("mousedown", e => console.log(e.type));
    window.addEventListener("contextmenu", e => console.log(e.type));

    const div = document.querySelector("div");
    div.addEventListener("contextmenu", e => e.preventDefault());
  })();
</script>
```
Results if you right click on "Right click me (no context menu)":
```
mousedown
contextmenu
//does NOT show the context menu
```

## Demo: `.preventDefault()` doesn't block ensuing events

In this demo we try to call `.preventDefault()` on `mousedown`. Might this block the ensuing `contextmenu` event?

```html
<h1 id="one">Right click me (mousedown.preventDefault())</h1>
<h1 id="two">Right click me (contextmenu.preventDefault())</h1>

<script>
  const h1 = document.querySelector("h1");

  window.addEventListener("mousedown", e => console.log(e.type));
  window.addEventListener("contextmenu", e => console.log(e.type));
  window.addEventListener("auxclick", e => console.log(e.type));

  document.querySelector('#one').addEventListener("mousedown", e => e.preventDefault());
  document.querySelector('#two').addEventListener("contextmenu", e => e.preventDefault());
</script>
```
Results:
```
//right click on the first header
mousedown
contextmenu
//show context menu

//right click on the second header
mousedown
contextmenu
auxclick
```

As we see, `.preventDefault()` does not block a cascading event in neither situation. However, the `contextmenu` *chooses* between either calling its own default action or dispatching an `auxclick` event, ie. the default action being run blocks the alternative path of dispatching an `auxclick` event.
 
## Demo: ContextmenuController

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

As can be seen in the example above, the `ContextmenuController` chooses one of two paths:
 * the default action of showing an `alert(..)`, or
 * the dispatch of an `auxclick` event.
 
 Also worth noting is that the `my-contextmenu` event must be `cancelable` for the `.preventDefault()` to work.
 
## References

 * [mdn: preventDefault]()