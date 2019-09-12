# Pattern: ChangeOfHeart

> It's ok to change your mind.

So, we have EventSequences. They can a) control, block or otherwise direct other events, and b) produce composed events and/or CSS (pseudo-)pseudo-classes. But when exactly should our EventSequences do what?

# RulesOfThumb: EventSequences

1. **A state change produce an event**. Whenever an EventSequence's internal state changes, it should dispatch an event.

The touch event is a good example of this rule. Whenever a finger is added to, move on top of, or removed from the touch device, a different event is dispatched. The native EventSequence for touch events is not *cheap* with its events: it is almost as if it dispatches events whenever it can, and it gives different types of events different names so that they are simple to distinguish when adding event listeners.

> A comment: For some events such as `touchmove`, special consideration is given to the *first* `touchmove` dispatched within the same sequence. If you set up an EventSequence with a similar need for custom treatment of a *first* event, I would recommend dispatching a separate event type for this treatment. For example, instead of dispatching only two events: `touchstart` and `touchmove`, I would have dispatched three events: `touchstart`, `pre-touchmove` and `touchmove`.

> This rule is more a guide than a something to obeyed 

2. ***One* state change *can* produce *two or more* events**. If a state change of an EventSequence affects *more than one target*, then either dispatch an event for a shared ancestor (cf. `select`) or dispatch *two or more events* on different targets.

The drag'n'drop events is a good example of an EventSequence regularly dispatching *two or more* events per *one* state change. For example, if a user is dragging a box over two other elements, then:
 * a single pixel change in the mouse cursor's position might cause the drag'n'drop EventSequence to dispatch
1. a `drag` event with the element being dragged as `target`, 
2. a `dragenter` event targeting the element being dragged on top of, and
3. a `dragleave` event targeting the element being dragged from.  

3. **State changes can be throttled**. Some state changes, such as `resize`, can be throttled/debounced for efficiency concerns. Avoid throttling events of different types.

4. ***Some* state changes alters pseudo classes**. While all inner state changes should produce an event, all state changes do not necessarily alter pseudo-classes. For example, you do not need to update or alter the pseudo-class of an element for every `drag` event, and `:hover` does not distinguish between `mouseenter` and `mouseover`.

5. **Other events, timers, network resources and more can change an EventSequence's state**. Commonly, an EventSequence's internal state is altered when it registers another trigger event. This is especially true for UX gestures. However, also:
   * the passing of time, 
   * changes in the DOM (such as a target element being deleted), 
   * network resources being loaded,
   * and other non-event based state changes
   
   can cause an EventSequence to change states.
   
## Demo: `long-press` with heart

<pretty-printer href="./demo/long-press-ChangeOfHeart.js"></pretty-printer>

In the example above, both the external events `mousedown` and `mouseup` and the change of a time interval play a role in changing the inner state of the long-press EventSequence. For this long-press demo, a pseudo-class 

<code-demo src="./demo/long-press-ChangeOfHeart.html"></code-demo>

## References

 * 
