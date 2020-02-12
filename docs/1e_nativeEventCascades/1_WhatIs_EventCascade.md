# WhatIs: EventCascade

Very often, one event will *trigger* another subsequent event or action. For example: when a `mouseup` event occurs, it triggers a `click` event (most of the time). And if that `click` event occurs on a checkbox, this will cause the checkbox to flip state. It's a domino-effect: the `mouseup` triggers a `click` that triggers an action `checkbox.checked =! checkbox.checked`. This domino-effect we call an "event cascade".  

## Demo: contextmenu event cascade

To understand how event cascades work, we look at an example: the contextmenu event cascade. The contextmenu event cascade involve *several* events (`mousedown`, `contextmenu`, and `auxclick`) and an action (`show context menu`). If you right-click on an element, then the browser will first dispatch a `mousedown` event, then a `contextmenu` event, and then show you the context menu. The showing of the contextmenu will distort the focus of the document, so that no `auxclick` event will be fired. But, if you call `preventDefault()` on the `contextmenu`, the browser will not show the context menu, and a subsequent `mouseup` event will trigger the dispatch of an `auxclick` event.

```                                  
mousedown event 
    ↓ 
contextmenu → show context menu action
          ↓ or
         mouseup event      
          ↓
         auxclick event      
```

1. The user triggers `mousedown`.
2. The browser sees that it is a right-click `mousedown` and triggers a `contextmenu` event.
3. The browser then sees the `contextmenu` and then 
4. runs the `show context menu` action (if `.preventDefault()` has not been called on the `contextmenu` event).
5. If `.preventDefault()` has been called on the `contextmenu` event, then the browser's focus will not be disturbed and the browser will dispatch an `auxclick` event on the next `mouseup` event.   

> Note. Whenever `.preventDefault()` *can be triggered*, the browser always makes a *choice*: *to run*, or *not to run* the default action. The `contextmenu` is a very good example of this choice as the side-effect of running the default action is to block the dispatch of an `auxclick` event that otherwise would have run.

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

## Native event cascades

In this chapter we will present a series of native events that illustrate several patterns the browser use in its event controllers.

1. Contextmenu: `mousedown` → `contextmenu` → show context menu
2. Keypress: `keydown` → `keypress`
3. Focus: `mousedown`/`keydown` → `focusout`+`blur` → set focus → `focusin`+`focus`
4. Drag:
5. WheelScroll:
6. DoubleClick:
7. Input: 
8. Change:
9. Form events: Submit and Reset:
  

## References

 * [Smashing: EventCascade](https://www.smashingmagazine.com/2015/03/better-browser-input-events/)
