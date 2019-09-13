# Pattern: EarlyBird

> gets the worm!

To compose an event, we need one or more original, *trigger events* from which to compose the new event. And to get hold of these trigger events, we *must* listen for them.

But, what if:
1. some other event listener function in your app
2. listens for the same event, 
3. receives and processes the event *before* your trigger function, and
4. calls `.stopPropagation()` on it?

As we saw in the last example in [HowTo: StopPropagation](4_HowTo_StopPropagation), this will mute your trigger function. So, to avoid being blocked like this, we want to add our event listener as early as possible. We want an EarlyBird event listener.

## WhatIs: an EarlyBird

EarlyBird event listeners can control and direct events that `bubbles`. An EarlyBird is:

1. is added in the `capture` phase of the event propagation on
2. a top level DOM node, either the `window` or the `document`.

When we make custom composed events, we have no control of the loading of scripts in the DOM. This means that when:
1. events are added to the same target and in the same propagation phase, then
2. we have no control over the sequence in which these event listeners run. 

Thus, for the EarlyBird pattern to work safely, no other scripts in your app should listen for events on the `window` in the capture and target phase or `document` node in the capture phase.

> Att! This pattern includes an assumption about the DOM!! The EarlyBird pattern assumes that either a) *no* event listeners for bubbling events are added on the `window` or the `document` in the the capture phase, or b) if they are, that the app developer has control of their conflicts and priority.

## When should EarlyBirds block and compose?

There are *two* distinct use-cases for controlling other bubbling events:

1. **Block another event** (cf. the StopTheUnstoppable and the PreventDefaultClick patterns). 
2. **Compose new events or pseudo-classes based on other events**.

The decision of **blocking** another event has priority over **observing and composing** the same event. Whenever you block an event, you should always expect this act to also block the event as a trigger for a composed event. EarlyBird event listeners that should block another event are therefore always added to the `window` node in the `capture` phase.

EarlyBird event listeners that should observe and then compose events and pseudo-classes, should be added to the `document` in the `capture` phase for events that `bubble` and on the `window` in the `target` phase for non-bubbling events. 

```javascript
window.addEventListener("bubble-event", e => blockBubbleEvent(e), true);
document.addEventListener("bubble-event", e => observeAndComposeAnotherEvent(e), true);
```

## Example: `click-echo` EarlyBird

<code-demo src="demo/EarlyBirdClickEcho.html"></code-demo>

## References

 * 