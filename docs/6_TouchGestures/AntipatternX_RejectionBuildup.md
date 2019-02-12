# Anti-pattern: RejectionBuildup

> It's not you. It's the browsers.

Add

You are about to add your own touch based gestures. Nice! How your users will be able to use their
fingers to control custom behaviors in your app like if it's a flat screen mechanical apparatus. 
This is going to be so much fun!

But. There is one little problem we must fix when we do that. And that is the conflict between
your app's custom interpretation of the your custom gesture and the browsers' builtin interpretation
of native touch gestures such as drag-to-scroll and double-tap-to-zoom.
More precisely, your problem is: 
how do I control the native touch-based gestures during 
the creation and interpretation of my custom, touch-based gesture?

Its time to learn the TapDance!

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
Except. That doesn't work! 

<script async src="//jsfiddle.net/orstavik/nheLpx3y/29/embed/result,html/"></script>

The [spec]() states that once the initial `touchstart` event has been triggered, 
the CSS properties of `touch-action` have already been read and locked down for the current 
native gesture. And that means that when we want to control the native gestures *dynamically*,
that is when our `touchstart` trigger function has been called, 
changing `touch-action` properties will have no effect on ensuing `touchmove` and `touchend` events,
until *after* the native gesture potentially triggered has ended. 
So, CSS touch-action is useless for dynamic control of touch events.
Second step: right foot back again.

## Step 3: no `.preventDefault()` in `pointerdown`

[Pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
is a native MergedEvent of touch and mouse. It is not supported by Safari, but
using the PeP polyfill it provides the developer with a viable alternative for writing
pointer management seamlessly for both mobile and desktop.
As the pointer events are doubling for their triggering touch events, one should expect that
calling `.preventDefault()` on the pointer events would block their corresponding native gestures.

<script async src="//jsfiddle.net/orstavik/L0fr2nuh/5/embed/result,html/"></script>

However, they don't. Making the native, merged pointer events, the browsers do not link the
`.preventDefault()` in the MergedEvent with the `.preventDefault()` in the trigger event.
That means that if you want to use the merged event to manage both mouse and touch with the same
event listener, but you also need to call `.preventDefault()` on the browsers mouse and/or touch defaultAction,
you have to also add event listeners for the triggering mouse and/or touch events too.

This is not painful for the browser, but it is a bit painful for the developers:
First the developer is told he can control mouse and touch from a single event;
then he makes a single pointer event listener function;
then he finds out that the pointer event is not really encompassing the triggering touch event as it
lacks access to the touch event's `.preventDefault()`; and 
so the developer must backtrack again and add additional event listeners for the triggering touch 
events again.
Making MergedEvents that doesn't map to the `.preventDefault()` of the triggering event is
setting the developer up for disappointment.

Third step is left foot back.

## Step 4: passive-aggressive `touchstart` in Chrome

So, how do I control native touch gestures dynamically?
Why, just call `.preventDefault()` on `touchstart`. That should do it!

<script async src="//jsfiddle.net/orstavik/46vhLstn/3/embed/result,html/"></script>

However, this doesn't work either. In Chrome, event listeners on `touchstart` and 
`touchmove` are "passive by default". "Passive wtf?!" you might ask. 
A "passive event listener" is just webspeak for "an event listener in which `.preventDefault()` 
doesn't work". "But.. Why??" you might continue. Well, that I will explain below.

In any case, forth step is to place the left foot next to and *on the right side* of the right foot, 
so your legs are crossed.

## Step 5: HowTo `.preventDefault()` in `touchstart` everywhere

We still have no control. Dynamically. But. Maybe there is hope. Can we make `.preventDefault()` 
work in `touchstart` in Chrome? Dynamically?

Yes, it is simple. In Chrome, we just have to add a `touchstart` event listener with 
a `{passive: true}` third argument. But, that doesn't work in older browsers that only accepts the
boolean third argument. So, to do so requires a not so simple EventListenerOption feature check.
Like this:

```javascript
var supportsPassive = false;
try {
  var opts = Object.defineProperty({}, 'passive', {
    get: function() {
      supportsPassive = true;
    }
  });
  window.addEventListener("test", null, opts);
} catch (e) {}
var thirdArg = supportsPassive ? {passive: true, capture: true}: true;
window.addEventListener("touchstart", function(e){e.preventDefault();}, thirdArg);
```
It works! The last dance move is the pivot 180deg and repeat the other way round.

which in 

Web developers in the west might think the web has been 

to scroll quicker and become more
responsive on 
After some deliberations, you get an idea. 
Stripped of all your confidence and filled with self-consciousness after two rejections, 
you try to discretely robot and moon-walk your way over to your ex-girlfriend at the other side 
of the room. Ohh... The self-doubt installed in you after the two previous rejections makes you
monitor your every limb, which breaks your rythm and flow horribly.. Ohh.. I hope she has forgotten 
that I told her she wasn't as cool as the pointer sisters during the breakup.. 
Hopefully she will dance with me, if only out of pity and to show me this once that I was wrong to 
dump her...

Third, you add an event listener for `touchstart`, whose sole purpose is to control the native touch
events by calling `.preventDefault()` on that event. 
`window.addEventListener("touchstart", function(e){e.preventDefault();});`
You still plan to use all your new pointer event listeners for all your other code, but 
you must add this one extra listener for `touchstart` because it is the only place where you can 
block the defaultAction of touch events dynamically.

<script async src="//jsfiddle.net/orstavik/46vhLstn/3/embed/result,html/"></script>

 - left foot behind your right foot

It doesn't work! She is snubbing you.. You hit rock bottom. You have noone. You are nobody.
You want to go and die in a corner.
But you don't. Because you have prior experience being shameless. You know how to navigate out of the
field. Persistance. Stay in the game at all cost. Gravel. Beg!

And, this is how you beg.
```javascript
var supportsPassive = false;
try {
  var opts = Object.defineProperty({}, 'passive', {
    get: function() {
      supportsPassive = true;
    }
  });
  window.addEventListener("test", null, opts);
} catch (e) {}
```
You add this code to the top of your page, and you are up and running again.



It works! Phew.. Saved by your ex-girlfriend. She isn't that bad after all.. 
You suddenly get filled with nostalgia and think about how nice you two actually had it.
What was it that bugged you about touch events? After all, it wasn't that many times you really
had to combine mouse and touch, now was it? 
And then you see that mr. Safari is dancing with her also. That's a cool guy. At least he thinks so
himself. "Maybe this is why he doesn't like the pointer sisters", you say to yourself 
while you try to act normal and dance the evening away. 
                                                             
When you get home, you try to summarize the evening:
1. *Dynamically*, you can only block native default touch actions using `preventDefault()` on
   the `touchstart` event. 
2. Therefore, *dynamically*, you can only block *all* native default touch actions. 
   It is all or nothing, all or touch-action none. 
3. Statically, you can block touch actions in many different ways:
   pinch-zoom, manipulation, pan-x, pan-this, pan-that, pan-this-that-and-the-other.
4. Safari doesn't dance with the pointer event sisters.

Ok. When composing DOM Events dynamically, the rules are:
 * use touch events, not pointer events, and
 * call `preventDefault()` on `touchstart` to block all native touch gestures.

## References