# Pattern: EventSequence

## What is an EventSequence?

A gesture is made up of a series of actions. For example, dragging an element around the screen require a series of three different actions: the user must a) press down on an element with a finger or a mouse, b) move said finger or mouse around while pressing down, and then c) releasing the mouse button or lifting the finger.

To capture a gesture, a composed event must therefore capture all of the actions that comprise it. These actions are represented by events dispatched by the browser, and so when we make composed events for gestures, we need to record the sequences of events that represent them. These types of composed events that listen for *two or more* trigger events we call EventSequences.

EventSequences are defined by **having state**. Even the most naive EventSequences go through different stages (states) during their execution. And, because an EventSequence can switch into a state, that means implicitly that it always has a state to switch from - even if the state it switches from is just an initial "nothing"-state. Thus, EventSequences' always has a state.

## Demo: a basic `long-press`

The naive, mouse-based `long-press` event is dispatched every time the user presses on a target for more than 300ms. An EventSequence for such a `long-press` gesture must have at least two states:

1. An initial **inactive state**. The `long-press` EventSequence has not yet registered any `mousedown` events. In this state, the EventSequence is just listening for the first `mousedown` event to occur.

2. An **active state**. When a `mousedown` event occur, the `long-press` EventSequence switches into an active state. The `mousedown` has just occured, and the EventSequence does not yet know when it will end.

3. Then, when a `mouseup` event occur, the `long-press` EventSequence has now recorded the whole sequence of triggering events. It then evaluates whether or not a `long-press` gesture was made. After the EventSequence completes, it switches back into its **inactive state**.

A mouse-based `long-press` EventSequence needs to listen for two different types of triggering events: `mousedown` and `mouseup`. When the EventSequence processes an triggering event, it most often needs to know some details about the state that it is in. For example, a `long-press` EventSequence needs to know *when* the `mousedown` occured. This start time is used to calculate the duration of the press once the triggering `mouseup` event occurs, and this duration is needed to evaluate if the press was too short or long enough to be a `long-press.

The simplest way to store such data is to use a JS variable inside the composed event function. And the simplest data to store is the triggering event objects. And with this knowledge we are ready to make our first, simple EventSequence composed event.

<pretty-printer href="./demo/long-press-EventSequence.js"></pretty-printer>

This basic `long-press` implementation tackles situations where the user presses the wrong buttons or the `mouseup` being dispatched without a corresponding `mousedown` being registered (cf. [1] and [2]). But, it does not implement support for cancelling the press when the user moves the mouse between `mousedown` and `mouseup`.

## Single type EventSequences

EventSequences are *not* defined by listening for more than one *type of* event. In fact, an EventSequence *can be* implemented listening for *multiple events of the same type*. The `tripple-click` is a good example of such an event. A `tripple-click` is made up of a sequence of three `click`s. Three events need to occur, but they are all of one and the same event type.

## Demo: `tripple-click`

Simply put, we can describe the `tripple-click` as also having two states:

1. An initial **inactive state**. The `tripple-click` EventSequence has not yet registered any `click` events. In this state, the EventSequence is just listening for the first `click`.

2. An **active state**. When a `click` event occur, the `tripple-click` EventSequence switches into its active state. In the active state, the `tripple-click` EventSequence does not add or remove any event listeners, but it keeps tag over how long it has been since the previous two `click`s.

3. If three `click`s are registered within `600ms`, a `tripple-click` event is dispatched, and the EventSequence switches back into its **inactive state**.

<pretty-printer href="./demo/triple-click-TakeNote.js"></pretty-printer>

And in HTML it looks like:

<code-demo src="./demo/triple-click-TakeNote.html"></code-demo>

## References

 * (dunno)[]

EventSequence needs to *know the state of previous actions*.
