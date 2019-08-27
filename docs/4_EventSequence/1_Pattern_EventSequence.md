# Pattern: EventSequence

## What is an EventSequence?

A gesture is made up of a series of actions. For example, dragging an element around the screen require a series of three different actions: the user must a) press down on an element with a finger or a mouse, b) move said finger or mouse around while pressing down, and then c) releasing the mouse button or lifting the finger.

To capture a gesture, a composed event must therefore capture all of the actions that comprise it. These actions are represented by events dispatched by the browser, and so when we make composed events for gestures, we need to record the sequences of events that represent them. **EventSequences** are composed events that listen for *two or more* trigger events.

EventSequences are defined by **having state**. When an EventSequence switch from one stage to the next, that means it has a first state and a second state, even if the first state is just an initial "empty" state. EventSequences' always has a state, even the most naive.

## Demo: a basic `long-press`

The naive, mouse-based `long-press` event is dispatched every time the user presses on a target for more than 300ms. To accomplish this, the `long-press` EventSequence listens for two trigger events: first a `mousedown` and then a `mouseup`.

The `long-press` EventSequence has two states:

1. An initial **inactive state**. The `long-press` EventSequence has not yet registered any `mousedown` events. In this state, the EventSequence is just listening for the first `mousedown` event to occur.

2. An **active state**. When a `mousedown` event occur, the `long-press` EventSequence switches into an active state. The `mousedown` has just occured, and the EventSequence does not yet know when it will end.

3. Then, when a `mouseup` event occur, the `long-press` EventSequence has now recorded the whole sequence of triggering events. It then evaluates whether or not a `long-press` gesture was made. After the EventSequence completes, it switches back into its **inactive state**.

But, just knowing that a `mousedown` has occured is not enough. The `long-press` EventSequence also needs to evaluate the duration of the press to see if it was long enough to be a `long-press`, or too short. This means that the `long-press` EventSequence needs to remember some *EventSequence details* in its active state: when did the `mousedown` occur.

The simplest way to store *EventSequence details data* is to preserve them as JS variables inside the composed event function. This way of preserving *EventSequence details data* we call DeepStateEventDetails, and we will discuss the pros and cons of this pattern in a later chapter Pattern: DeepStateEventDetails.

<pretty-printer href="./demo/long-press-EventSequence.js"></pretty-printer>

This basic `long-press` implementation tackles situations where the user presses the wrong buttons or the `mouseup` being dispatched without a corresponding `mousedown` being registered (cf. [1] and [2]). But, it does not implement support for cancelling the press when the user moves the mouse too much, and it also has poor support for EventSequence feedback. We will return to these problems in later chapters.

## Single type EventSequences

Looking at an EventSequence such as `long-press` above, the defining feature of the EventSequence appears to be that it listens for *two types* of events, ie. a start `mousedown` event and a stop `mouseup` event. However, this is *not* the case. EventSequences can just as easily be implemented by listening for *multiple events of the same type*.

## Demo: `tripple-click`

The `tripple-click` is a good example of such an EventSequence. The `tripple-click` EventSequence listens for three events of the same type `click`.

The `tripple-click` has three states:

1. An initial **zero-click state**. The `tripple-click` EventSequence has not yet registered any `click` events, or a `tripple-click` has just been made. In this state, the EventSequence is just listening for the first `click`.

2. A **one-click state**. When the first `click` occurs, the `tripple-click` EventSequence switches into its one-click state. The `tripple-click` EventSequence needs to observe the time of the `click`.

3. A **two-click state**. When the second `click` occurs, the `tripple-click` EventSequence switches into its one-click state. The `tripple-click` EventSequence now has observed two `click`s, and it stores the time of both `click`s.
 
4. When the third `click` occurs, the `tripple-click` EventSequence needs to make a decision. If all three `click`s has happened within `600ms`, a `tripple-click` event is dispatched, and the EventSequence switches back into its **zero-click state**. But, if the `click`s did not occur rapidly enough, it simply a) forgets about its first `click`, b) stores the second and third `click` as its first and second `click`, and c) remain in the two-click state.

<pretty-printer href="./demo/triple-click-TakeNote.js"></pretty-printer>

And in HTML it looks like:

<code-demo src="./demo/triple-click-TakeNote.html"></code-demo>

## References

 * (dunno)[]