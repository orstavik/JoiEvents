# WhatIs: the `target`

Native events and EventSequences uses one of several strategies to identify their `target`:

1. **`target`-less events** use the `window` as their target. They do *not* select out any particular element in the `document` because it makes no sense and adds no value. Examples of such events are `beforeprint`, `message`, and `offline`.
2. **User targeted events** select a DOM element as their target during the course of the event or EventSequence itself. Mouse- and touch-based events are good examples of such targeting.
3. **State targeted events** use elements that a different event has already marked as being the active target in the DOM. `keydown` for example uses as their target the element marked as having `focus`.

## One event, one target 

*One* event can only have *one* target. If your event needs to target a group of elements, then it must either:
 
1. **skip targets**. An example of this is the `click` event. If *two* or more elements overlap the same screen space, then only the top-most element is `click`ed. Any `click` event on elements positioned "behind" the topmost element are simply discarded, even when the topmost element is fully transparent. 

2. **dispatch multiple events, one for each target**. An example of this strategy is the `mouseenter` and `mouseleave` events. A single `mousemove` event can cause the mouse cursor to enter the screen space of one element and leave the screen space of another. In other words, as the mouse moves the state of `hover` can change for *two* or more elements at the same time. Now, if only a `mousemove` event was fired, its target would likely be the element over which the cursor *enters* or floats *over*. To avoid forcing the developer to remember the state of previously hovered elements, the browser dispatches *two* events, in addition to `mousemove`: `mouseenter` and `mouseleave`.

3. **dispatch from a common ancestor up the DOM**. The `change` event is dispatched from a shared ancestor. When a user selects an `<option>` in a `<select>`, a `change` event is fired on the `<select>` parent, not the `<option>` child. This is because the `change` event affects *two* targets: a) the previously selected `<option>` now being deselected, and  b) the `<option>` now being selected. If the `change` event were to be fired from the `<option>` elements, then you would either need *two* different events or skip firing an event for the `<option>` being deselected.

## Targets in EventSequences

Drag'n'drop is a native EventSequence. Using the mouse, it registers a sequence of `mousedown`, `mousemove`, and `mouseup` events so that elements can be dragged around on screen. A problem for the drag'n'drop EventSequence is that it has two different types of targets: a) the dragged element being moved around, and b) the element(s) the dragged element can be dragged over and dropped into. 

To solve this issue of *two* different targets, the native drag'n'drop EventSequence dispatches *two* different sets of events:
1. The `dragend`, `drag`, `dragend` events targets the dragged element. During the drag'n'drop EventSequence, this target remains fixed and immutable from beginning till end.
2. The `dragenter`, `dragover`, `dragleave`, and `drop` targets different elements, similar to `mouseenter`, `mousemove`, and `mouseleave`.  

## Why event diversity?

The browser dispatch many and diverse events that often more or less overlap each other. 

 * the `mousemove` event could well be used to extract info about which elements are currently hovered, and which are not. Still, the browser dispatches five(!) closely related events: `mousemove`, `mouseenter`, `mouseleave`, `mouseover`, `mouseout`. 
 * The drag'n'drop events `dragenter`, `dragover`, `dragleave`, and `drop` also overlap `mouseenter`, `mousemove`, and `mouseleave` closely. One could easily assume that for example `dragenter` and `dragleave` could be implemented using listeners for `dragstart` initiating listeners for `mouseenter` and `mouseleave` instead.
 
The reason for this event diversity in the browser is both efficiency and developer ergonomics. The cursor does not enter the space of a new element for every `mousemove`. Therefore, the events `mouseenter` does not need to be dispatched as often as `mousemove`, triggering the JS event listener more rarely. Second, if the same event type was used for all purposes, the beginning of event listeners would quickly fill up with boilerplate if-else-if's. As the browser easily and quickly can distinguish between common states, the end code becomes much clearer with diverse event types (such as `mousemove`, `mouseenter`, `mouseleave`) that all essentially reflect the same underlying event (the user moving the mouse a single pixel).

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