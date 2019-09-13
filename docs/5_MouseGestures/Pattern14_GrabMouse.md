## Pattern: GrabMouse

> You know I'm automatically attracted to beautiful—I just start kissing them. It's like a magnet. Just kiss. I don't even wait. And when you're a star, they let you do it. You can do anything. Grab 'em by the pussy. You can do anything.
> 
>   From ["Donald Trump *Access Hollywood* tape"](https://en.wikipedia.org/wiki/Donald_Trump_Access_Hollywood_tape)

Sometimes, in the midst of an EventSequence, it can seem as if the mouse has got a will of its own. Its own behavior or default action that seem to come out of nowhere. It doesn't happen all the time. But near a certain type of elements, the mouse behaves funny: it starts to select text or show a contextmenu.

When you make an EventSequence for mouse, text selection and contextmenus are most often unwanted. You and the mouse seems to have different agendas: you are doing one thing, the mouse another. So, what do you do? You Trump it. You GrabMouse.

## HowTo: block the mouse's defaultAction

Here, we will describe how to block the mouse's agenda. You expect that the mouse's defaultActions can be stopped calling `.preventDefault()` from a `mousedown` or `mousemove` event listener. Not so, the ensuing text selection and context menu are Unstoppable (cf. StopTheUnstoppable pattern). Maybe via an HTML attribute. No again. The mouse's actions are more complex than that.

### No `selectstart`, please

Text selection and the `selectstart` event can be controlled with the CSS property [`user-select`](https://developer.mozilla.org/en-US/docs/Web/CSS/user-select). And, unlike `pointer-events` and `touch-action`, the `user-select` property *can be* set from within a `mousedown` event listener. 

This means that:
1. when a mouse button is pressed on a text element that would normally initiate a text selection sequence, and
2. a `mousedown` event listener sets `user-select: none` on the event's `target` element, then
3. text selection will be blocked.

Any EventSequence that does this, should cache the original setting of the `user-select` and reset it when the EventSequence ends or is cancelled.

> IE9: `user-select` is only supported by IE10. If you need to support IE9, you should employ the StopTheUnstoppable pattern on the `selectstart` event as I do on the `contextmenu` event below.

### No `contextmenu`, please

The context menu is the default action of the `contextmenu` event. So to stop the context menu action, we must stop the `contextmenu` event. But, the `contextmenu` event is Unstoppable. We cannot stop it by for example calling `preventDefault()` from `mousedown` or `mouseup`. So, then what do we do?

1. We add a temporary EarlyBird event listener for `contextmenu` at the `window` element in the `capture` phase from the `mouseup` event listener, that will a) call `stopPropagation()` and `preventDefault()` on the `contextmenu` event, ie. stop it.
2. Then, when the mouse EventSequence ends or is cancelled, we remove the temporary EarlyBird event listener.

> `contextmenu` only needs to be prevented for mouse EventSequences that react to the right mouse button.

## Naive implementation

```javascript
function stopEvent(e){                           
  e.preventDefault();
  e.stopImmediatePropagation ? e.stopImmediatePropagation() : e.stopPropagation();
}

var cachedUserSelect;

window.addEventListener("mousedown", function(e){
  cachedUserSelect = e.target.style.userSelect;
  e.target.style.userSelect = "none";
  window.addEventListener("contextmenu", stopEvent);
  window.addEventListener("selectstart", stopEvent);
});

window.addEventListener("mouseup", function(e){
  e.target.style.userSelect = cachedUserSelect;
  cachedUserSelect = undefined;
  window.removeEventListener("contextmenu", stopEvent);
  window.removeEventListener("selectstart", stopEvent);
});

window.addEventListener("mousecancel", function(e){
  e.target.style.userSelect = cachedUserSelect;
  cachedUserSelect = undefined;
  window.removeEventListener("contextmenu", stopEvent);
  window.removeEventListener("selectstart", stopEvent);
});
```

This implementation is naive because:
* it doesn't necessarily have the same target from the mousedown and mouseup events, 
* it doesn't consider which mouse button is pressed, and 
* it anticipates no other events in between.

## Demo: Naive `long-press` GrabMouse

This demo is naive because:
* it doesn't consider the `mousecancel` event, 
* it doesn't consider which mouse button is pressed, and 
* it anticipates no other events in between.

<code-demo src="./demo/long-press-GrabMouse.html"></code-demo>

## Lookahead: GrabTouch

The text selection behavior can be blocked using the same CSS `user-select` property from `touchstart`. Temporary EarlyBird event listeners for `selectstart` and `contextmenu` can also be added from `touchstart`, and then removed when the touch EventSequence completes.

## References

 * [MDN: `user-select`](https://developer.mozilla.org/en-US/docs/Web/CSS/user-select)