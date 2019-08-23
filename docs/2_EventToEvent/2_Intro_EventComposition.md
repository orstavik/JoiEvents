# Into: EventComposition

EventComposition is the act of making a new event from one or more other events.
EventComposition is implemented as *a single, global event listener function in JS*.

The EventComposition patterns described here only applies to *global events* that begin their propagation on the `window` DOM node. Local events can often be processed quite similarly, but are restricted to a single document scope. If you make web components, you can use many of the strategies described here, and combine them with the JoiComponents EventRecorder pattern.

## EventComposition patterns

The best way to compose events is to follow a set of established patterns/best practices. These patterns give you a clear guide as to the strategic choices you need to make and the pros and cons of solving them in different manners.

1. Should the composed event propagate independently of other events, and if so, how can this be achieved? [The EarlyBird pattern](Pattern2_EarlyBird.md).

2. Should I dispatch the composed event so that it propagates the DOM *prior to* the triggering event; or 
   should I dispatch the composed event so that it propagates *after* (trailing) the triggering event?
   [The PriorEvent pattern](Pattern3_PriorEvent.md). 

3. Do I need to access any state information outside of the events that trigger the composed event; or
   do I need to store any state information when I listen for a sequence of events; or
   is the function that compose the new event pure?
   
4. Do I need to listen to only a single event; 
   do I need to listen for several events; or 
   do I need to listen to a sequence of events?
   
5. When I need to listen for a sequence of events, how can I do so most efficiently?

6. Do the composed event need to be able to prevent the default behavior of the triggering event;
   do the composed event need to prevent the default behavior of the triggering event always; or
   do the composed event never need to prevent the default behavior of the triggering event?
   

## EventComposition patterns

In this book, we will present the following EventComposition patterns:

0. Problem: **StopPropagationTorpedo**. (BubbleEventTorpedo)
   Show how a) you can turn off the triggering and propagation of a composed event 
   by simply b) adding an event listener to trigger it later on in the propagation order and then 
   c) stop the propagation of the trigger event prior to the composed event trigger function in the 
   trigger event's propagation.
    
1. Pattern: **EarlyBird**: 
   The chapter uses an `echo-click` event as its example.
   
2. Pattern: **PriorEvent**: 
   The chapter uses an `echo-click` event as its example.
   
3. Pattern: **AfterthoughtEvent**: 
   The chapter uses an `echo-click` event as its example.
   
4. Pattern: **ReplaceDefaultAction**: 
   The chapter uses an `echo-click` event as its example.
 
5. **AttributableEvent**: This pattern illustrate how HTML attributes can be used to turn on or off a composed event per individual elements. The chapter uses a `triple-click` event as its example.

6. **FilteredPriorEvent**: This pattern uses a pure function to filter out a composed event
   from a single event of a single event type. The chapter uses the `link-click` event as example
   (ie. `click` events on DOM elements within an `<a>` or `<area>` element that will trigger browsing).
   [cf. "What is a pure function?"](https://medium.com/javascript-scene/master-the-javascript-interview-what-is-a-pure-function-d1c076bec976)

7. **MergedEvents**(UnitedEvents) : This pattern also uses a pure function to compose a single event from single events of two or more event types. This chapter uses the `navigate` event as an example to illustrate how all events which eventually will yield in the browser browsing can simply be united into a single event to control routing.

8. **EventSequence**: This pattern illustrate how gestures can be implemented as ComposedEvents. EventSequence pattern listens for a sequence of events from one or more different types, and it uses the state from this collection of event in its event composition. The chapter uses a `long-press` event as its example.

   1. triple-click. Illustrate how state for the event is stored and then used in the filter and 
      makeEvent phases.
      
   2. naive mouse dragging. Illustrate how additional trigger functions are added once the start of a
      sequence has occurred. Discuss the performance of global trigger functions, and how best to keep 
      things efficient.
      
   3. setTargetCapture, ie. use the start of the event as the target for the later composed events in the sequence.

   4. setEventTypeCapture, ie. use the replaceDefaultAction pattern + add css properties such as
      touch-action and user-select.
      
Discuss how it is important not to have the trigger event listeners on high frequent events, and 
to add event trigger functions on a need-to-know basis.


   Question 3: What state information should composed events rely on?
Furthermore, and as a general rule, composed events should not require any state information 
outside the scope of its triggering event and the DOM elements it directly propagates to.
However, there is one exception to this rule: `<base href="" target="">` and the EventHelper pattern.
But, this pattern is confusing, hard to decipher, and hard to control in a living codebase.
Thus, my advice is strongly, strive hard to only rely on data from the triggering events itself and
from the DOM elements the triggering events directly propagates to.


9. **GrabTarget**. This pattern illustrate how EventSequences can control the targets in its events,
   very much replicating the `setPointerCapture()` functionality.
   The example is a `mouse-dragging` event.

10. **CapturedEventType**. This pattern illustrate how subsequent events of a certain type can be captured.
   This opens up both the discussion about what `preventDefault()` is all about, and
   how CSS-properties such as `userSelect` provide a modern alternative to `preventDefault()` 
   to control native, composed events and actions.
   The chapter extends the `mouse-dragging` example from chapter 5. Name MouseGrab? ref D J Trump?

11. **CaptureTouch**. This pattern is principally the same as CapturedEventType.
   However, since touch-based gestures is a mayor player in the composed events game, 
   a separate chapter is devoted to capturering touch events.
   This chapter uses a single-finger `touch-dragging` example, and discuss how the potential 
   and limitations of the `touchAction` CSS-property.

12. **InvadeAndRetreat** and the 5 problem descriptions from the gesture chapter.
   Behind the CaptureEventType patterns, a more generalized pattern about conflict management. 
   Go all in hard at the beginning. 


## References

 * [Bubbling and capturing](https://javascript.info/bubbling-and-capturing)
 * [Event Bubbling and Event Capturing in JavaScript](https://medium.com/@vsvaibhav2016/event-bubbling-and-event-capturing-in-javascript-6ff38bec30e)
 * [MDN: `addEventListener()` with capture](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Example_of_options_usage)