## Pattern: ListenUp

## Why ListenUp?

Simple EventSequences have a problem: they *always* listens for *all* events. And listening for events can be expensive: add unnecessary event listeners for `wheel`, `scroll`, `touchmove`, and `touchstart`, and your app starts to lag (cf. PayAttention). 

The ListenUp pattern limits such cost by adding event listeners as *late as possible*. The pattern is simple: 
1. You have an EventSequence that listens for two or more different types of events. 
2. These events must occur in a certain order. 
3. You only listen for the events needed in the *current* state of the EventSequence.
4. Every time the EventSequence changes state, you add and remove event listeners so that you only listen for the trigger events you need in that state.

The "initial trigger function" is the event listener that is triggered from an EventSequence's initial/inactive state. "Secondary trigger functions" are the event listeners that are not registered initially, but that are registered by an initial trigger function or other secondary trigger functions.

## Demo: Naive `long-press`

We start with a basic `long-press` EventSequence:

1. When the `long-press` is in the *inactive* state, it only needs to listen for `mousedown` events; when the `long-press` is in the *active* state, it only needs to listen for `mouseup` events. 

2. Instead of registering *both* `mousedown` and `mouseup` event listeners at startup, the `long-press` EventSequence registers *only* an event listener for `mousedown` at startup.

3. When a `mousedown` event makes the EventSequence switch state, the EventSequence removes the event listener for `mousedown` and instead adds an event listener for `mouseup`.

4. Finally, when the EventSequence ends, it reverses this process by removing the event listener for `mouseup` and adding the event listener for `mousedown` again. 

<pretty-printer href="./demo/long-press-ListenUp.js"></pretty-printer>

Listening for both `mousedown` and `mouseup` is not be a big performance problem. These trigger events are infrequent and rare. However, I still recommend that you employ this pattern for all EventSequences as it will make them more coherent and is likely to be slightly more performant.

## References

 * dunno
