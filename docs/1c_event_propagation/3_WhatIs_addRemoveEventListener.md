# WhatIs: `addEventListener(..)` and `removeEventListener(..)`?

To better understand how `addEventListener(..)` and `removeEventListener(..)` works, we need to ask and answer a few simple questions:

1. Can I add the same event listener twice to the same element?
2. How are options treated when I remove an event listener from an element?

And we are going to cheat a little, we are going to give you the answers first, and then prove it to you in the demos:

1. You can add only *one* event listener to an element object with:
   * the exact same function object as callback and
   * the same `capture` value (either `true` vs. `false`/`undefined`).

2. When you remove an event listener from an element, then
   * the callback function must be the same object and
   * the `capture` value must match.

## Demo: adding and removing event listeners

In the demo below we illustrate how multiple matching event listeners are not added to the same element, and how matching event listeners are removed from the element.  

```html
<div id="outer">
  <h1 id="inner">Click on me!</h1>
</div>

<script>
  function log(e) {
    console.log(e.type + " on #" + e.currentTarget.id);
  }                         

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");
  
  //two log functions will be added, as the second log is a different function object 
  inner.addEventListener("click", log);
  inner.addEventListener("click", log);
  inner.addEventListener("click", log.bind({}));  //log.bind({}) creates a new function object instance 

  //only one log will be added,
  //the only option the addEventListener distinguishes is the boolean capture equivalent 
  outer.addEventListener("click", log);
  outer.addEventListener("click", log, false);
  outer.addEventListener("click", log, {capture: false});
  outer.addEventListener("click", log, {capture: false, passive: false});

  //only one log on outer capture phase will be added 
  outer.addEventListener("click", log, true);
  outer.addEventListener("click", log, {capture: true});
  //but then this log function is removed too, even though the options don't match on 
  //other properties than capture  
  outer.removeEventListener("click", log, {capture: true, passive: true});

  inner.dispatchEvent(new MouseEvent("click", {bubbles: true}));
  // dispatchEventSync(inner, (new MouseEvent("click", {bubbles: true}));
  // dispatchEventAsync(inner, (new MouseEvent("click", {bubbles: true}));
</script>
```

Results:

```
click on #inner
click on #inner
click on #outer
```

The test above shows that `addEventListener(...)` and `removeEventListener(...)` :
1. compares the event listener functions as objects. Thus two logs are added to `#inner`.
2. converts the `options` argument into a boolean value corresponding only to the options `capture` value. When checking if an event listener function can be added/removed from an element, the browser only compares the event listener function object and the options capture property.     

## Implementation: matchEventListeners

An event listener consists of *two* parts:
1. a callback function object and
2. a set of event listener options.

The event listener options can be either `undefined`, a boolean value signifying the capture value only, or an object with a set of event listener properties (e.g. `{capture: true, passive: false}`). To match two event listeners, we need to see if the callback function object is the same and the interpreted capture value of the event listener options are the same.

```javascript
function matchEventListeners(funA, optionsA, funB, optionsB){ 
  if (funA !== funB)
    return false;
  const a = optionsA === true || (optionsA instanceof Object && optionsA.capture === true);
  const b = optionsB === true || (optionsB instanceof Object && optionsB.capture === true);
  return a === b;
}
```    

## Demo: Adding and removing event listeners

```html
<script>
  function matchEventListeners(funA, optionsA, funB, optionsB) {
    if (funA !== funB)
      return false;
    const a = optionsA === true || (optionsA instanceof Object && optionsA.capture === true);
    const b = optionsB === true || (optionsB instanceof Object && optionsB.capture === true);
    return a === b;
  }

  const ogAdd = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (name, cb, options) {
    this._eventListeners || (this._eventListeners = {});
    this._eventListeners[name] || (this._eventListeners[name] = []);
    const index = this._eventListeners[name]
      .findIndex(cbOptions => matchEventListeners(cbOptions.cb, cbOptions.options, cb, options));
    if (index >= 0)
      return;
    ogAdd.call(this, name, cb, options);
    this._eventListeners[name].push({cb, options});
  };

  const ogRemove = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.removeEventListener = function (name, cb, options) {
    if (!this._eventListeners || !this._eventListeners[name])
      return;
    const index = this._eventListeners[name]
      .findIndex(cbOptions => matchEventListeners(cbOptions.cb, cbOptions.options, cb, options));
    if (index === -1)
      return;
    ogRemove.call(this, name, cb, options);
    this._eventListeners[name].splice(index, 1);
  };

  EventTarget.prototype.getEventListeners = function (name, phase) {
    if (!this._eventListeners || !this._eventListeners[name])
      return [];
    if (phase === Event.AT_TARGET)
      return this._eventListeners[name].map(cbOptions => cbOptions.cb);
    if (phase === Event.CAPTURING_PHASE) {
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
    Object.defineProperty(event, "currentTarget", {value: currentTarget});
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

<div id="outer">
  <h1 id="inner">Click on me!</h1>
</div>

<script>
  function log(e) {
    console.log(e.type + " on #" + e.currentTarget.id);
  }

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");

  //two log functions will be added, as the second log is a different function object
  inner.addEventListener("click", log);
  inner.addEventListener("click", log);
  inner.addEventListener("click", log.bind({}));  //log.bind({}) creates a new function object instance

  //only one log will be added,
  //the only option the addEventListener distinguishes is the boolean capture equivalent
  outer.addEventListener("click", log);
  outer.addEventListener("click", log, false);
  outer.addEventListener("click", log, {capture: false});
  outer.addEventListener("click", log, {capture: false, passive: false});

  //only one log on outer capture phase will be added
  outer.addEventListener("click", log, true);
  outer.addEventListener("click", log, {capture: true});
  //but then this log function is removed too, even though the options don't match on
  //other properties than capture
  outer.removeEventListener("click", log, {capture: true, passive: true});

  dispatchEvent(inner, new MouseEvent("click", {bubbles: true}));
  // dispatchEventSync(inner, (new MouseEvent("click", {bubbles: true}));
  // dispatchEventAsync(inner, (new MouseEvent("click", {bubbles: true}));
</script>
```

There are three modifications to our event propagation function:
1. We added `matchEventListeners(..)` to compare two event listeners for equivalence.
2. We used the `matchEventListeners(..)` in `addEventListener(..)` to avoid adding an equivalent event listener to an element that already contained one.
3. We added a `removeEventListener(..)` function that mirrors `addEventListener(..)`.    

## References

  * todo find this described in the spec.