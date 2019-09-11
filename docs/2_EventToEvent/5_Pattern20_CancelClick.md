# Pattern: CancelTheNonCancelable

> And think the unthinkable.

## Non-cancelable `click`s

`click` is a composed event. `click` is made by a pair of either `mousedown`+`mouseup` or `touchstart`+`touchend` events that are done in sequence on the same DOM element. As a composed event, `click` is one (of potentially several) `defaultAction`s for the `mousedown`+`mouseup` and `touchstart`+`touchend` events.

As a defaultAction, `click` events should be fairly simple to cancel: just call `preventDefault()` from `touchstart`, `touchend`, `mousedown`, or `mouseup`. But alas, it is not so:

### Non-cancelable mouse clicks

Calling `.preventDefault()` on `mousedown` and `mouseup` does *not stop* subsequent `click` events. This is abnormal behavior: all other native composed events are cancelled using `preventDefault()`, asfaik. I suspect this is due to legacy logic from HTML in the 1990's, a legacy that must persist in order not to break existing web pages that calls `preventDefault()` on `mousedown` or `mouseup` to stop for example text selection, but that relies on `click` events passing through unhindered.

To further complicate the issue, it is impossible to:
 * gauge whether or not a `click` event will be dispatched from within a `mouseup` event listener, or
 * see if a particular `mouseup` event triggered the `click`.
 
This means that there is *no way* to safely cancel a `click` from a 

 * The spec states that both `touchstart` and `touchend` are `cancelable`. And so calling `.preventDefault()` from the touch events often work. 
 
 * But, Chrome can sometimes make `touchstart` and `touchmove` events non-cancelable (cf. [PassiveAggressiveTouchstart](../6_TouchGestures/Pattern_PassiveAggressiveTouchstart)). And when that happens, calling `.preventDefault()` on `touchstart` and `touchend` will still let the subsequent `click` event occur. ((todo max a) is `touchend` is always `cancelable: true` in Chrome? even when their `touchstart` sibiling is cancelable: false? and b) verify that preventDefault() doesnt stop `click`, while letting other events through. ))
 

 * Setting `pointer-events: none` does not work on mouse-induced `click` events. ((todo max: check if setting `pointer-events: none or touch-action: none` blocks `click`s from `touchstart/touchend`))

Thus, to cancel `click` events from a) mouse events and b) non-cancelable touch event in Chrome, we therefore need an alternative technique: CancelTheNonCancelable.

## HowTo: CancelTheNonCancelable

The next best thing to preventing `click` events from occurring, is to stop their propagation and defaultAction as soon as possible. We need to a) intercept them as *early as possible* and b) stop them. And we need to do this either *once* or *for a limited period*.

To add an event listener we use an EarlyBird event listener on the `window`. We then remove this event listener from within itself after it has been called once, or we remove it manually when we no longer needs to block the event. Finally we then `.stopPropagation()` and `.preventDefault()` on the event.

> Att!! Use `stopPropagation()`, not `stopImmediatePropagation()`. If, for some reason, this `cancelClickOnce()` is called twice, `stopPropagation()` will work just fine, while calling `stopImmediatePropagation()` will cause the next unrelated `click` event to be canceled too. 

> See the EarlyBird pattern for more information.

Below is a `cancelEventOnce("click")` that will cancel *one* instance of a specific type of event.

```javascript
function cancelEventOnce(type) {
    const oneTimer = function (e) {
      e.stopPropagation();
      e.preventDefault();
      window.removeEventListener(type, oneTimer, true);
    };
    window.addEventListener(type, oneTimer, true);
  }
```

## Example 1: CancelClickOnce

<code-demo src="demo/CancelClickOnce.html"></code-demo>

## Example 2: `touchend.preventDefault()`

```html
<h1>Hello world! touchstart.preventDefault()</h1>
<h2>Hello sunshine! touchend.preventDefault()</h2>
<div style="height: 200vh">I am scrollspace</div>

<script >
window.addEventListener("touchstart", e => console.log(e.type, e.cancelable));
window.addEventListener("touchend", e => console.log(e.type, e.cancelable));
document.querySelector("h1").addEventListener("touchstart", e => e.preventDefault());
document.querySelector("h2").addEventListener("touchend", e => e.preventDefault());
</script>
```

<code-demo src="demo/CancelClickOnce.html"></code-demo>

## Overview of native, non-cancelable, composed events 

1. `click` from `mousedown`, `mouseup`. This `click` events can only be stopped using CancelTheNonCancelable pattern.

2. `click` from passive `touchstart`. This `click` event *can be* stopped calling `preventDefault()` from the corresponding `touchend` event. ((todo max verify this claim))

3. `selectstart` from a long-press gesture/`touchstart` event in Chrome. The `selectstart` event can be blocked using the CSS property `user-select: none` on for example the `window` or the target from within the `touchstart` event listener.

4. `contextmenu` from a long-press gesture/`touchstart` event in Chrome. This event can and will be stopped using `.preventDefault()` from within a `touchstart` listener, but this has two drawbacks: 1) it doesn't work if the `touchstart` event is non-cancelable in Chrome, and 2) calling 
 * touch-echo-mouse events (cf. Problem: [TouchEchoMouse]()).

## References

 * [MDN: `preventDefault()`](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
 * [Stackoverflow: cancelClick](https://stackoverflow.com/questions/17441810/pointer-events-none-does-not-work-in-ie9-and-ie10#answer-17441921)
 * [CSS-tricks: pointer-events](https://css-tricks.com/almanac/properties/p/pointer-events/)