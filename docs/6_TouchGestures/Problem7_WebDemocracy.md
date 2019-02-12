# Problem: WebDemocracy

## Why passive-aggressive EventListeners?

Smooth, responsive scrolling is important. It makes the app look good. It is expected.
But, on mobile devices browsers have struggled to scroll smoothly. 
Cheap mobile phones has less power and speed available, and combined with the legacy architecture
from the desktop web (such as the need to support for IE9), scrolling on mobile "lagged" behind 
that of native apps.

This situation was and is especially true in the developing world.
In the developing world both the internet and computing is expanding massively,
and billions of people are establishing their very first internet and computing habits.
Unlike the web developers in the west who has hunchback-surfed the internet on their 
desktops since the 1990s, these new internet users have few other preferences than the here-and-now
experience of their apps.
And that is a prime reason why the open web of the browsers was and still is loosing ground to the
walled-gardens of the native apps. 

Indirectly, the browsers are fighting a battle with native apps such as Facebook and YouTube about
the nature of the internet in the future. For old-hat web developers in the west, 
the internet *is mainly* the desktop browser and web pages. We might mistakenly assume the internet 
being the open web is a force as strong as gravity. We might also mistakenly assume that people today 
will be introduced to the same internet as we were. But, neither is the case. A farmer in Asia getting 
his very first smart phone is introduced to a completely different internet: no keyboard, mouse, LCD 
screen and InternetExplorer, just a screen, finger and a dozen native apps like Facebook, Youtube, 
newspapers and friends. 
His first and lasting impression of the internet is likely to be "native phone apps".

Facebook likes that. Google does not. And both are competing to make their version of the internet 
more appealing to farmers in Asia and snappy teenagers in the west. In this competition, Facebook 
and friends can streamline their apps from A to Z. When smooth scrolling is important for the 
experience of the app, Facebook simply make their apps scroll super smooth. However, Google Chrome 
cannot streamline their app experience in the same way. On the web, the native browser app must 
collaborate with the web app to collectively provide the user with their experience.
This is a drawback of fighting a battle as a democracy: how to coalesce an army of independent forces.

Being the general, Google Chrome was looking at the battlefield over the internet future. The
open web was falling behind, walled gardens like Facebook was gaining ground. In the battle, there 
were many points of contention. And the native apps had breached one flank of the army of the open web:
laggy scrolling. Something should be done. The pain of keeping the ground now would be less than the
pain of catching up later. 

Waiting for the web apps to complete their handling of touch events *before* executing its native 
scroll behavior really hurt the scrolling on mobile Chrome. And, getting the army of the open web
to respond in force and collectively divert resources to plug a hole somewhere else in the world,
that takes too much time. The general made a decision. To plug the hole left by laggy scrolling and
prevent native apps to more or less flood and overtake the market in the internet developing world, 
a tactical change had to be made across the board. Everyone had to react. And that was when Chrome 
decided to [break the web](): `touchstart` and `touchmove` event listeners were flipped from active 
to passive.

From the perspective of each individual app, this was like being beaten from behind. 
The general, seemingly out of nowhere, just lashed your back with a whip to make you step up your game. 
It hurt. However, from the perspective of the open web army as a group, this was a forced collective
maneuver to shore up the breach of laggy scrolling. For the good of all, in the long term.

## Opinion

Now, there are many questions one can ask from this situation:

1. Did Chrome have the moral authority to force such a collective maneuver? 

2. Does Chrome acting unilaterally like an army general cause more harm to the 
   platform than the good of smoother scrolling?

