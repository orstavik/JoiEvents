# WhatIs: event?

At its heart an event is a small package of pure, immutable data: a small text message.

## Why pure data?

The purpose of the event system is to pass messages about state changes between functions that do not know about each other. If the event object contained many methods specific to it, this would be counter-intuitive and counter-productive. By passing only pure data between functions in the event system, the bindings between the sender and receiving functions diminish. 
 
## Why immutable data?

The event data should be immutable. The reason for this is that when an event propagates, the event listeners most commonly use the event to trigger some other reactive state change in the application. These state changes occur in the DOM, but if the event itself also contained mutable data that later event listeners would read and respond to, each event listener would have two sources of mutable state to contend with. By keeping the data in the event immutable, and by convention specify that event listeners mutate the DOM only, event listeners only need to contend with one domain of mutable data structures: the DOM. 

## Demo: Validate the invalid

```html
<input value="ABC" pattern="[a-z]*">
<script>
  const input = document.querySelector("input");
  input.addEventListener("invalid", function(e){
    console.log(e.target.validity.patternMismatch);
    if(e.target.validity.patternMismatch)
      e.target.value = e.target.value.toLowerCase();
  });
  input.addEventListener("invalid", function(e){
    console.log(e.target.validity.patternMismatch);
  });
  input.checkValidity();
</script>
```

The `invalid` event has no event specific data, only its `type` name and its `target` element.  the `.validity` property on the `<input>` element (the `target` for the `invalid` event) holds the data about why/how the value fails to comply with the `.checkValidity()` function. This means that if the first event listener fixes a validity issue on an `<input>` element, later event listeners for the same `invalid` event will get a correct, up-to-date view of the `<input>` element's `validity` when they query it directly from the `<input>` element as opposed to from the `invalid` event.

It should be noted though, that since a) the event's `type` name is `invalid`, but that b) the `target` `<input>` element is now valid, there is still lots of room for confusion. 
 
## Why so little data?

There are two reasons why events should contain **as little data as possible**:

1. The event often represent state changes in the DOM. In such instances, the DOM would also contain a version of the state that has changed. If the event copied this state data into itself, then there would be two sources of truth. This is bad in principle, but it would be especially bad for events when for example one event listener would change this state in the DOM after the event, and then a second event listener would receive the same event, but this time the event data would be outdated. 

2. The less data an event message contains, the simpler the event's data structure. The more complex the data structure is for a message exchanged between two functions, the more these two functions need to know about each other (the tighter the binding/dependency between them). By keeping the data in the event to a minimum, the simpler it is several independent functions to harmonize their reaction to a state change.
   
## What data *do* events contain?

The *two* most important parts of an event is the event's `target` and `type` name. The `type` is metadata, it provides the functions that dispatch and subscribe to the state change with a common semantic handle. The `target` provides the event with a reference to a point in the DOM from where the relevant data about state change the event announces can be obtained. In essence, most events contain only these two pieces of information. We will describe both in the next chapters.
 
However, additional information might be required in two circumstances:
1. Event data as **historical record**. Any state change involves a change from "something" and to "something else". The DOM however is synchronic, it only contains data about its *current* state, ie. either about "something" or "something else". Therefore, depending on whether the event is dispatched *before* or *after* the state change, the DOM can only contain information about *one* or the states. And in these circumstances, either the *previous state* (for events dispatched after the DOM has been updated) or *coming state* (for events dispatched before the DOM has been updated) can/should be added as data to the event.

   However, one common strategy for events is not to add this data in the event object directly, but instead add this data under the property `.relatedTarget`. The `relatedTarget` is a property in the event object that refers to another DOM element from that point to the previous state or the future state, depending on the tense of the event.
   
2. Event data as **external state**. Some state changes occur *outside* the DOM. This means that functions that react to the event cannot read the state behind the event from within the DOM. For example, there is neither any DOM node, nor any property on the `window` that represents the active pointer devices in the browser. Functions in the browser therefore cannot read the position of the pointer from the DOM, and therefore the data about the pointer position must be added to the event itself.

   Now, it could very well be argued that it would be better design to make the state of the pointer accessible via the DOM. However, it is likely that pointer events still should contain data about the pointer position, as the pointer data could be updated in parallel with the functions reacting to the pointer events.
   
## Event methods 1: existing method

The `Event` class contains a few *universal* methods/getter functions. None of these methods are associated with a particular event. Instead, these methods relay control to the *event system*, not the event data or the state change the event represent.

The following getter methods (indirectly) *reads*/*controls* the state of the event system's propagation:
* `.eventPhase`
* `.bubbles`
* `.composed`
* `.composedPath()`
* `.stopPropagation()`          (control)
* `.stopImmediatePropagation()` (control)

The following methods (indirectly) *read*/*control* the state of the event system's default action management:
* `.defaultPrevented`
* `.preventDefault()` (control)

There are three things that are worth noting here:
1. `.composedPath()` is a property added to the event because the *path* of the event is different than the *path* of the `target` element. Why? The data *and* propagation path of the event is frozen when the event is first dispatched, and thus remains immutable during event propagation. However, the `target` element and the rest of the DOM is mutable during event propagation. Hence, if the first event listener moved the `target` element, then the equivalent of `.composedPath()` on the `target` element itself would change and thus be different than the `.composedPath()` for the event which is midway in its propagation. Thus, while you might need a `.composedPath()` (or `path(composed)` method on an element, the `.composedPath()` is still different because it represents the `target` elements `.path(composed)` at the outset of the event).

2. Most of the API is directed towards the event system's propagation subsystem; only two properties (`preventDefault()` and `defaultPrevented`) are directed towards the event system's default action subsystem; and no methods are directed towards the event system's event controller subsystem.

3. All the methods on the event relay information to the event system in the browser. It would be more conceptually accurate if they were called: `EventPropagation.stop(eventInstance)` and `EventDefaultAction.prevent(eventInstance)`. This is so important that it is worth repeating.

## Event methods 2: pure functions

When processing events, there are recurring use-cases. For example, many functions that process `<form>` events such as `submit` and `reset` might need an overview of the processed data from the event's `target`. However, this use-case is not necessarily associated with the event, but rather the `target` element. Thus, static methods or constructors such as `new FormData(formElement)` can be established independently of the event, and independently of the `target` element, as is the case with `new FormData(formElement)`. 

## Event methods 3: What about `composed: true` events?

When `composed: true` events propagate outside the `shadowRoot` of a web component, then the `target` is re-assigned to the `host` node. For `open` shadowDOMs, the original `target` is still accessible as `event.composedPath()[0]`, but for `closed` shadowDOMs, the original `target` can no longer be found. In any case, the `target` of the event is no longer the direct source for the state that has/will change.

Best practice to solve this problem is to:
 * *not* alter the event object, 
 * *not* make the internal, original `target` available outside of the shadowDOM, but instead to
 * **mirror the properties of inner `target` element inside the shadowDOM on host node of the web component that the event is re-`target`ed to. 
 
This makes the `target` of the event behave the same when the event propagates both outside and inside the web component. Note, this require some foresight on the part of the developer of the web component: which `composed: true` events that might `target` some of the elements inside my shadowDOM will likely be listened for outside and around my host node? And, which properties of these `target` elements inside my shadowDOM would be relevant for such event listeners?

An alternative approach is to add a set of getter functions to the event that relay the query to the element inside the shadowDOM. But, this is a poor approach. It is cumbersome to implement. It has poor performance. It breaks the above convention that event objects are pure data. And it would produce different implementations for solving the same task in event listeners inside vs. outside the web component.

## References

 * 