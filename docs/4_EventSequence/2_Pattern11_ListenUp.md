## Pattern: ListenUp

## Why ListenUp?

To listen for events in JS can be expensive. If you listen for events such as `wheel`, `scroll`, `touchmove`, and `touchstart`, then your app can quickly start to lag (cf. PayAttention). And this can be a problem for EventSequences. If an EventSequence *always* listens for *all* events, it can lag. 

To make EventSequences more efficient, we can use the ListenUp pattern. ListenUp reduces the cost of event listeners by adding them *as late as possible*.

## HowTo: ListenUp
 
1. An EventSequence observes *two or more different event types*. 

2. The event types must follow a particular order.

3. The EventSequence therefore *adds and removes* event listeners when it switches from one state to the next, ie. the EventSequence "listens up" for new types of events when it switches states.

## Demo: Naive `long-press`

Let's look at this pattern in a basic `long-press` EventSequence:

1. When the `long-press` is in the *inactive* state, it only needs to listen for `mousedown` events; when the `long-press` is in the *active* state, it only needs to listen for `mouseup` events. 

2. Instead of registering *both* `mousedown` and `mouseup` event listeners at startup, the `long-press` EventSequence registers *only* an event listener for `mousedown` at startup when the EventSequence is inactive.

3. When a `mousedown` event occurs, the EventSequence switches state and becomes *active*. At this time, the EventSequence removes the event listener for `mousedown` and instead adds an event listener for `mouseup`.

4. Finally, when the press ends, the EventSequence reverts back to the *inactive* state. At this time, the EventSequence reverses this process and removes the `mouseup` listener and adds the `mousedown` listener again. 

<pretty-printer href="./demo/long-press-ListenUp.js"></pretty-printer>

Comment: Listening for both `mousedown` and `mouseup` is not be a big performance problem: `mousedown` and `mouseup` trigger events are infrequent and rare. Therefore, it might be more costly to ListenUp and juggle with the event listeners than to just listen for both events all the time. But, this is *not(!)* the case for other frequent events such as `mousemove` and `touchmove`. Therefore, I recommend using the ListenUp pattern by default, and instead revert to a simplistic listen-all-the-time strategy if you end up with an event listener that does not need to ListenUp.

## References

 * dunno
