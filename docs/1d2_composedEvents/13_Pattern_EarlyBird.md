PrePropagation callback.
1. EarlyBird, just how to capture all instances of composed: true events with the same event listener. EarlyBirds should not stopPropagation(), unless they grab/block the event, and then they should be runnable in all instances. That makes them useful for event controllers that can be generalized and reusable.

1b. Problem of composed:true EarlyBird: Closed path. the original target is within a closed shadowRoot. This limits the EarlyBird. We cannot add event controller functionality for patterns of an event that occur within a closed root. This limitation is however probably good. As it helps limit the scope of elements inside each other. But sometimes it would be good, for example as when you add pseudo-classes. Here, we need a use-case when its bad, and a use-case when its good. This shouldn't be changed.

2. CagedEarlyBird captures all instances of composed:false events within a web component. This illustrate why event controllers cannot be added to composed: false events in a universal fashion. You can make event controllers for a scope, but never an event controller that works inside the scope of a closed shadowRoot.

PostPropagation callback.
1. use an earlyBird to add a toggleTick task in the event loop. Works, but is a bit heavy as we need a toggleTick or setTimeout. And, it makes all default actions async, even though default actions on sync events are not async.

2. this works for composed: false events where the event listener begins on the shadowRoot. But this is not really that necessary for composed: false events.
 
3.  EarlyBirdFail. But it doesn't work for closed shadowRoots for composed:true events. an earlybird event listener can never, ever read the full propagation path. Thus, if you want to add a default action when someone clicks on an element inside your shadowDom for the closed shadowRoot, that is not possible. This is never possible. The *only* way the path inside a closed shadowRoot can be read is from an event listener *inside* the shadowRoot. And the only way to avoid having that event listener torpedoed by stopPropagation, is to have an unstoppable eventlisteneroption that apply to all event listener.


  
Default actions cannot be added to elements and events within a closed shadowRoot. This is good, because that scope should be off limits. It is a question if default actions should ever be added "into" another web component..

Event controllers cannot read the path of closed ShadowRoots neither. This is also probably good.  

But.. We can't see native defaultActions inside closed shadowDoms of custom elements...
The EarlyBird is failing me..
It lost the worm...


We can patch the native defaultActions of native events, and we can show how to patch the native defaultActions of custom web components. But custom web components can't do this. So there is nothing to patch. Custom web components can't make defaultActions. So its ok.



# Pattern: EarlyBird

> gets the worm!

An EarlyBird captures any instance of an event type *before* all other event listener.
 
1. As we saw in the chapter "WhatIs: Bubbles?", the first target for all `{composed: true}` events is the **`window` node** in the **capture phase**. 

   `window.addEventListener("click", fun, {capture: true})`

2. If we extend the event listener on the `window` element to include our new, custom event listener option `first`, we can with also alter the sequence of the event listener on the `window` target to control the propagation order between event listeners within the same target node.

   `window.addEventListener("click", fun, {first: true, capture: true})`  

## Why and when EarlyBird?

EarlyBird event listeners should mainly be used for functions that do not alter the state of the DOM or anyplace else. If you need to alter state from an EarlyBird event listener, you should queue the state change to occur after the event has finished propagation and then check to see if `preventDefault()` has been run in between. Another suitable task for EarlyBird event listeners is to dispatch another event sync, before the event on which the EarlyBird is added fully propagates.

Below are some examples of tasks for which to use EarlyBird event listeners for:

#### 1. Block or mute an event

If you wanted to prevent *all* event listeners for `contextmenu` from being triggered, simply adding the following event listener would accomplish this:

```javascript
//the extended event listener options are loaded first
window.addEventListener("contextmenu", function(e){
  e.stopImmediatePropagation(); 
  e.preventDefault();
}, {
  capture: true, 
  first: true
});
``` 

#### 2. Custom EventComponents

todo update this

Native events often influence each other and browser actions. For example, native events often trigger the creation of other native events:  two `click`s performed on the same target in quick succession make a new `dblclick` event; and a `click` on a link will cause the browser to navigate to a new page. Events triggering new events and default actions we call event cascades.

Natively, the browser manages such event cascades *before* an event is dispatched to the DOM and the JS event listeners. The browser both creates the new `dblclick` event and queues the browser navigation task in the event loop *before* it dispatches the `click` event. To do this, the browser runs a set of event controller functions on every relevant event *before* the event is dispatched. We can call this functions that regulate and control the flow of events for EventComponents.

To make our own custom EventComponents is extremely useful. For two reasons.
1. EventComponents are highly reusable. If you have made a proper EventComponent for touch-based dragging, you can likely reuse this component *as is* in most other applications that would require the ability for dragging elements around the screen on a smartphone. Of course, the system controlling the EventComponents and the EventComponents themselves must be set up properly to handle conflict and visualization and manage event listeners efficiently, but with proper EventComponents this is actually doable. 
2. EventComponents are independent. They can be developed and maintained outside of the rest of the logic of the app. This is highly beneficial in reducing complexity of the app and highly beneficial in enabling proper testing and quality control. 

```javascript
//the extended event listener options are loaded first
window.addEventListener("contextmenu", function(e){
  //pass the event to a system that controls a set of EventComponents
}, {
  capture: true, 
  first: true
});
``` 

#### 3. Fix `MouseEvent.preventDefault()`

todo update this

Even though the mouse events `click`, `dblclick`, `auxclick`, and `contextmenu` are cascading from the `mouseup` and `mousedown` event, it is not possible to stop them by calling `.preventDefault()` from `mouseup` and `mousedown`. This can be problematic as a developer might use the mouse events for regular `click` events in some instances, but wish to block `click` if a certain sequence of for example `mousedown`, `mousemove`, and `mouseup` were in some contexts mean something else.

Instead of calling `.preventDefault()` from `mouseup`, we can use an EarlyBird event listener. We combine it with `immediatelyOnly` which removes the event listener as soon as all currently queued tasks in the event loop is cleared.

```javascript
//inside the mouseup event listener
element.addEventListener("mouseup", function(e){
  //instead of calling e.preventDefault(), which will not block the ensuing click
  window.addEventListener("click", function(e){
    e.stopImmediatePropagation(); 
    e.preventDefault();
  }, {
    capture: true, 
    priority: Number.MAX_SAFE_INTEGER,
    immediatelyOnly: true
  });
});
```

## References

 * 