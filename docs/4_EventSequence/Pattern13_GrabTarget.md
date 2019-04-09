# Pattern: GrabTarget

## When to decide in an EventSequence?

EventSequences often benefit from making early decisions:        

1. By making a decision early in the initial event trigger function, an EventSequence
   can reduce its workload. By making a decision up-front, the EventSequence might
   1. avoid even registering secondary trigger event functions, and
   2. avoid computing a property or premise during secondary event trigger function calls.
   
2. By making a decision early and then sticking to it, the EventSequence becomes much more predictable. 
   There will be no change of heart between the initial and secondary custom DOM Events.
   Fewer property values dancing around.
   
3. By making a decision in one time, in one place in the code, gives a clear entry-point for debugging
   the EventSequence.

This and more is probably why the browsers themselves also makes the decisions for their native 
EventSequences early. Once the on `pointerdown` event propagates, the decision about the value of the 
`pointer-action` CSS property is, has already been made.

## When to capture the `target`?

To find the `target` element for an EventSequence is a small task (cf. the AttributeFilteredEvent and 
TypeFilteredEvent patterns). 
When done once in the initial trigger function, this small task is negligible.
However, if the task is repeated in several fine-grained secondary trigger functions, it can burden the browser.
Furthermore, changing the `target` between different composed events within the same EventSequence 
will also likely cause confusions and bugs where the composed EventSequence is used. Therefore, 
EventSequences should grab the `target` from the initial composed event it dispatches and reuse it, by default.

If you need to produce a series of events that will should produce different events, akin to `hover`,
then you are likely looking at a series of fine-grained atomic events or fine-grained independent 
composed events. An EventSequence that needs the ListenUp or the TakeNote patterns, should most likely 
grab and lock the `target` in the first trigger function to produce a composed event.
Note, the first trigger function to produce a composed event can be both an initial and a secondary 
trigger function:
 * In the mouse-based `dragging` events, the first trigger function to produce a composed event is 
   the initial trigger function, while 
 * In the `single-tap` event, the first trigger function to produce a composed event is 
   a secondary trigger function.

An EventSequence should grab and lock the `target` in 
**the first trigger function to produce a composed event**.

## Find common `target` for global EventSequences

Some EventSequences are meant to be global. 
`click` and `long-press` events are often meant to be applicable across the app, to all elements.
Unlike the EventSequences that are filtered by either an HTML attribute or the element type,
these EventSequences need a generic, global mechanism to identify the `target`:
`firstCommonAncestor(composedPath1, composedPath2)`.

```javascript
function firstCommonAncestor(composedPath1, composedPath2){
  for (let i = 0; i < composedPath2.length; i++) {
    let endEl = composedPath2[i];
    for (let i = 0; i < composedPath1.length; i++) {
        let startEl = composedPath1[i];
        if (endEl === startEl)
          return endEl;
      }
  }
  return null;
}
```
the EventSequence can do:
1. store the start `target` element and the end `target` element, and 
   then work with the `.parentNode` properties dynamically to find the firstCommonAncestor.
2. store the `.composedPath` for both EventSequences, and then find the firstCommonAncestor
   from there.
3. This becomes relevant if the DOM is changed in such a way that the start target element moves 
   in between the initial trigger and secondary trigger function is called. I am not sure yet which
   of these approaches are best. Above is the approach nr2.

## Example: `long-press` should really only be made on a specific target

`long-press` should really only occur *within* a specific element. No user of the `long-press`
event would image that the press either started or ended outside of the boundaries of the element
that receives the `long-press` event.
This means that you need to find the `firstCommonAncestor` for both the initial and final `long-press` 
trigger events (here `mousedown` and `mouseup`).

<pretty-printer href="./demo/long-press-GrabTarget.js"></pretty-printer>

## When to capture the EventSettings?

EventSettings should not be changed while an EventSequence is active.
While it is possible to do so, and while this might enable the developer to adjust a gesture to its
users dynamically, such dynamic adjustments of a gesture should be achieved using a DOMEventController.
DOMEventControllers are global JS functions that directly alter the state of the DOM Event trigger 
functions (see below).

