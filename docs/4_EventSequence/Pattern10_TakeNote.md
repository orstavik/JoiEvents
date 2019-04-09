# Pattern: TakeNote

Mark my words. And take note. These two expression basically mean "what I am saying now will 
be important in the future, so you should make a physical or mental note of it." 
They put an expectation on the listener to remember it. 
And it is implied the listener will need this particular piece of information to complete some
future task and/or to fully understand a future statement that builds on this premise.

Many composed events are triggered by multiple events, not only a single event. 
These composed events must remember the *state* of the primary or preceding trigger events.
In the most basic example, such state can be simply that a previous event having occurred. 
In such instances, the state data can often be preserved implicitly.
But, most often the composed event require other data such as the previous trigger events' target, 
timeStamp, pointer coordinates, etc. This data cannot be remembered implicitly, but 
requires that the event triggering function store the EventSequence state.

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

<!--<script async src="//jsfiddle.net/orstavik/4s5kevd7/8/embed/result,html/"></script>-->

<code-demo src="./demo/triple-click-TakeNote.html"></code-demo>

## References

 * 

<script src="https://cdn.jsdelivr.net/npm/joievents@1.0.0/src/webcomps/PrettyPrinter.js"></script>
<script src="https://cdn.jsdelivr.net/npm/joievents@1.0.12/src/webcomps/CodeDemo.js"></script>