# WhatIs: EventCascade

Very often, one event will *trigger* another subsequent event or action. For example: when a `mouseup` event occurs, it triggers a `click` event (most of the time). And if that `click` event occurs on a checkbox, this will cause the checkbox to flip state. It's a domino-effect: the `mouseup` triggers a `click` that triggers a `checkbox.checked =! checkbox.checked` action. And we call this domino-effect between events an EventCascade.  

## Demo: `contextmenu` event cascade

To understand how EventCascades work, we look at an example containing *three* events (`mousedown`, `contextmenu`, and `auxclick`) and an action (`show context menu`). If you right-click on an element, then the browser will first dispatch a `mousedown` event, then a `contextmenu` event, and then show you the context menu. If you call `preventDefault()` on the `contextmenu`, the browser will not show the context menu, but dispatch the `auxclick` event instead.

```                                  
mousedown event 
    ↓ 
contextmenu → show context menu action
          ↓ or
         auxclick event      
```

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

1. The user triggers `mousedown`.
2. The browser sees that it is a right-click `mousedown` and triggers a `contextmenu` event.
3. The browser then sees the `contextmenu` and then runs either:
   1. the `show context menu` action or
   2. dispatches an `auxclick` event (if `.preventDefault()` has been called on the `contextmenu` event).
   
> Sometimes, an event cascade dispatch multiple events and performs multiple actions, and sometimes an event cascade will *choose* between two or more different alternatives depending on whether `preventDefault()` has been called or some other setting. More on this later.

> a) the show context menu action and b) the dispatch of the `auxclick` event.    

## Native event cascades

In this chapter we will present a series of native events that illustrate several patterns the browser use in its event controllers.

1. Contextmenu: `mousedown` → `contextmenu` → show context menu/`auxclick`
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
