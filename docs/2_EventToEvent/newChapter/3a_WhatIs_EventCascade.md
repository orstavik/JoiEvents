# WhatIs: EventCascade

> You can't change the past with time travel. It is the main rule of time travel.

Events are like dominos. One event triggers a second event that triggers a third event etc. These chains of events we call EventCascades. The first event that triggers the second event is a "trigger event". The second event that is being triggered by the first event is a "cascade event". 

Another way to view EventCascades is that one event *spawns* another subsequent event. When a `mouseup` event occurs, this trigger event can spawn a `click` cascade event.  

But. When trigger events occurs, the browser does *not* spawn cascade events every time. When trigger events occur, the browser evaluates the context in which the event occurs to not only see *if* it should trigger a cascade event, but also *which* cascade event it should spawn. 

For example, when the browser receives a `mouseup` event, it might see that the mouse button is being released over a `<submit>` button on a `<form>`. This causes the browser to spawn a `click` event that in turn will trigger `submit` event. In another setting, the browser may see that its the right mouse button being released. The browser recognizes this as a trigger event that spawns a `contextmenu` event. And finally, the browser may find that it has not itself registered a preceding, corresponding `mousedown` event. For example, the mouse button might have been pressed down outside the browser window. In this case, the browser decide that *no* cascade events should be spawned.

## List of native EventCascades

The browser provides many native cascade events: 

 * The `click` event is triggered when a) `mousedown` and `mouseup` occur on the same element in the DOM and b) with the primary(left) mouse button.
 * The `click` event is triggered when a) `mousedown` and `mouseup` occur on the same element in the DOM and b) with the primary(left) mouse button.
 * The `contextmenu` event is triggered when a) `mousedown` and `mouseup` occur on the same element in the DOM and b) with the secondary(right) mouse button.
 * The `submit` event is triggered when a `click` event occurs on an `<input type="submit">` in a `<form>`.
 * The `submit` event is triggered when a) `keypress` event with key value `enter` occurs and b) an `<input type="submit">` in a `<form>` has `focus`.
 * The `scroll` event is triggered when a `wheel` event occurs on the document.
 * todo, add more examples.
 * todo, add references to the spec. 

Native events cascade in a single file, *one-by-one*. Events do not cascade in parallel.

## Event cascades and event propagation

Event cascades is the *outer* cycle of events; event propagation is the inner cycle. When one event is triggered it propagates down and up the DOM from the `window` element to the event's `target` element, and back up again. And, when one event has finished propagation, the browser triggers the next cascading event, if any.

todo I should make a figure describing this situation. This figure should have three levels, 
1. outer, the cascade
2. inner, the propagation cycle 
3. event listener queue, FIFO.

### Example 3: Custom events (echo-click)
 
 <code-demo src="demo/EchoClick.html"></code-demo>
 
 When events are dispatched from JS via methods such as `.dispatchEvent(..)` or `.click()`,
 then they do *not* propagate one-by-one, but propagate *nested one-inside-another*.
 You see this in the example above that as soon as `.dispatchEvent(...)` for `echo-click` 
 and `echo-echo-click` are called, they start to propagate down in the capture phase *before*
 their trigger `click` and `echo-click` events have completed.


## References

 * [Smashing: EventCascade](https://www.smashingmagazine.com/2015/03/better-browser-input-events/)
 * [Lauke: event order table](https://patrickhlauke.github.io/touch/tests/results/)