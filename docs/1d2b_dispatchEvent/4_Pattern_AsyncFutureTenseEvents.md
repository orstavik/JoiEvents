# Pattern: AsyncFutureTenseEvent

Make a chapter that describes how a future tense event should be set up. 
1. Make the future tense event. 
2. add the default action to it, using addDefaultAction. The addDefaultAction will ensure that the defaultAction is run as an event loop task, async for microtasks.
3. the choice of dispatching this event sync or async (in a toggleTick). If the event is only reacting to a method that are triggered intentionally, AND the event is `composed: false` you *might* get away with dispatching it sync. But, the preferred and default solution is always to dispatch it async. Future-tense events should run async.
