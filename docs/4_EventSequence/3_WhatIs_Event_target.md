# WhatIs: Event.target

Native events and EventSequences uses one of several strategies to identify their `target`:

1. **`target`-less events** use the `window` as their target as they in principle have no target. They do *not* select out any particular element in the `document` because it would make no sense and *add no value*. Examples of such events are `resize`, `message`, and `offline`.
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

## References

 * [MDN: `drop` event](https://developer.mozilla.org/en-US/docs/Web/API/Document/drop_event)