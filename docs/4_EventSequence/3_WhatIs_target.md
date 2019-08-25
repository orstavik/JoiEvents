# WhatIs: the `target`

Native events and EventSequences uses one of several strategies to identify their `target`:

1. **`target`-less events** use the `window` as their target. They do *not* select out any particular element in the `document` because it would make no sense and *add no value*. Examples of such events are `resize`, `message`, and `offline`.
2. **User targeted events** select their target during the course of the event or EventSequence itself. Mouse- and touch-based events are good examples of such targeting.
3. **State targeted events** use elements that have already been marked as being the active target in the DOM. `keydown` for example uses as their target the element marked as having `focus`.

## One event, one target 

An event can only have a single target (which can be `window`). If your event needs to target a group of elements, then it should either a) look up the DOM to find a single, common ancestor, b) skip some targets, or c) dispatch multiple events, one for each targeted element.

An example of a) an event that goes up the DOM to find the nearest ancestor is the `change` event. As the user selects an `<option>` in a `<select>`, a `change` event is fired. The `change` event can be seen as affecting *two* targets: a previously selected `<option>` now being deselected, and the `<option>` being selected now. If the `change` event were to be fired from the `<option>` elements, then you would either have fire *two* events or set *two* targets to capture the change of state.

An example of b) is the `click` event. If *two* or more elements overlap the same screen space, then only the top-most element is `click`ed. Any `click` event on elements positioned "behind" the topmost element are simply discarded, even when the topmost element is fully transparent. 

An example of c) is the `mouseenter` and `mouseleave` events. A single `mousemove` can cause the mouse cursor to enter the screen space of one element and leave the screen space of another. In other words, as the mouse moves the state of `hover` can change for *two* or more elements at the same time. Now, if only a `mousemove` event was fired, its target would be the element over which the cursor *enters* or floats *over*. To avoid forcing the developer to remember the state of previously hovered elements, the browser dispatches *two* additional events, `mouseenter` and `mouseleave`, that can apply to both possible targets. 

## Targets in EventSequences

Drag'n'drop is a native EventSequence. Using the mouse, it registers a sequence of `mousedown`, `mousemove`, and `mouseup` events so that elements can be dragged around on screen. A problem for the drag'n'drop EventSequence is that it has two different types of targets: a) the dragged element being moved around, and b) the element(s) the dragged element can be dragged over and dropped into. 

To solve this issue of *two* different targets, the native drag'n'drop EventSequence dispatches *two* different sets of events:
1. The `dragend`, `drag`, `dragend` events targets the dragged element. During the drag'n'drop EventSequence, this target remains fixed and immutable from beginning till end.
2. The `dragenter`, `dragover`, `dragleave`, and `drop` targets different elements, similar to `mouseenter`, `mousemove`, and `mouseleave`.  

## Targets, `bubble` and propagation

Above we stated "one event, one target". However, it is theoretically possible to associate multiple targets to the same event object. In fact, when events propagate down and up through the target's ancestors, it hits multiple "target" elements. Different event listeners added to different elements often do respond to the same event. Viewed from this perspective, the `target` of event that do `bubble` is "a list of elements in the DOM", not a single element.

This illustrate that the `target` is more than a simple JS property on the `Event` object. The a) `Event.target` and b) `Event.bubble` properties combines with c) `HTMLElement.addEventListener()` and other methods to form a *grammatical* construct: event propagation. 

But, how does an understanding of event propagation as a grammatical construct help us to choose and maintain good `target`s for our composed events? We can think of grammatical constructs as a set of rules that connects different properties *to do something*. If you change the content of one property in such a structure, this will also influence the meaning of the other properties. The properties has builtin "side-effects" to each other, always.

So, when we look at one property in such a grammatical unit, we cannot fully understand it without also looking at the other inter-connected properties. We can't understand the meaning of `target` on its own. For event propagation, this means that we should view at least *five* properties together:

1. the event's `name`,
2. the event's `target`,
3. the `bubble` property,
4. the structure of the DOM as described in HTML, and
5. the JS methods that control event listener functions such as `addEventListener("eventname")`.

When it comes to event listeners, there are also often some *semantic* relationships to other properties as well, for example:

6. Many native events, HTML attributes can also control event listeners (cf. `onclick="..."`).
7. Some modern CSS properties such as `pointer-events: none` can also apply settings that will affect whether or not an event will propagate to a potential `target` element. 

So, when you choose the `target` for an event, you need to consider the same event's `bubble` property, its name, the likely DOM constellations it will occur in, and why and where a developer would need to listen for the event. 

## References

 * [MDN: `drop` event](https://developer.mozilla.org/en-US/docs/Web/API/Document/drop_event)