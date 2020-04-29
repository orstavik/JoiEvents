# When: `dispatchEvent`?

async vs sync event dispatch

async event dispatch is simply wrapping the `targetEl.dispatchEvent(new CustomEvent(...))` inside a `setTimeout()` or `toggleTick()`.





The browser can "run" events async. This happens for for example ui events that the browser dispatches automatically. External, composed : true events. The async here means three things. The dispatch/start is async in the event loop. The individual event listener is async event loop. The defaultAction is async event loop.
Ie. The "run" async really means:
1. Start event propagation (dispatch) async.
2. Propagate (run each/next event listener) async
3. Start defaultAction async
For web developers, it is not possible to propagate event listeners async without too much hassle. Very costly. Very heavy intervention in the browser. Thus, custom event dispatched from script will always run sync. And this is not so bad, it only means that you cannot assume microtasks from event listeners conclude befire next event listener.
But. It is not that hard to queue the dispatch of event listeners async. Simply wrap the call of dispatchEvent in a setTimeout.
Similarly. It is not difficult to dispatch the action of state change triggered by an event async. Simply wrap that (set of) calls in setTimeout.
But. When are events run sync, and when are they ryn async. The browser runs events async when it queues them from other event triggers. The browser runs any event it triggers from script sync (except events that are triggered by an observer, such as toggletick, and events triggered by loading resource frameworks).
The browser always either does all 3 aspects sync, or all 3 aspects async.
But, why the async from script exceptions? Toggle is observed. This means the trigger for the event is queued one step in the microtask queue. It is slightly async to begin with. This could cause confusion, thus better dispatch the toggle event fully async for simpler overview.
Todo. Check if toggle propagates async. I think it doesn't.
Or maybe it does. It wouldn't matter for toggleTick, as its default action would function as a single task in the asyncListerQueue.
But. When would we like to run an event async, and not sync? When the event is composed: true, and propagates across several different dom contexts, we want async event dispatch and defaultAction. The idea is that for simplicity, any event that propagate *into* the DOM from outside should come one by one. Any event that is external from that context should run sequentially.
Similarly, if an event only propagates within a single dom context, it might be simpler to view it as sync. This means that composed : false events can be dispatched and run sync. Again with the exception of slightly async dispatched events from mutationobservers. And be aware of composed: false events that come from a slottedTorpedo.
DefaultActions follow the same logic as event dispatch.
But, there is a problem with defaultActions. They are often added by a web component function from another context. This switch in context means that the microtasks in different contwxts should run first. Microtasks from event listeners should be run before it. So there is a stronger rationale to have defaultActions run async, even for comoosed:false events.
No, wait, custom defaultActions must always run async. They must, both for technical reasons, and for reasons concerning architecture.
    
## References

 * 