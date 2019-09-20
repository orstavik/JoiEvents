# Pattern: PassiveAggressiveTouchstart

Touch-based gestures are nice. They can turn a flat screen into a mechanical apparatus:
dials, levers, buttons, cogwheels, pulleys, you name it!

And, what's more. To invent the mechanical mechanism is fairly simple. There is just ooooone little
problem: your custom gesture keeps running into conflict with the browsers' builtin, native gestures.
Your clever vertical lever makes the browser drag-to-scroll; and when you double-tap to activate
your radio dial, you simultaneous double-tap-to-zoom.

So, how can we **control native touch-based gestures** in our composed, custom events?

## Problem: passive `touchstart` in Chrome

The common solution to prevent the browsers' defaultActions that follow an event is to call
`.preventDefault()`. To block native touch gestures therefore should be accomplished by calling
`.preventDefault()` in a `touchstart` listener.

<code-demo src="demo/CantPreventTouchstart.html"></code-demo>

But. This doesn't work. In Chrome, event listeners on `touchstart` and `touchmove` 
are "passive by default". "Passive wtf?!" you might ask. 
"Passive event listeners" is webspeak for "event listeners that disable `.preventDefault()`". 
"But *why* passive wtf?" you might ask again. 
That is a long story I discuss in a [chapter about web democracy](Problem7_WebDemocracy),
but for now, we simply see that we have to do something other than call `.preventDefault()`
in our `touchstart` and `touchmove` listeners.

## WhatIs: `touch-action`

[`touch-action`](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action) 
is a fairly new CSS property that controls native, touch-based gestures.
If you specify `touch-action: pan-x` on a branch in the DOM, this will allow you to scroll left-right, 
but block all other native gestures such as vertical scrolling, pinch-to-zoom or double-tap-to-zoom.

`touch-action` is a **restrictive** CSS property: it is the *restrictions* that cascade, 
not the permissions. We can see this in the example below.

```html
<div>
  <h1>Scrolling! But only horizontally.</h1>
  <h2>NO scrolling! Neither horizontally nor vertically.</h2>
</div>
<style>
div {
  touch-action: pan-x;
}
h2{
  touch-action: pan-y;
}
</style>
```

## Mirage: `touch-action: none` does not work in `touchstart`

When we control native touch gestures *dynamically*, on-demand-only, 
we have the luxury of adding `touch-action` restrictions high up in the DOM.
If we know that we are going to remove the `touch-action` restrictions soon anyway, 
we might as well place them on the top, root `<html>` element: `document.children[0]`.

So. What if we:
1. make a custom touch-based gesture
2. with an initial trigger function on `touchstart` that
3. set `touch-action: none` on the `document.children[0]`. 

Will this block the native touch-based gestures from interfering?

<code-demo src="demo/CantTouchAtionNone.html"></code-demo>

Wrong! The [spec]() states that once the initial `touchstart` event has been triggered, 
the CSS properties of `touch-action` have already been read and locked down for the current 
native gesture. Changing the `touch-action` setting in a `touchstart` listener is *too late*.

This means that `touch-action` cannot be used to control native touch-based gestures *dynamically*
from a `touchstart` trigger function. Doing so will not produce an error, but it will have limited
effect: for example the browser will still drag-to-scroll as if nothing has happened.
So, CSS `touch-action` is useless for dynamic control of touch events.

## HowAbout: pointerevents?

[Pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
is a native MergedEvent of touch and mouse. 
(It is not supported by Safari, but there you can use the PeP polyfill).
As the pointer events provide an alternative front for our `touchstart` and `touchmove` events, 
maybe its possible to block native touch gestures by calling `.preventDefault()` in `pointerdown`
or `pointermove`?

And, what about `pointer-events`? `pointer-events` is a CSS property that works as an alternative 
front for `touch-action`. Will setting `pointer-events: none` in a `pointerdown` listener block
the native gesture?

<code-demo src="demo/CantPointerEventsNone.html"></code-demo>

No. `pointerdown` is just a shell front of `touchstart`. If we can't do it from `touchstart`, we can't
 do it from `pointerdown`. And the same goes for `touch-action` and `pointer-events`.

## Pattern: PassiveAggressiveTouchstart

We still have no control. Dynamically. We have to go back to start. 
Can we make `.preventDefault()` work in `touchstart` anyway and everywhere?

Yes, we can. In Chrome, we just have to add a `touchstart` event listener with 
a `{passive: false}` as the third argument: 

```javascript
window.addEventListener("touchstart", function(e){e.preventDefault();}, {passive: false, capture: true});
```

But, wait! That doesn't work in many older browsers that only accepts a boolean third argument. 
Passive event listeners and EventListerOptionObjects as third argument for `addEventListener(...)`
are *both* fairly new. So, we must add a feature check for EventListenerOptions. Like so.

```javascript
var supportsPassive = false;
try {
  var opts = Object.defineProperty({}, 'passive', {
    get: function() {
      supportsPassive = true;
    }
  });
  window.addEventListener("test", null, opts);
  window.removeEventListener("test", null, opts);
} catch (e) {}
var thirdArg = supportsPassive ? {passive: false, capture: true}: true;
window.addEventListener("touchstart", function(e){e.preventDefault();}, thirdArg);
```

<code-demo src="demo/PassiveAggressiveTouchstart.html"></code-demo>

It (finally) works!

## Summary

To sum up:
1. **Statically**, ie. *before* and *regardless* of your own dynamic events,
   you can block `touch-action` in many different ways:
   `pinch-zoom`, `manipulation`, `pan-x`, pan-this, pan-that, pan-this-that-and-the-other.
2. **Dynamically**, you can only block native touch gestures using `.preventDefault()` on
   the `touchstart` event.
3. Therefore, dynamically, you can only block *all* native default touch actions. 
   It is all or nothing. 
4. You have to add a supportsPassive feature check.
5. Safari doesn't support pointer events.
6. You can't do anything from pointer events you cannot also do from touch events.
7. In this book we therefore skip pointer events completely and compose our pointer gestures
   from touch and mouse events.

## References

 * 