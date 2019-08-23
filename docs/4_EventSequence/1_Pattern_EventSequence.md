# Pattern: EventSequence

## What is an EventSequence?

A gesture is made up of a series of actions. For example, dragging an element around the screen require a series of three different actions: the user must a) press down on an element with a finger or a mouse, b) move said finger or mouse around while pressing down, and then c) releasing the mouse button or lifting the finger.

To capture a gesture, a composed event must therefore capture all of the actions that comprise it. The actions we can capture is the events dispatched by the browser, and so when we make composed events for gestures, we need to record their sequence of events. A composed event that listens for *two or more* separate events in order to produce a composed event is an EventSequence.

But. EventSequences are *not* defined by listening for more than one *type of* event. In fact, an EventSequence *can be* implemented listening for *multiple events of the same type*. The `tripple-click` demo below demonstrate such an EventSequence. 

What defines EventSequences is: *having state*. Even the utmost naive EventSequences go through different stages (states) during their execution. And, because an EventSequence can switch into a state, that means implicitly that it always has a state to switch from - even if the state it switches from is just an initial "nothing"-state. Thus, the state of EventSequences is *always present*: once a composed event for an EventSequence is active, it always has a state, even if that state is "empty".

## Demo: a basic `long-press`

An EventSequence for a mouse-based `long-press` gesture must have at least two states:

1. An initial **inactive state**. The `long-press` EventSequence has not yet registered any `mousedown` events. In this state, the EventSequence is just listening for the first `mousedown` event to occur.

2. An **active state**. When a `mousedown` event occur, the `long-press` EventSequence switches into an active state. The `mousedown` has just occured, and the EventSequence does not yet know when it will end.

3. Then, when a `mouseup` event occur, the `long-press` EventSequence has now recorded the whole sequence of underlying events. It then evaluates whether or not a `long-press` gesture was made. After the EventSequence completes, it switches back into its **inactive state**.