EventSettings can therefore be read *once*, when first needed, and 
then stored and reused for the remainder of the EventSequence.
EventSettings are most likely needed during the initial trigger function or 
the first trigger function to produce a composed event. But, this is not a hard rule.
EventSettings should be grabbed once, when first needed, and then reused.

## Pattern: DOMEventController: `.setPointerCapture()`

[`Element.setPointerCapture()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture)
and its sibling [`Element.releasePointerCapture()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/releasePointerCapture) 
is a pair of DOMEventControllers.
They are global JS functions that tie future `pointer` events (touch and mouse) to a particular 
`target` element. They give the JS developer a backdoor into the state controlling his DOM Events.
 
A drawback of the DOMEventController pattern is that it is JS based. 
You can neither control it from HTML template nor see it in the DOM.

Furthermore, the DOMEventController is a bit messy. Once you use `.setPointerCapture()` to lock down
the `target`, you must explicitly remember to call `.releasePointerCapture()` to free up future Pointer 
events. This might not be a problem when things run smoothly, but if somehow the event eludes your control,
such as via an AlertBlurCancel, then the call to `.releasePointerCapture()` might get lost thus causing
strange Event behavior.

When composing custom events using the EarlyBird pattern, you do not need the DOMEventController
pattern to control the `target`: the event trigger functions listen on the global `window` object; 
they capture all targets. This means that we have no need to `setPointerCapture` for our trigger events.

Thus, when composing events, the use case for DOMEventController is much narrower: self-correcting
event controllers. Examples might include mouse movements that should or should not snap to an element
based on the users actions, and controlling the frequency of debounced events as a function of the apps
resources.

Furthermore, the custom composed events should mostly use the CaptureTarget pattern for EventSequences.
That more or less covers the use-case for the pattern behind `.setPointerCapture()`. And, if you insisted 
on controlling the target of an EventSequence dynamically, you should still specify it as an 
EventSettings as an HTML attribute.

The conclusion is that the DOMEventController pattern behind `.setPointerCapture()` 
for target control should be specified via EventSettings and HTML attributes, not via global JS functions.
You might need the DOMEventController pattern in a custom composed event, but that will likely be for
autocorrecting a highly specialized situation.

## Discussion: What choice!

Ahh.. to make decisions early feels good! You're the expert. 
And as you're confronted with dilemma after dilemma you just instinctively make the right choice.
Every time. You can trust your gut. Wherever you go, there is food. 
Others should trust your gut instinct too! You say "Follow me, I will take us there".

But. You are not that guy. You're the guy watching that guy. That reckless idiot. That idiot 
who is just a serial decider that makes an endless series of choices based with zero forethought, 
experience, or rational deliberation. 
That reckless guy is gut instinct alright! He is a self deluding gut who just dumps decisions all over the place. 
And his problem is so easy to spot. Right after he has made a choice, he simply tells himself it was a 
correct decision. He wilfully ignores to wait to see the result and wilfully disregards any consequences.
All he craves is the dopamine rush he gets by pulling the make-decision-lever.
And the more and frequent decisions, the more the dopamin fills him. 
He's like an addict, a decision-maker-junky caught in vicious decision-dopamin-more decisions feedback 
loop.

Sadly, your problem is not him. Its all the others. Who believe his self-confidence is rooted in reality.
That he feels good about his decisions because he stuck around to see them into fruition. 
Who don't recognize that his prime skill is to *avoid* the consequences of his decisions, not to harvest 
them. Why?? Why can't they recognize it?? Why are people so gullible??

> Questions to the reader: Where do you think my self-confidence comes from?
> Do I have any basis for these patterns? Do I believe in them myself? And if I do, do you 
> think that I am fooling myself? And if I don't, would you still be well served by believing in me?
> Am I for real?
                                                                  
## References

 * [Decisions and dopamine](https://www.dailymail.co.uk/sciencetech/article-4297698/Dopamine-brain-shape-decisions-make.html)
