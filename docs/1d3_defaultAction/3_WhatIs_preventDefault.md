# WhatIs: `.preventDefault()`

`.preventDefault()` stops the default action associated with an event. For example, calling `.preventDefault()` on the `contextmenu` event will stop the browser from displaying the native context menu when the user for example right click on an element.

The principal difference between `.stopPropagation()` and `.preventDefault()` is that:
1. `stopPropagation()` halts the inner cycle of event propagation, without affecting the outer cycle of the EventCascade, and 
2. `preventDefault()` stops an event in the outer cycle of the EventCascade from triggering its default actions, without affecting the current, ongoing inner cycle of event propagation.

Conceptually, `.preventDefault()` is like a scissor that once-and-for-all will cut the ties between an event and its ensuing action(s).
``` 
     ↱queue -- x
   prop(A)     x    run(B)
   ↓    ↑      ↑
 cap    bub    ↑         
   ↳tar ⮥     ↑ 
      ↓       ↑
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
    window.addEventListener("auxclick", e => console.log(e.type));

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
auxclick
```

## Non-`cancelable` events

Some events cannot be called `.preventDefault()` on. These events have their `cancelable` property set to `false`. Event cascades that flow from such events are essentially unstoppable/unpreventable. `mousedown` is one such event.

```html
<h1>Right click me!</h1>

<script>
  //trying to stop the event cascade from mousedown, but it doesn't work.
  window.addEventListener("mousedown", e => e.preventDefault());
</script>
```      

Result:
```
mousedown
contextmenu
//show context menu
```

Most events are `canceable: true`, but some are not. When working with event cascades and EventControllers, you need to be aware of this distinction and check each event for this feature.
 
## References

 * [mdn: preventDefault]()