3. Was the logistical maneuvers afterwards correct?
   Should the browsers collectively have chosen [a better implementation](https://github.com/whatwg/dom/issues/491)
   than they did?
   
4. Was the right tactic employed? Was making event listeners passive the right choice?
   Will web sites just end up making all their touch event listeners active instead?
   Could another strategy have gained more ground or caused less pain?
   
My opinion is this.

1. As web developers, we all share both an interest and a moral responsibility to promote the open web.
   And we need to recognize that we already do that all the time. Keeping things backward compatible 
   with IE, while at the same time making our web apps smoother and more functional in modern browsers,
   is *work done by you to promote democracy on the internet*.
   
   With passive touch event listeners, Chrome took a position. It decided that this time the army of 
   the open web needed to consider future Chrome users, along side legacy IE9 users. I am not sure
   they were wrong. I believe the short term pain for many developers in principle can be justified.
   As web developers, we need to consider the needs not only of web developers who have gone before
   us, but also of web developers coming after us. Sometimes, these needs will conflict. And sometimes,
   these conflicts needs to be solved looking forward.
   
2. I do not think seeing the browsers as breaking your code sometime in the future as surprising.
   The speed with which such breaking changes was introduced in this case was however.
   In the good old west with the high-end smart phones and the myriad of established web sites, 
   the speed of change here was probably to the worse. In the developing world with low-end smart 
   phones and more fierce competition with native apps probably to the better. I will not take
   a stance here.
   
3. The forced introduction of EventListenerOptions without a proper fallback mechanism was 
   indeed poorly executed by the browsers. Once Chrome had chosen to break the platform,
   the browsers should have provided a better solution for developers to support both future (Chrome), 
   current, and old browsers at the same time. The `supportsPassive` feature check described in the 
   [TapDance](TapDance) problem is not how you introduce future-facing API.
   
   To control the defaultAction of touch is a mess. The CSS touch-action property is an advanced, but 
   working solution for static control. When Chrome restricted dynamic control by making the
   EventListener for `touchstart` and `touchmove` passive by default, Chrome and the other browsers
   should have also provided a better interface of how to regain this control by choice.
   The lack of a clear interface for choosing control of touch defaultAction is in my opinion the
   biggest blunder of this passive event listener maneuver.

4. When you make custom, composed, touch-based DOM Events as described in this book, 
   you will end up making a global, active event listener for `touchstart` events.
   Thus, the scrolling speed up will end up *not affecting `touchstart` events in apps that
   implement touch-based custom DOM Events*. 
   
   But, this is ok:
    * Many web apps such as games might implement their own touch-based gestures 
      and completely turn of the native touch-based gestures. They will not be affected negatively.
    * Other web apps will not implement any custom touch-based gestures, and 
      they will get a speed increase.
    * Global, custom, composed DOM Events should not trigger on `touchmove` anyway, and 
      so `touchmove` scrolling will still be smoothified.
   
   It is only *the start of native scrolling behavior* in apps that both a) compose custom touch-based 
   DOM Events on elements and b) rely on native scrolling for other elements, that do not get the
   smoothified scrollstart behavior.
   
## References

 * [How Chrome broke the web](http://tonsky.me/blog/chrome-intervention/) 
 * [And how the other browsers decided to fix it](https://github.com/whatwg/dom/issues/491) 


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

How Chrome broke the web. 
http://tonsky.me/blog/chrome-intervention/
And the rest of the browsers ganged up and decided to fix it. In a horrible
way.
https://github.com/whatwg/dom/issues/491


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

## Why Chrome broke the web

Why you ask? Well, I will try to make a long story
short. Smooth, responsive scrolling is an important part of the web experience.
On mobile, browsers struggle to keep up with native apps in this regard. 
This "bad scrolling" experience was one of the main drawbacks of mobile web apps vs mobile native apps.
And this is especially true for cheap, low power mobile devices in poorer parts of the world.

Laggy scrolling in Chrome was considered critical by big Google. 
The open, free web with google search-ads had been loosing ground to the walled-garden, pay-to-use
native mobile apps. And timing was considered critical. Billions of people around the world was
right then getting their hands on a mobile, their first ever computer and internet access.
The web was and is in the process of being forged, and although blaze, hunch-back web developers 
have had their hands at the keyboard since the 1980s in the rich west, for most of the world,
the internet is just a baby. Laggy scrolling on mobile web could *give* native apps and walled 
gardens such as Facebook a much bigger part of the pie and the future.

In this situation Google and Chrome made a choice. They [broke the web](). 
They made `touchstart` and `touchmove` event listeners `passive` by default. 
"Passive event listeners" is webspeak for "event listeners in which `.preventDefault()` has no effect".
This choice was *not* backward compatible and it *broke* many web pages.
Many web developers felt that Google was lashing out at them, to make their own product faster. 
Web developers everywhere had to hastily fix their web sites.

However. This situation might be considered a bit differently 


