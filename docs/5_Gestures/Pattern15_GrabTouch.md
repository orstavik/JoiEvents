# Pattern: GrabTouch

## Dynamic control

Both TapDance and GrabMouse assert their control over the behavior of other DOM Events *dynamically*.
It is only when *activated* that the patterns take control of the other events.
While the EventSequence remains active, this control is maintained. 
But when the EventSequence ends, the control is released and its original settings restored.

*Dynamic control* is imposed only when-and-while-needed, on-the-go.
*Dynamic* control is not a *static* aspect of the DOM, but 
a state of the DOM completely subjugated an imperative sequence.

## Pointer and touch events

Lots have been written about pointer and touch events, and we will not go into the details of it here.
We will simply state that pointer events is a MergedEvents of both mouse and touch events, and 
that as most modern browsers (except Safari) now implement support for PointerEvents, the browsers
dispatch both the triggering touch or mouse event and the pointer merged event.

Pointer events therefore provide an excellent alternative if you need to process touch and mouse events
as one. Except for one thing. Dynamic control. As the merged pointer events do not extend the
ability to prevent default behavior of its trigger events. To illustrate this, we will look at the 
TapDance problem.

## Problem: the TapDance

The TapDance arise when you:
1. wish to use pointer and/or touch events in your app, and
2. control the native touch behavior at the same time dynamically.

Lets dance!

First, we start with the same approach as we did with mouse events. 
There are two CSS properties available to control native touch gestures such as 
double-tap-to-zoom and swipe-to-scroll: `touch-action` and its twin `pointer-action`. 

`touch-action` and/or `pointer-action` are **restrictive** CSS properties. 
If you set a `touch-action` property on a DOM element that does not allow scrolling, 
no touch event that is targeted at any element inside the DOM element with that restriction 
will be able to scroll (even if another CSS property deeper down explicitly allows such behavior). 
Once restricted, that is it.
 
This sounds good. To assert control and restrict native touch behavior, all we have to do is set this 
CSS behavior at the top level such as on the `<body>` element. Except. That it doesn't work! Whaaat??!!   

<script async src="//jsfiddle.net/orstavik/nheLpx3y/29/embed/result,html/"></script>

The [spec]() states that once the initial `touchstart` event propagates, the CSS properties of
`touch-action` and `pointer-action` have already been read, captured, and locked down. So,
changing the `touch-action` property in an event listener for `pointerdown` or `touchstart` will have
no effect on default touch actions until the next `pointerdown` or `touchstart` is triggered.
This makes these CSS properties useless for dynamic control of touch events. 

Can't touch this! What?! Why?? Noooo... Shutdown hard by the two CSS twins. 
You try to pretend like nothing happened and while you check your clothes.
No, it wasn't me. The CSS twins were probably just in a bad mood. 
And you TapDance your way over to another girl on the dance floor.

Second, we approach the pointer event girl gang with our `preventDefault()` moves. 
`preventDefault()` will never fail us! You think.
To do the `preventDefault()` with the pointer girls is not as suave as doing the 
pan-this-way, pan-that-way, pan-this-that-and-the-other with the exotic CSS sisters.
But the pointer girls are cool. To habba-habba-do-the-`preventDefault()` with them is still alright.

<script async src="//jsfiddle.net/orstavik/L0fr2nuh/5/embed/result,html/"></script>

But, what is this?! The pointer events just ignores your preventDefault?!? Strike two!! No....
Apparently, the browsers did not find it poignant to disconnect the defaultAction of the touch events
from their MergedEvent relative. But you do! Arrghh.. The pain! The senseless, meaningless torture of 
default actions run awry. Why couldn't they just have made the merged pointer events properly? 

Then how do I control the touch actions dynamically??
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

## Example: `tripple-tap`

<script src="https://cdn.jsdelivr.net/npm/joievents@1.0.0/src/webcomps/PrettyPrinter.js"></script>
<pretty-printer href="https://raw.githubusercontent.com/orstavik/JoiEvents/master/src/gestures/trippleTap.js"></pretty-printer>

## References

 * 
 
## Old

```javascript
function dispatchPriorEvent(target, composedEvent, trigger) {   
  composedEvent.preventDefault = function () {                  
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;                              
  target.dispatchEvent(composedEvent);                   
}

//event state
var tripleClickSequence;

function startSequence(e) {
  tripleClickSequence = [];
  window.addEventListener("touchend", onTouchend, true);
}

function updateSequence(e) {
  tripleClickSequence.push(e);
  if (tripleClickSequence.length < 3)
    return;
  if (tripleClickSequence[2].timeStamp - tripleClickSequence[0].timeStamp <= 600){
    var result = tripleClickSequence.map(function(e){return e.timeStamp});
    tripleClickSequence = undefined;
    window.addEventListener("touchend", onTouchend, true);
    return result;
  }
  tripleClickSequence.shift();
}

function onTouchend(e) {
  var tripple = updateSequence(e);
  if (!tripple)
    return;
  dispatchPriorEvent(e.target, new CustomEvent("tripple-tap", {bubbles: true, composed: true, detail: tripple}), e);
}

function onTouchstart(e) {                                 
  e.preventDefault();                                       //[1] block default touch actions such as scroll
  window.addEventListener("touchend", onTouchend, true);
}

window.addEventListener("touchstart", onTouchstart, true);
```