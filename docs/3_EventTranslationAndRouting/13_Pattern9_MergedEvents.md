# Pattern: MergedEvents

> Pointer events are MergedEvents of mouse events and touch events.

## Problem: Why merge events?

Sometimes, two events in the DOM mean the same thing for the app.
For example, often your app don't care if its a `mousedown` or a `touchstart` that is triggered.
And this is rarely a problem. Your event listener mostly needs to be triggered and/or
access the event's target, and these aspects might be the same regardless of event type.
In such fortunate circumstances, the app developer can simple attach two instead of one event
listener for each overlapping event type and go on his merry way.

However. This is of course not always so. Looking back at the two previous chapters and the `link-click`,
this event's defaultAction will que a "browse" task, ie. cause the browser to load a new page from the
specified `href` location or scroll internally to the hashlocation. 
But, so will the defaultAction of the `submit` event too. 
Both the `link-click` and `submit` events trigger the navigation task.

Ok, so far so good. We have two event types, we simply add two event listeners.
But, when listening for the two different "browse" events, we likely need to process some more data.
Simply being informed about the event occurring and its target is not enough. 
When we process a browse event we also need to know about:
 * the `baseURI` (or the first `<base href="...">` for that browsing context (read: `window`) if 
   the `baseURI` is not available)
 * the `href` of the link.
 
We might even like to know about the `method`, `target`, `relList`, and `download` properties of the browse
event/coming request. 
But these properties are not readily accessible from either 
the `link-click` event, or the `submit` event, or both.
To find this information takes time. And dedication. And could be a source of bugs.
 
And so, we crank up our pattern machine and employ a new pattern MergedEvents to stamp it out.

## HowTo: merge events

The MergedEvents pattern is simple. It listens for two events, and then dispatch a new custom, composed 
event every time one of these trigger events occur. This new composed event is likely extended with 
one or more DetailsOnDemand that harmonize the different events and their input. That is it.
The MergedEvents pattern can also be combined with the TypedEvents or AttributeFilteredEvents pattern.
And other event patterns.

## Example: `browse` event

The `browse` event merges the `link-click` and the `submit` events.
Its main purpose is to unify the interface of these two events, mainly by offering:
 * a polyfill for the `baseURI` and
 * a `getHref()` method for `submit` events, that translates the `action` property *and*
   includes a correct query string for `<form method="GET">`s.
 * a `resolvedURL()` method for the complete absolute location based on `getHref()` and `baseURI`, and
 * a convenience method `isExternal()` that returns true if:
   1. the `resolvedURL()` does not start with `baseURI` or
   2. the link target has `external` as a `rel` property (and polyfill `LinkElement.relList`) or
   3. the link target has `download` set to true or
   4. the link target has a `target` attribute that does not point to the current browsing context 
      (ie. is different from "_self").

Put together, and based on the `link-click`, the full `browse` event trigger function becomes:

<pretty-printer href="../../src/browse.js"></pretty-printer>
   
## Demo: one `browse` event to route them all

<code-demo src="./demo/browse.html"></code-demo>

## Native MergedEvents: Pointer events

Lots have been written about pointer and touch events, and we will not go into the details of it here.
We will simply state that pointer events is a MergedEvents of both mouse and touch events, and 
that as most modern browsers (except Safari) now implement support for PointerEvents, the browsers
dispatch both the triggering touch or mouse event and the pointer merged event.

Pointer events therefore provide an excellent alternative if you need to process touch and mouse events
as one. Except for one thing. Dynamic control. The merged pointer events do not extend the
ability to prevent default behavior of its trigger events.

See [Problem: TapDance](../6_TouchGestures/Problem6_TapDance) for more details.

## References

 * [MDN: `baseURI`](https://developer.mozilla.org/en-US/docs/Web/API/Node/baseURI)
 * todo add references for PeP and Pointer events.
                                                                            