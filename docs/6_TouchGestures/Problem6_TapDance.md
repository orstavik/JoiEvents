# Problem: TapDance

You are about to add your own touch based gestures. Nice! How your users will be able to use their
fingers to control custom behaviors in your app like if it's a flat screen mechanical apparatus. 
This is going to be so much fun!

But. There is one little problem we must fix first. And that is the conflict between
your app's custom interpretation of the your custom gesture and the browsers' builtin interpretation
of native touch gestures such as drag-to-scroll and double-tap-to-zoom.
More precisely, your problem is: 
**how do I control the native touch-based gestures during 
the dynamic creation and interpretation of my custom, touch-based gesture?**

Its time for the TapDance!

## Step 1: `touch-action`

Modern browsers have implemented a CSS property called 
[`touch-action`](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action).
This CSS property enables you to control native, touch-based gestures in different parts of the DOM:
specifying `touch-action: pan-x` on a branch of the DOM specifies that you can scroll left-right
with your finger, but no other native gestures such as vertical scrolling, pinch-to-zoom or double-tap
will have any effect.

`touch-action` is a **restrictive** CSS property: the *restrictions* cascade, not the permissions. 
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

The first step is concluded, put your right foot forward.

## Step 2: no `touch-action` in `touchstart`

`touch-action` sounds good. To control native touch gestures *dynamically*, on-demand-only, 
all we have to do is add `touch-action` restrictions high up in the DOM, 
such as on the `<body>` element, when our custom trigger function is activated. 
Except that it doesn't work! 

<script async src="//jsfiddle.net/orstavik/nheLpx3y/29/embed/result,html/"></script>

The [spec]() states that once the initial `touchstart` event has been triggered, 
the CSS properties of `touch-action` have already been read and locked down for the current 
native gesture. And that means that when we want to control the native gestures *dynamically*
(ie. when our `touchstart` trigger function has been called), 
changing `touch-action` properties will have no effect on the ensuing `touchmove` and `touchend` 
events until *after* the native gesture potentially triggered has ended. 
So, CSS `touch-action` is useless for dynamic control of touch events.

Second step: right foot back again.

## Step 3: no `.preventDefault()` in `pointerdown`

[Pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
is a native MergedEvent of touch and mouse. It is not supported by Safari, but
using the PeP polyfill it provides the developer with a viable alternative for writing
pointer management seamlessly for both mobile and desktop.
As the pointer events are doubling for their triggering touch events, one should expect that
calling `.preventDefault()` on the pointer events would block their corresponding native gestures.

<script async src="//jsfiddle.net/orstavik/L0fr2nuh/5/embed/result,html/"></script>

However, they don't. When the browsers make their native, merged pointer events, they do not map the
`.preventDefault()` in the MergedEvent to the `.preventDefault()` in the trigger event.
That means that if you want to use a single event listener for both mouse and touch using a pointer event,
you can do so, but only up to the point when you need to call `.preventDefault()`.
At that point native, merged pointer events will fail you.

> Merging events without binding `preventDefault()` is not painful for the browser.
> However, it is a bit painful for the developers.
>  * First the developer is told he can control mouse and touch from a single event;
>  * then he makes a single pointer event listener function;
>  * then he finds out that the pointer event is not really encompassing the triggering touch event as it
>    lacks access to the touch event's `.preventDefault()`; and 
>  * so then the developer must backtrack again and add additional event listeners for the triggering 
>    touch events again.
> MergedEvents should map to the trigger event's `.preventDefault()`, not only their other values.
> Not mapping `.preventDefault()` in MergedEvents will set the developer up for disappointment.

Third step is left foot back.

## Step 4: passive-aggressive `touchstart` in Chrome

So, how do I control native touch gestures dynamically?
Why, just call `.preventDefault()` on `touchstart`. That should do it!

<script async src="//jsfiddle.net/orstavik/46vhLstn/3/embed/result,html/"></script>

However, this doesn't work either. In Chrome, event listeners on `touchstart` and 
`touchmove` are "passive by default". "Passive wtf?!" you might ask. 
"Passive event listeners" is webspeak for "event listeners that disable `.preventDefault()`". 
"But *why* passive wtf?" you might ask again. 
That is a long story, so I will explain it in a [separate chapter](Problem7_WebDemocracy).

In any case, forth step is to place the left foot forward but *on the right side* of the right foot, 
crossing your legs.

## Step 5: HowTo `.preventDefault()` in `touchstart` everywhere

We still have no control. Dynamically. But. Maybe there is hope. Can we make `.preventDefault()` 
work in `touchstart` in Chrome? Dynamically?

Yes we can. In Chrome, we just have to add a `touchstart` event listener with 
a `{passive: true}` third argument. 
```javascript
window.addEventListener("touchstart", function(e){e.preventDefault();}, {passive: true, capture: true});
```

But, wait! That doesn't work in older browsers that only accepts a boolean third argument. 
Passive event listeners and EventListerOptionObjects as third argument for `addEventListener(...)`
are *both* new. So, we must add a feature check for EventListenerOptions. Like so.

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
var thirdArg = supportsPassive ? {passive: true, capture: true}: true;
window.addEventListener("touchstart", function(e){e.preventDefault();}, thirdArg);
```
It works!

The last dance move is the pivot 180deg so as to uncross your legs.
You now face in the reverse direction, and can repeat the dance from beginning.

## Summary

To sum up:
1. **Statically**, ie. *before* and *regardless* of your own dynamic events,
   you can block `touch-action` in many different ways:
   `pinch-zoom`, `manipulation`, `pan-x`, pan-this, pan-that, pan-this-that-and-the-other.
2. **Dynamically**, you can only block native default touch actions using `.preventDefault()` on
   the `touchstart` event.
3. Therefore, dynamically, you can only block *all* native default touch actions. 
   It is all or nothing, all or `touch-action: none`. 
4. You have to add a supportsPassive feature check.
5. Safari doesn't support pointer events.
6. Because pointer events are not globally supported and do not support `.preventDefault()`,
   my advice is to skip pointer events completely when composing your own dynamic DOM Events
   from native touch and mouse events.

## References

 * 