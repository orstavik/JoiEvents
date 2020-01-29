# WhatIs: `.preventDefault()`

Put simply, `.preventDefault()` is **stop the default task associated with an event**, such as stopping the `show context menu` action from the `contextmenu` event.

The principal difference between `.stopPropagation()` and `.preventDefault()` is that:
1. `stopPropagation()` halts the inner cycle of event propagation, without affecting the outer cycle of the EventCascade, and 
2. `preventDefault()` stops the last event in the outer cycle of the EventCascade from triggering its default action, without affecting the current, ongoing inner cycle of event propagation.

Conceptually, `.preventDefault()` is like a scissor that once-and-for-all will cut the ties between an event and its ensuing action.
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
<h1>Right click me (contextmenu.preventDefault())</h1>

<script>
  const h1 = document.querySelector("h1");

  h1.addEventListener("mousedown", e => console.log(e.type));
  h1.addEventListener("contextmenu", e => console.log(e.type));

  h1.addEventListener("contextmenu", e => e.preventDefault());
</script>
```
Results:
```
mousedown
contextmenu
//does NOT show the context menu
```

## Demo: `.preventDefault()` doesn't block ensuing events

In this demo we try to call `.preventDefault()` on `mousedown`. Might this block the ensuing `contextmenu` event?

```html
<h1>Right click me (mousedown.preventDefault())</h1>

<script>
  const h1 = document.querySelector("h1");

  h1.addEventListener("mousedown", e => console.log(e.type));
  h1.addEventListener("contextmenu", e => console.log(e.type));

  h1.addEventListener("mousedown", e => e.preventDefault());
</script>
```
Results:
```
mousedown
contextmenu
//show context menu
```

As we see, `.preventDefault()` does not block a cascading event.
 
## References

 * [mdn: preventDefault]()