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

## Pseudo-code: Basic event propagation

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
  function log(e){
    console.log(e.currentTarget.tagName);
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
DIV, 1
H1, 2
DIV, 3
```

## Demo: Naive event propagation in code
 
But, what do we need to make the pseudo-code above actually work? How far from "real" is "pseudo" above?

Not far. In fact, for this particular demo, we only need two adaptations:

1. To set the `currentTarget` property on the element requires the use of `Object.defineProperty(...)`. This is a small adjustment.

2. There is not such thing as `EventTarget.getEventListeners(eventName, phase)`. The browser hides the list of event listeners added to each element, document and window (ie. `EventTarget`), and to get a hold of that list we need to monkeypatch `addEventListener(...)` and  `removeEventListener(...)`.

```html
<script>
  const ogAdd = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (name, cb, options) {
    this._eventListeners || (this._eventListeners = {});
    this._eventListeners[name] || (this._eventListeners[name] = []);
    ogAdd.call(this, name, cb, options);
    this._eventListeners[name].push({
      cb,
      options
    });
  };

  EventTarget.prototype.getEventListeners = function (name, phase) {
    if (!this._eventListeners || !this._eventListeners[name])
      return [];
    if (phase === Event.AT_TARGET)
      return this._eventListeners[name].map(cbOptions => cbOptions.cb);
    if (phase === Event.CAPTURING_PHASE){
      return this._eventListeners[name]
        .filter(listener => listener.options === true || (listener.options && listener.options.capture === true))
        .map(cbOptions => cbOptions.cb);
    }
    //(phase === Event.BUBBLING_PHASE)
    return this._eventListeners[name]
      .filter(listener => !(listener.options === true || (listener.options && listener.options.capture === true)))
      .map(cbOptions => cbOptions.cb);
  };

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
    Object.defineProperty(event, "currentTarget", {value: currentTarget, writable: true});
    for (let listener of listeners)
      listener(event);
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
  function log(e){
    console.log(e.currentTarget.tagName);
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
DIV
H1
DIV
```   

In the next chapters, we look go more into detail in the event propagation algorithm.

## References

 * [MDN: Event bubbling and capture](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture)
 * [Google: Page lifecycle api](https://developers.google.com/web/updates/2018/07/page-lifecycle-api)
