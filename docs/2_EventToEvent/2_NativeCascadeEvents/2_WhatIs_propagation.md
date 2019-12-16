# WhatIs: EventPropagation

> For an introduction to event propagation and bubbling, see: [MDN: Event bubbling and capture](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).

When events bubble, they go:
1. *down* from the `window` to the `parentNode` of the `target` element (capture phase),
2. *through* the `target` element (target phase), and
3. *up* from the `parentNode` of the `target` element to the `window` again (bubbling phase).

Event listeners for an event are thus processed in the top-down order for the ancestor elements for an events target element in the capture phase, then the event listeners for the target, and then in bottom-up order for the ancestor elements in the bubbling phase. If more than one event listener is added to an element for the same event in the same phase, they are run in the same order that they were added. *In the target phase, the browser **ignores** whether or not the event listener were intended for the capturing or bubbling phase, and runs all event listeners in the **order they were added***.

```javascript
const options = {capture: true}; 
function myClickHandler(e){
  console.log("Clicked:", e.target);
} 
//the default phase for event listeners is bubbling
element.addEventListener("click", myClickHandler, options);
```

There are two valid critiques of the conceptual structure of event bubbling in web browsers:
1. The name "capture phase" is misleading. In principle, events are "captured" in all three phases of event bubbling. Therefore, the name "capture phase" does not distinguish the initial phase from the two other subsequent phases. Alternative names for the "capture phase" could be "the initial phase", the "down-ward phase", or the "sinking phase" (as opposed to the the "bubbling phase").
2. Why does the browser ignore the capture and bubble phase properties of event listeners during the target phase? Event listeners added in the capture phase usually serve other purposes than event listeners added in the bubble phase, and so to ignore this property creates more problems than it solves.

## Example 1: Capture vs. Bubble phase

<code-demo src="demo/BubbleCapture.html"></code-demo>
   
The example above has a small DOM with a couple of elements. To these elements, there are added some click listeners. If you click on "Hello sunshine!", you will see in the log that the event listeners will be called in the following sequence:

1. The event is *captured*. The sequence here is top-down, from the `window` towards the `target`. 
   
2. *At the target* the event listeners are processed in the sequence they were added, completely disregarding if they were marked with `capture` or not. This means that when you click on "Hello sunshine!", the `"bubble"` event listener will be triggered before the `"capture"` event listener. This is a problem when you need to give priority to certain event listeners in order to for example block an event (cf. the StopTheUnstoppable and EarlyBird patterns).

3. The event is *bubbles*. The sequence here is down-top, from the `target` parentNode to the `window`.

 * If two event listeners are added on the same element in the same propagation phase, then they will be run in the order that they were added.

### Event propagation vs event bubbling

"Event propagation" means that the browser triggers event listeners for that event. For events  that `bubbles`, this means going down and up the DOM searching for event listeners. But, not all events bubble. Thus, event propagation should be understood as both triggering event listeners for both a single element and a target element and its ancestors. 

## Non-bubbling events?

Almost all events bubble. There are only a few exceptions:

1. `window` events (`load`, `error`, `resize`). But. `window` events doesn't really need to bubble. Although they very well could have, since it wouldn't matter.

2. Legacy UIX events
    * `focus`/`blur` 
    * `mouseenter`/`mouseleave`
   
   But. These legacy, non-bubbling events have been replaced by either equivalent events that *do* bubble:
     * `focusin`/`focusout` 
     * `mouseover`/`mouseout`

3. Legacy DOM mutation events:
    * `DOMNodeRemovedFromDocument`/`DOMNodeInsertedIntoDocument`     

   But. These DOM mutation events have been replaced by `MutationObserver`.

4. The `load` event on `<script>`, `<img>`, and `<svg>` elements.

Put simply, if you make your own events, make them bubble. If the browsers was made new today, all native events would probably be `bubble: true` (and we wouldn't bother with the `bubble` property).

## References

 * [MDN: Event bubbling and capture](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture)