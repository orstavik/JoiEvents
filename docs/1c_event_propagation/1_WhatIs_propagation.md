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
  console.log("Clicked:", e.target, e.eventPhase);
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

## Demo: Basic event propagation in pseudo-code

In the demo below we illustrate in JS pseudo code what event propagation basically looks like. As will be evident in later chapters, this is a *very* naive piece of code. But, it still serves as a good starting point to understand the core concept of event propagation. 

```html
<script>
  function getPath(target) {
    const path = [];
    while (target.parentNode !== null) {
      path.push(target);
      target = target.parentNode;
    }
    path.push(document, window);
    return path;
  }
  
  function callListenersOnElement(currentTarget, event, phase) {
    const listeners = currentTarget.getEventListeners(event.type, phase);
    event.currentTarget = currentTarget;
    for (let listener of listeners) 
      listener(event);
  }
  
  function dispatchEvent(target, event) {
    const propagationPath = getPath(target).slice(1);
    for (let currentTarget of propagationPath.slice().reverse())
      callListenersOnElement(currentTarget, event, Event.CAPTURING_PHASE, async);
    callListenersOnElement(target, event, Event.AT_TARGET, async);
    for (let currentTarget of propagationPath)
      callListenersOnElement(currentTarget, event, Event.BUBBLING_PHASE, async);
  }
</script>

<div>
  <h1>Hello sunshine</h1>
</div>

<script>
  let counter = 0;  
  function log(e){
    console.log(e.type + counter++);
  }  
                                                        
  const h1 = document.querySelector("h1");  
  const div = document.querySelector("div");  
  
  div.addEventListener("click", log, true);
  h1.addEventListener("click", log);
  div.addEventListener("click", log);
  
  dispatchEvent(h1, new MouseEvent("click", {bubbles: true}));
</script>
```

If the pseudo-code above worked, we would anticipate that it would result in:
```
click0
click1
click2
```     

## Adding two methods to the `EventTarget` API
 
But, what do we need to make the pseudo-code above actually work? How far from "real" is "pseudo" above? Not far. In fact, we only need the `.getEventListeners(eventName, phase)` extension to the `EventTarget` interface from our previous chapter. 

We therefore load a script that extends the `EventTarget.prototype` with a `.getEventListeners(eventName, phase)` and `.hasEventListener(eventName, cb, options)` method. We include this as `<script src="hasGetEventListeners.js"></script>`.
 
```javascript
function findEquivalentListener(registryList, listener, useCapture) {
  return registryList.findIndex(cbOptions => cbOptions.listener === listener && cbOptions.capture === useCapture);
}

const ogAdd = EventTarget.prototype.addEventListener;
const ogRemove = EventTarget.prototype.removeEventListener;

EventTarget.prototype.addEventListener = function (name, listener, options) {
  this._eventTargetRegistry || (this._eventTargetRegistry = {});
  this._eventTargetRegistry[name] || (this._eventTargetRegistry[name] = []);
  const entry = options instanceof Object ? Object.assign({listener}, options) : {listener, capture: options};
  entry.capture = !!entry.capture;
  const index = findEquivalentListener(this._eventTargetRegistry[name], listener, entry.capture);
  if (index >= 0)
    return;
  this._eventTargetRegistry[name].push(entry);
  ogAdd.call(this, name, listener, options);
};

EventTarget.prototype.removeEventListener = function (name, listener, options) {
  if (!this._eventTargetRegistry || !this._eventTargetRegistry[name])
    return;
  const capture = !!(options instanceof Object ? options.capture : options);
  const index = findEquivalentListener(this._eventTargetRegistry[name], listener, capture);
  if (index === -1)
    return;
  this._eventTargetRegistry[name].splice(index, 1);
  ogRemove.call(this, name, listener, options);
};

EventTarget.prototype.getEventListeners = function (name, phase) {
  if (!this._eventTargetRegistry || !this._eventTargetRegistry[name])
    return null;
  if (phase === Event.AT_TARGET)
    return this._eventTargetRegistry[name].slice();
  if (phase === Event.CAPTURING_PHASE)
    return this._eventTargetRegistry[name].filter(listener => listener.capture);
  //(phase === Event.BUBBLING_PHASE)
  return this._eventTargetRegistry[name].filter(listener => !listener.capture);
};

EventTarget.prototype.hasEventListener = function (name, cb, options) {
  if (!this._eventTargetRegistry || !this._eventTargetRegistry[name])
    return false;
  const capture = !!(options instanceof Object ? options.capture : options);
  const index = findEquivalentListener(this._eventTargetRegistry[name], cb, capture);
  return index !== -1;
};
```

## Demo: Naive event propagation running

```html
 <script src="hasGetEventListeners.js"></script>
<script>
  function getPath(target) {
    const path = [];
    while (target.parentNode !== null) {
      path.push(target);
      target = target.parentNode;
    }
    path.push(document, window);
    return path;
  }

  function callListenersOnElement(currentTarget, event, phase) {
    const listeners = currentTarget.getEventListeners(event.type, phase);
    if (!listeners)
      return;
    for (let listener of listeners)
      listener.listener(event);
  }

  function dispatchEvent(target, event) {
    const propagationPath = getPath(target).slice(1);
    for (let currentTarget of propagationPath.slice().reverse())
      callListenersOnElement(currentTarget, event, Event.CAPTURING_PHASE);
    callListenersOnElement(target, event, Event.AT_TARGET);
    for (let currentTarget of propagationPath)
      callListenersOnElement(currentTarget, event, Event.BUBBLING_PHASE);
  }
</script>

<div>
  <h1>Hello sunshine</h1>
</div>

<script>
  let counter = 0;  
  function log(e){
    console.log(e.type + counter++);
  }  

  const h1 = document.querySelector("h1");
  const div = document.querySelector("div");

  div.addEventListener("click", log, true);
  h1.addEventListener("click", log);
  div.addEventListener("click", log);

  dispatchEvent(h1, new MouseEvent("click", {bubbles: true}));
</script>
```

The naive demo runs and prints:

```
click0
click1
click2
```      

## References

 * [MDN: Event bubbling and capture](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture)
 * [Google: Page lifecycle api](https://developers.google.com/web/updates/2018/07/page-lifecycle-api)
