# Problem: WebDemocracy

## Why do smooth scrolling matter?

Smooth, responsive scrolling is important. It makes the app look good. It is expected.
But, on mobile devices browsers have struggled to scroll smoothly. 
Cheap mobile phones have less power and speed available, and combined with the legacy architecture
from the desktop web (such as the need to support for IE9), scrolling on mobile web "lagged" behind 
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
the internet *is mainly* the desktop browser and web pages. We might assume "the internet 
being an open web" is a force as strong as gravity. We might also assume that people today 
will discover the internet in the same way as we did. And we will be mistaken.
A farmer in Asia getting his very first smart phone is introduced to a completely different internet: 
no keyboard, mouse, LCD screen and InternetExplorer, just a screen, a finger and 
a dozen native apps like Facebook, Youtube, newspapers and friends. 
His first and lasting impression of the internet is likely to be "native phone apps".

Facebook likes that. Google does not. And both are competing to make their version of the internet 
more appealing to farmers in Asia as well as snappy teenagers in the west. In this competition, Facebook 
and friends can streamline their apps from A to Z. When smooth scrolling is important for the 
experience of the app, Facebook simply make their apps scroll super smooth. However, Google Chrome 
cannot streamline their app experience in the same way. On the web, the native browser app must 
collaborate with the web app developers to collectively provide the user with their experience.
This is a drawback of fighting a battle as a democracy: how to coalesce an army of independent forces.

## Why passive-aggressive EventListeners?

Being the general, Google Chrome was looking at the battlefield of the future of the internet. The
open web was falling behind, walled gardens like Facebook was gaining ground. In the battle, there 
were many points of contention. But the native apps had breached one flank of the army of the open web:
scrolling. Something needed to be done. The pain of keeping the ground now would be less than the
pain of catching up later. 

Technically, waiting for the web apps to complete their handling of touch events *before* executing 
its native scroll behavior really hurt the scrolling on mobile Chrome. 
Politically, getting the army of the open web to respond in force and collectively divert resources 
to plug a hole somewhere else in the world, also takes too much time. The general made a decision. To plug the hole left by laggy scrolling and
prevent native apps to overrun and dominate the internet in the developing world, 
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
   
2. The browsers will break your code sometime in the future. This is not a surprise.
   What was surprising was the *speed* with which such breaking changes was introduced in the case of
   passive event listeners.
   In the good old west with the high-end smart phones and the myriad of established web sites, 
   the speed of change was probably to the worse. In the developing world with low-end smart 
   phones and more fierce competition with native apps probably to the better. I do not have the data
   to judge.
   
3. The forced introduction of EventListenerOptions without a proper fallback mechanism was 
   indeed poorly executed by the browsers. Once Chrome had chosen to break the platform,
   the browsers should have provided a better solution for developers to support both future (Chrome), 
   current, and old browsers at the same time. Adding yet another twist to the already long 
   [TapDance](TapDance) is problematic. The `supportsPassive` feature check is out-right ugly. 
   
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
      and completely turn off the native touch-based gestures. If you don't use native scrolling,
      you will not be affected negatively.
    * Other web apps will not implement any custom touch-based gestures. If you don't use custom
      composed touch-based gestures, you will get a speed increase.
    * Global, custom, composed DOM Events should not use initial trigger functions on `touchmove` when
      they are not activated. Therefore `touchmove` scrolling will still be smoothified.
   
   It is only *the start of native scrolling behavior* in apps that both a) compose custom touch-based 
   DOM Events on elements and b) rely on native scrolling for other elements, that do not get the
   smoothified scrollstart behavior.
   
## References

 * [How Chrome broke the web](http://tonsky.me/blog/chrome-intervention/) 
 * [And how the other browsers decided to fix it](https://github.com/whatwg/dom/issues/491) 