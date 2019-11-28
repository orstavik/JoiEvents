# WhatIs: Propagation

> For an introduction to event propagation and bubbling, see: [MDN: Event bubbling and capture](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).

Almost **all events bubble**, except:
 * `window` events (`load`, `error`).
 * a few (legacy?) events. However, these non-bubbling DOM events have either been duplicated by identical events that *do* bubble or replaced by `MutationObserver`:
    * `focus`/`blur` -> `focusin`/`focusout` 
    * `mouseenter`/`mouseleave` -> `mouseover`/`mouseout`
    * `DOMNodeRemovedFromDocument`/`DOMNodeInsertedIntoDocument` -> `MutationObserver`.

## Example 1: Capture vs. Bubble phase

<code-demo src="demo/BubbleCapture.html"></code-demo>
   
The example above has a small DOM with a couple of elements. To these elements, there are added some click listeners. If you click on "Hello sunshine!", you will see in the log that the event listeners will be called in the following sequence:

1. The event is *captured*. The sequence here is top-down, from the `window` towards the `target`. 
   
2. *At the target* the event listeners are processed in the sequence they were added, completely disregarding if they were marked with `capture` or not. This means that when you click on "Hello sunshine!", the `"bubble"` event listener will be triggered before the `"capture"` event listener. This is a problem when you need to give priority to certain event listeners in order to for example block an event (cf. the StopTheUnstoppable and EarlyBird patterns).

3. The event is *bubbles*. The sequence here is down-top, from the `target` parentNode to the `window`.

 * If two event listeners are added on the same element in the same propagation phase, then they will be run in the order that they were added.

## References

 * [MDN: Event bubbling and capture](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture)