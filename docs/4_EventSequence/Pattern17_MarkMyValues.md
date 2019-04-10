# Pattern: MarkMyValues

## Fact: Event data gets lost

If you store an Event, it might not contain the needed information when you ask for it from the
Event object:

1. Data such as `composedPath()` is generated from the DOM *request time*. 
   If the DOM has been mutated *after* an event having occured, but *before* the event data is 
   requested, then the result from `composedPath()` *can* change.

2. The browser can garbage collect and delete *underlying* data of native event objects,
   at the end of an event's propagation, but *before* the event object itself is deleted.
   //todo do some tests to find good examples of such data, likely touch event data.

This means that some properties on an Event object might no longer be available 
if you try to read it asynchronously in a `setTimeout` or rAF callback.

<code-demo src="demo/LoosingEventData.html"></code-demo>

//todo find a good example of 
For example, even thought the DOM Event object of a touch event still exists, 
its `x` and `y` properties can become undefined at a later point.
Once the setTimeout is invoked, the DOM Event object that represent the trigger event
safely contains data such as the `timeStamp`, `type` and `target`, but might loose other data
such as `composedPath()` and //todo. 

## HowTo: avoid loosing event data

Both the ReplaceDefaultAction and AfterthoughtEvent patterns delay
the dispatch of the composed event asynchronously using `setTimeout(...)`. 
This means that if your composed event needs to use values from the trigger event object such as
`composedPath()` at the time when the event occured, then these values must be stored *specifically, 
up front*. 

**MarkMyValues** is the pattern of storing relevant trigger event values up-front. 
The MarkMyValues pattern is most often used in combination with the DetailOnDemand pattern.
When used with DetailOnDemand, the required values should be copied from the trigger event to the 
composed event during the construction of the DetailOnDemand object.

## Example: `long-press` with 30px wiggle room

<pretty-printer href="./demo/long-press-MarkMyValues.js"></pretty-printer>

## Demo: add a demo for long-press with 30px wiggle room

## Example: `triple-click` with little wiggle room

<pretty-printer href="./demo/triple-click-MarkMyValues.js"></pretty-printer>

## Demo: `triple-click` with little wiggle room

<code-demo src="./demo/triple-click-MarkMyValues.html"></code-demo>

## References

 * dunno
