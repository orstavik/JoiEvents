# Pattern: EarlyBird

> gets the worm!

An EarlyBird captures an event *before* any other event listener. This is now quite simple.
 
1. As we saw in the chapter about bubbling, the first target for *all* events is the **`window` node** in the **capture phase**. 

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