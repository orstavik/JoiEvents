# Problem: LostEventData

If you store an Event, it might not contain the needed information when you ask for it from the Event object:

1. Data such as `composedPath()` is generated from the DOM *request time*. If the DOM has been mutated *after* an event having occured, but *before* the event data is requested, then the result from `composedPath()` *can* change.

2. TODO. Is this wrong?? We must shove this happening. The browser can garbage collect and delete *underlying* data of native event objects, at the end of an event's propagation, but *before* the event object itself is deleted.
   //todo do some tests to find good examples of such data, likely touch event data.

3. //todo 
   For example, even thought the DOM Event object of a touch event still exists, its `x` and `y` properties can become undefined at a later point. Once the setTimeout is invoked, the DOM Event object that represent the trigger event safely contains data such as the `timeStamp`, `type` and `target`. //todo. 

This means that some properties on an Event object might no longer be available if you try to read it asynchronously in a `setTimeout` or rAF callback.

<code-demo src="demo/LoosingEventData.html"></code-demo>

## Loosing event data

To delay processing of event objects is common. Processing of events can often be toggled and debounced, and patterns such as AfterthoughtEvent and ReplaceDefaultAction delay dispatching composed event asynchronously using `setTimeout(...)`. Thus, developers of events can rarely assume that their event objects will be processed synchronously.

If your composed event needs to preserve values from the trigger event object such as `composedPath()` as it was when the trigger event occured, then these values must be stored *specifically, up front*. 

## Example: `long-press` with 30px wiggle room

<pretty-printer href="./demo/long-press-MarkMyValues.js"></pretty-printer>

## Demo: add a demo for long-press with 30px wiggle room

## Example: `triple-click` with little wiggle room

<pretty-printer href="./demo/triple-click-MarkMyValues.js"></pretty-printer>

## Demo: `triple-click` with little wiggle room

<code-demo src="./demo/triple-click-MarkMyValues.html"></code-demo>

## References

 * dunno
