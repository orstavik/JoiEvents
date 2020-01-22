# WhatIs: `target` and `currentTarget`?

The `target` is the node in the DOM at which the whole event is directed. 
The `currentTarget` is the node on which the event listener is attached.

## Demo: adding and removing event listeners

In the demo below we illustrate how multiple matching event listeners are not added to the same element, and how matching event listeners are removed from the element.  

```html
<div id="outer">
  <h1 id="inner">Click on me!</h1>
</div>

<script>
  function log(e) {
    console.log(e.type, e.currentTarget.id, e.target.id);
  }

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");

  inner.addEventListener("click", log);
  outer.addEventListener("click", log);

  inner.dispatchEvent(new MouseEvent("click", {bubbles: true}));
</script>
```

Results:

```
click, #inner, #inner
click, #inner, #outer
```

Setting the `target` is done *once* at *the beginning* of each event propagation. Setting the `currentTarget` is done every time the event propagation function calls event listeners on a new node in the event propagation path.   

## Demo: Setting `target` and `currentTarget`

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
    Object.defineProperty(event, "currentTarget", {value: currentTarget});
    for (let listener of listeners)
      listener(event);
  }

  function dispatchEvent(target, event) {
    Object.defineProperty(event, "target", {value: target});
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
    console.log(e.type, e.currentTarget.id, e.target.id);
  }

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");

  inner.addEventListener("click", log);
  outer.addEventListener("click", log);

  dispatchEvent(inner, new MouseEvent("click", {bubbles: true}));
</script>
```

You might already have detected that we added the currentTarget in the previous chapter.

## References

  * todo find this described in the spec.