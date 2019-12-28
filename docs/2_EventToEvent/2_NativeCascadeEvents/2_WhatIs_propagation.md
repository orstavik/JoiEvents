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

Some events do not bubble. But. And hold on to your hat! Non-bubbling events still propagate *down* in the *capture phase*. It is *only phase 3, the upward propagation from the `target`'s parent to the `window` that is stopped*. Non-bubbling events operate exactly like bubbling events that has an event listener that calls `.stopPropagation()` on its target element. 
                           
<code-demo src="demo/NonBubblingEventsDoStillCapture.html"></code-demo>

Examples of non-bubbling events are:

1. Resource life-cycle events: `load`, `error`, `abort`, `beforeunload`, `unload`.
2. Legacy UI events: `focus`/`blur`, `mouseenter`/`mouseleave`. These non-bubbling event pairs has been given a bubbling cousin pair: `focusin`/`focusout` and `mouseover`/`mouseout`.
3. Legacy DOM mutation events: `DOMNodeRemovedFromDocument`/`DOMNodeInsertedIntoDocument`. These DOM mutation events have been replaced by `MutationObserver`.
4. The `resize`, `online`, `offline` events.
5. The `toggle` event.

When you make your own custom events, the **the default option is `bubble: true`**. The real question is: would you ever make a non-bubbling event, and if so, why?
1. You would not make a custom event `bubble: false` for performance reasons. For non-bubbling events, the browser still needs to compute a list of event listeners for both the capture and target phases. Thus, no underlying computation is really avoided by listing functions from only two, instead of three propagation phases.
2. If the custom event always targets the `window`, the custom event will never do anything but propagation phase, so it doesn't matter if the `bubble` is `true` or `false` or `Schrodinger's cat`.  
3. Two facts:
   * To check if the `eventListener` is added to the `target` element, you can choose from two simple checks: `event.currentTarget === event.target` or `event.phase === 2`. 
   * To listen for an event that does not bubble, you either need to know its non-bubbling target (in the target phase) or step into the capture phase that in a sense bypasses the non-bubbling property.
   
   This means that you can make all eventListeners `non-bubbly` by either adding `if(event.phase > 2) return;` to them, and/or by adding `if(event.phase === 2) event.stopPropagation();` to the event listener added to the `target`. 

In my opinion, there rarely would be any benefit of using `bubble: false` in a customEvent. Some use-cases for your custom event might benefit from bubbling, and to make it more reusable, it should likely `bubble: true`. From my current position, I do not see any use-case for reusable custom events where the benefits of `bubble: false` would likely outweigh the benefits of `bubble: true`.

## References

 * [MDN: Event bubbling and capture](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture)
 * [Google: Page lifecycle api](https://developers.google.com/web/updates/2018/07/page-lifecycle-api)