A mouse-based `long-press` EventSequence needs to listen for two different types of underlying events: `mousedown` and `mouseup`. When the EventSequence processes an underlying event, it most often needs to know some details about the state that it is in. For example, a `long-press` EventSequence needs to know *when* the `mousedown` occured. This start time is used to calculate the duration of the press once the underlying `mouseup` event occurs, and this duration is needed to evaluate if the press was too short or long enough to be a `long-press.

The simplest way to store such data is to use a JS variable inside the composed event function. And the simplest data to store is the underlying event objects. And with this knowledge we are ready to make our first, simple EventSequence composed event.

```javascript
(function () {
  function dispatchPriorEvent(target, composedEvent, trigger) {
    composedEvent.preventDefault = function () {
      trigger.preventDefault();
      trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
    };
    composedEvent.trigger = trigger;
    return target.dispatchEvent(composedEvent);
  }

  var primaryEvent;

  function onMousedown(e) {
    if (e.button !== 0)                           //[1]
      return;                   
    primaryEvent = e;
  }

  function onMouseup(e) {
    if (!primaryEvent || e.button !== 0)          //[2]
      return;                   
    var duration = e.timeStamp - primaryEvent.timeStamp;
    
    if (duration > 300) {
      var longPress = new CustomEvent("long-press", {bubbles: true, composed: true, detail: {duration: duration}});
      dispatchPriorEvent(e.target, longPress, e);
    }
    primaryEvent = undefined;
  }

  window.addEventListener("mousedown", onMousedown, true);
  window.addEventListener("mouseup", onMouseup, true);
})();
```

This basic `long-press` implementation tackles situations where the user presses the wrong buttons or the `mouseup` being dispatched without a corresponding `mousedown` being registered (cf. [1] and [2]). But, it does not implement support for cancelling the press when the user moves the mouse between `mousedown` and `mouseup`.

## Demo: `tripple-click`

As mentioned above, an EventSequence can be made using only a single *type* of underlying events, and the `tripple-click` is a good example of such an event.

Simply put, we can describe the `tripple-click` as also having two states:

1. An initial **inactive state**. The `tripple-click` EventSequence has not yet registered any `click` events. In this state, the EventSequence is just listening for the first `click`.

2. An **active state**. When a `click` event occur, the `tripple-click` EventSequence switches into its active state. In the active state, the `tripple-click` EventSequence does not add or remove any event listeners, but it keeps tag over how long it has been since the previous two `click`s.

3. If three `click`s are registered within `600ms`, a `tripple-click` event is dispatched, and the EventSequence switches back into its **inactive state**.

```javascript
(function () {
  function dispatchPriorEvent(target, composedEvent, trigger) {
    composedEvent.preventDefault = function () {
      trigger.preventDefault();
      trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
    };
    composedEvent.trigger = trigger;
    target.dispatchEvent(composedEvent);
  }

  //event state
  var clicks = [];
  function updateSequence(e) {
    clicks.push(e);
    if (clicks.length < 3)
      return;
    let duration = clicks[2].timeStamp - clicks[0].timeStamp;
    if (duration <= 600) {
      clicks = [];
      return duration;
    }
    clicks.shift();
  }

  function onClick(e) {
    var duration = updateSequence(e);
    if (!duration)
      return;
    var triple = new CustomEvent("triple-click", {bubbles: true, composed: true, detail: duration});
    dispatchPriorEvent(e.target, triple, e);
  }

  window.addEventListener("click", onClick, true);
})();
```

## Where to next?

But. There are two main problems with this basic setup for EventSequences:
 
1. It *always* listens for *all* events. When the `long-press` is in the *inactive* or *end* state, it only needs to listen for `mousedown` events; when the `long-press` is in the *active* state, it only needs to listen for `mouseup` events. This is not a big problem for this particular event, as there is little performance cost associated with listening for `mousedown` and `mouseup` events. But, this setup will not work for EventSequences that at certain stages need to listen for `wheel`, `touchmove`, or `mousemove`. To more adeptly manage these eventlisteners, we need to employ another pattern: ListenUp.
 
2. "Deep state" is state data that is hidden and/or inaccessible to other parts of the app. The inner variables in the EventSequence SIF are deep state. The `long-press` EventSequence hides both a) its current state (inactive/active/end) and b) the relevant data from its previous state (the timestamp and potentially x/y-position of the mouse).

   Again, it might seem problematic for a simple `long-press` EventSequence to use deep state. But, to add deep state to an app is conceptually and architecturally problematic: when you add deep state data, you cannot imagine another component ever needing to know about that data. but then, suddenly, a new use-case emerges and you need to access that data anyway. Now, having first pushed this state data deep into somewhere, you can't get it out, and so you instead retrieve it again. And presto! You have created a redundancy that is inefficient and very likely to later cause you headaches.
   
   And, this is exactly the story with deep state in EventSequences. At first, I thought it was ok. And I built my composed events with it. But then I realized I needed to make visual and other feedback for the same events. And then I realized I needed to access the state data from the events from HTML and CSS. And then I (yet again) realized how bad deep state is and why one should try to avoid it.
   
   The ListenUp should not alter which event listeners are active without altering the state information in the DOM root node. 
   


In this chapter we will look at three main strategies to handle this state:

1. **internal JS variables** stored inside the composed event function. This topic we will discuss in this chapter.

2. **Pattern: ListenUp**. How and why we can register different listeners depending on which state the EventSequence is in. This we will discuss in the next chapter.

3. **Pattern: DomRootState**. Store information about the state in the DOM, on the root element.

When the EventSequence that needs to be preserved. needs at some point during its execution state to know *at minimum* which actions in the gesture has already been performed. 



Every EventSequence has state. In a sense, but in fact that it needs to *know the state of previous acions*.

, and b) the time of preceding events. needs to store at least the time of the first `mousedown`, so that it on the subsequent `mouseup` event can evaluate if the mouse button was pressed long enough to be a `long-press`. 
 


## Demo: `long-press` event sequence




The simplest way to do this is to store data about an event sequence as **internal JS variables** in the event sequence self-contained function. For example, a `long-press` event can store the time when the `mousedown` was made as a number inside itself. Below is a demo

2. 

## TakeNote of EventSequence state

The composed event must store state. 
This raises some red flags, so let us look at them:

1. When data is passed out of the TakeNote and EventSequence trigger function, 
   they can be altered on the outside. If the data passed out is an object or an array, 
   altering data within those objects would be mutations that also would alter the inner state
   of the event trigger functions. That would be very bad, very, very bad indeed.
   
   Therefore, when state data is passed out of the TakeNote trigger function object, 
   it should always be deep cloned. The TakeNote pattern must always ensure that its inner state
   remain immutable from the outside.
   **When data leaves the TakeNote trigger function, make sure it is deep cloned.**
   
2. State stored in different places are a source of bugs. 
   The state may be changed from many different sources, and 
   changes of that state may alter other functionality.
   
   However, deep state in event trigger functions are not likely to cause bugs in this manner.
   Event trigger functions are clearly delineated.
   First, their state should not be accessible from others,
   except via a strictly defined input interface that is the trigger events.
   Second, although the trigger events' propagation and defaultAction *could* be stopped in certain 
   states of the event trigger function, the event trigger function itself should not directly alter the
   state of the app. (Listeners for the composed event likely will of course, but they are not in the 
   domain of this deep state.)
   Thus, while care should be taken *not* to let the state of the trigger function be accessible 
   from outside, and to have the trigger functions *not* directly alter the state of the app
   (this highlights how the defaultAction and the propagation property of an event is part of an apps state),
   deep state in composed events are mostly bug-benign.
  
3. State stored in a variety of places can be a source of memory leaks.
   If you have a deep state that hoards data for some purposes, and 
   then does not readily release it, then you might incur memory leaks.
   
   Again, the deep state of event trigger functions are not likely to cause such bugs.
   Deep state event trigger functions do well in storing only the events themselves.
   The event objects are filled with some values for such data as timeStamp and x and y coordinates 
   for mouse, touch and pointer events. todo Target. If there are large, memory-affecting data
   in an event, that data is normally stored behind a getter.
   The event getters usually solve the memory leak problem of preserving the event, but 
   it also can cause headaches for the developer of composed events who does not have a memory leak issue,
   but instead needs to access data in primary trigger events that are kept behind a getter.
   
   tomax: we need to check this out! which data are behind getters in events? Is target behind a getter?


## Example: naive `triple-click`

The naive `triple-click` composed event needs to TakeNotes. 
A `triple-click` are three clicks done within 600ms, not overlapping another triple click.
It has, of course, three trigger events. All clicks. But, to find out if a click is the third 
and final trigger, the event needs to preserve the state of the previous click events.

<pretty-printer href="./demo/triple-click-TakeNote.js"></pretty-printer>

## Demo: naive `triple-click`

<code-demo src="./demo/triple-click-TakeNote.html"></code-demo>

## References

 * dunno
