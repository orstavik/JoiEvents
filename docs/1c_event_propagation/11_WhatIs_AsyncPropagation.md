# WhatIs: Async propagation?

When browsers dispatch native events such as `click`, they will queue the event listeners in *the top-most prioritized* macrotask queue in the event loop (or some other queue that functions to this effect). This queue has a **lower priority than the microtask queue**.

When script dispatches an event, their event listeners are executed synchronously: the browser simply loops through each task. This loop catches errors, as described in earlier, but this loop has still a **higher priority than the microtask queue**. Examples of triggering event listeners triggered via scripts:
 * `el.click()`, 
 * `dispatchEvent(new MouseEvent("click", {bubbles: true}))`, and
 * `dispatchEvent(new CustomEvent("my-event"))`.

Browsers *also* do dispatch some events such as `error` *synchronously*.

## Demo: Sync vs async `click` propagation   

```html
<div id="outer">
  <h1 id="inner">Click on me!</h1>
</div>

<script>
  function log(e) {
    const thisTarget = e.currentTarget.id;
    console.log(e.type + " on #" + thisTarget);
    Promise.resolve().then(function() {
      console.log("microtask from #" + thisTarget);
    });
  }
  
  function log2(e){
    log(e);
  }

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");
  
  inner.addEventListener("click", log);
  inner.addEventListener("click", log2);
  outer.addEventListener("click", log);

  inner.dispatchEvent(new MouseEvent("click", {bubbles: true}));
</script>
```

When you `click` on "Click on me!" using either mouse or touch, then you will see the following result printed out in the console.

```

1. click on #inner
2. click on #outer
3. microtask from #inner
4. microtask from #inner
5. microtask from #outer
6. nested microtask from #inner
7. nested microtask from #inner
8. nested microtask from #outer

9.  click on #inner
10. microtask from #inner
11. nested microtask from #inner
12. click on #inner
13. microtask from #inner
14. nested microtask from #inner
15. click on #outer
16. microtask from #outer
17. nested microtask from #outer

``` 

In the demo, there are three functionally identical event listeners triggered per click: first two on the `#inner` element, and then one on the `#outer` element. Each event listener prints to the console that they are running and then adds a first, normal task/callback to the microtask queue. Then, when this first task is run from the microtask queue, then it adds a second, nested task/callback to the microtask queue.

 * Lines 1-8 is the output from `.dispatchEvent(new MouseEvent("click", {bubbles: true}))` on the "Click on me!" element.
   1. All the three event listeners are run first.
   2. Then the three normal, "first" microtasks from each event listener run.
   3. At the end the three nested, "second" microtasks run.
    
 * Lines 9-17 is the output from the "native" reaction to the user action of clicking on "Click on me!" with either mouse or touch. Here, each event listener is run as its own macro task, so that *before* the next event listener is called, the microtask queue is completely emptied.
 
## Problem

There is a problem with events propagating both sync and async:

**if you inside an event listener queue a task in the microtask queue, you often don't know if this task will run before or after the next event listener in line.**
 
There are exceptions to this rule:
 * If you listen for `error` event or some similar that the browser *always* dispatches in sync mode, then you know that microtask triggered by your event listener will always run *after* all the other event listeners for the same event has been triggered.
 * If you know that no script in your app dispatches a `click` event (or another event the browser dispatches async), then you know that microtasks queued from inside any `click` event listener will run before the next event listener.
 
But still the problem remains. If scripts might dispatch "async events" such as `click` in your app either now or in the future, then inside event listeners for such apps, the timing of microtasks vs. other event listeners is uncertain. And uncertainty is at the center of "fear, uncertainty, and doubt".

## Implementation of async event propagation function

Implementing the async version of `dispatchEvent` is slightly more complicated than the sync version:

1. In both async and sync event propagation the propagation path is fixed at the outset.
2. We can therefore create a fixed round trip propagation path and target index. This path is passed along in the event queue.
3. But, in the async version, we also need to share the data about the currentTarget and the list of event listeners avaiable at that target in that phase. We therefore also pass along the currentTarget, its current list of event listeners, and the phase data.
4. We then queue each call for next event listener asynchronously in the highest priority macrotask queue in the event loop available: `toggleTick(...)`.

```javascript
function callNextListenerAsync(event, roundTripPath, targetIndex, currentTarget, listeners, phase) {
  if (!phase)
    phase = roundTripPath.length > targetIndex ? Event.CAPTURING_PHASE :
      roundTripPath.length === targetIndex ? Event.AT_TARGET :
        Event.BUBBLING_PHASE;
  if (event._propagationStopped || event._propagationStoppedImmediately)
    return;
  if (phase === Event.BUBBLING_PHASE && (event.cancelBubble || !event.bubbles))
    return;
  if (event.cancelBubble)
    phase = Event.CAPTURING_PHASE;
  if (!currentTarget) {
    currentTarget = roundTripPath.shift();
    listeners = currentTarget.getEventListeners(event.type, phase);
    Object.defineProperty(event, "currentTarget", {value: currentTarget, writable: true});
  }
  while (listeners.length) {
    const listener = listeners.shift();
    if (!currentTarget.hasEventListener(event.type, listener))
      return;
    try {
      listener.cb(event);
    } catch (err) {
      const error = new ErrorEvent(
        'error',
        {error: err, message: 'Uncaught Error: event listener break down'}
      );
      dispatchEvent(window, error);
      if (!error.defaultPrevented)
        console.error(error);
    }
    if (listeners.length)
      return toggleTick(callNextListenerAsync.bind(null, event, roundTripPath, targetIndex, currentTarget, listeners, phase));
  }
  if (roundTripPath.length)
    toggleTick(callNextListenerAsync.bind(null, event, roundTripPath, targetIndex));
}       

function dispatchEventAsync(target, event) {
  Object.defineProperty(event, "target", {
    get: function () {
      let lowest = target;
      for (let t of propagationPath) {
        if (t === this.currentTarget)
          return lowest;
        if (t instanceof DocumentFragment && t.mode === "closed")
          lowest = t.host || lowest;
      }
    }
  });
  Object.defineProperty(event, "stopPropagation", {
    value: function () {
      this._propagationStopped = true;
    }
  });
  Object.defineProperty(event, "stopImmediatePropagation", {
    value: function () {
      this._propagationStoppedImmediately = true;
    }
  });
  const propagationPath = getComposedPath(target, event);
  const roundTripPath = propagationPath.slice().reverse().concat(propagationPath.slice(1));
  toggleTick(callNextListenerAsync.bind(null, event, roundTripPath, propagationPath.length));
}
```

## Demo: all together now

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
      return this._eventListeners[name].slice();
    if (phase === Event.CAPTURING_PHASE) {
      return this._eventListeners[name]
        .filter(listener => listener.options === true || (listener.options && listener.options.capture === true));
    }
    //(phase === Event.BUBBLING_PHASE)
    return this._eventListeners[name]
      .filter(listener => !(listener.options === true || (listener.options && listener.options.capture === true)));
  };

  EventTarget.prototype.hasEventListener = function (name, listener) {
    return this._eventListeners && this._eventListeners[name] && (this._eventListeners[name].indexOf(listener) !== -1);
  };

  function getComposedPath(target, event) {
    const path = [];
    while (true) {
      path.push(target);
      if (target.parentNode) {
        target = target.parentNode;
      } else if (target.host) {
        if (!event.composed)
          return path;
        target = target.host;
      } else if (target.defaultView) {
        target = target.defaultView;
      } else {
        break;
      }
    }
    return path;
  }

  function callListenersOnElement(currentTarget, event, phase) {
    if (event.cancelBubble || event._propagationStoppedImmediately || (phase === Event.BUBBLING_PHASE && !event.bubbles))
      return;
    const listeners = currentTarget.getEventListeners(event.type, phase);
    Object.defineProperty(event, "currentTarget", {value: currentTarget, writable: true});
    for (let listener of listeners) {
      if (event._propagationStoppedImmediately)
        return;
      if (!currentTarget.hasEventListener(event.type, listener))
        continue;
      try {
        listener.cb(event);
      } catch (err) {
        const error = new ErrorEvent(
          'error',
          {error: err, message: 'Uncaught Error: event listener break down'}
        );
        dispatchEvent(window, error);
        if (!error.defaultPrevented)
          console.error(error);
      }
    }
  }

  function dispatchEvent(target, event) {
    const propagationPath = getComposedPath(target, event).slice(1);
    Object.defineProperty(event, "target", {
      get: function () {
        let lowest = target;
        for (let t of propagationPath) {
          if (t === this.currentTarget)
            return lowest;
          if (t instanceof DocumentFragment && t.mode === "closed")
            lowest = t.host || lowest;
        }
      }
    });
    Object.defineProperty(event, "stopImmediatePropagation", {
      value: function () {
        this._propagationStoppedImmediately = true;
      }
    });
    for (let currentTarget of propagationPath.slice().reverse())
      callListenersOnElement(currentTarget, event, Event.CAPTURING_PHASE);
    callListenersOnElement(target, event, Event.AT_TARGET);
    for (let currentTarget of propagationPath)
      callListenersOnElement(currentTarget, event, Event.BUBBLING_PHASE);
  }

  /*ASYNC*/

  function toggleTick(cb) {
    const details = document.createElement("details");
    details.style.display = "none";
    details.ontoggle = cb;
    document.body.appendChild(details);
    details.open = true;
    Promise.resolve().then(details.remove.bind(details));
    return {
      cancel: function () {
        details.ontoggle = undefined;
      },
      resume: function () {
        details.ontoggle = cb;
      }
    };
  }

  function callNextListenerAsync(event, roundTripPath, targetIndex, currentTarget, listeners, phase) {
    if (!phase)
      phase = roundTripPath.length > targetIndex ? Event.CAPTURING_PHASE :
        roundTripPath.length === targetIndex ? Event.AT_TARGET :
          Event.BUBBLING_PHASE;
    if (event.cancelBubble || event._propagationStoppedImmediately || (phase === Event.BUBBLING_PHASE && !event.bubbles))
      return;
    if (!currentTarget) {
      currentTarget = roundTripPath.shift();
      listeners = currentTarget.getEventListeners(event.type, phase);
      Object.defineProperty(event, "currentTarget", {value: currentTarget, writable: true});
    }
    while (listeners.length) {
      const listener = listeners.shift();
      if (!currentTarget.hasEventListener(event.type, listener))
        return;
      try {
        listener.cb(event);
      } catch (err) {
        const error = new ErrorEvent(
          'error',
          {error: err, message: 'Uncaught Error: event listener break down'}
        );
        dispatchEvent(window, error);
        if (!error.defaultPrevented)
          console.error(error);
      }
      if (listeners.length)
        return toggleTick(callNextListenerAsync.bind(null, event, roundTripPath, targetIndex, currentTarget, listeners, phase));
    }
    if (roundTripPath.length)
      toggleTick(callNextListenerAsync.bind(null, event, roundTripPath, targetIndex, undefined, undefined, undefined));
  }

  function dispatchEventAsync(target, event) {
    Object.defineProperty(event, "target", {
      get: function () {
        let lowest = target;
        for (let t of propagationPath) {
          if (t === this.currentTarget)
            return lowest;
          if (t instanceof DocumentFragment && t.mode === "closed")
            lowest = t.host || lowest;
        }
      }
    });
    Object.defineProperty(event, "stopPropagation", {
      value: function () {
        this._propagationStopped = true;
      }
    });
    Object.defineProperty(event, "stopImmediatePropagation", {
      value: function () {
        this._propagationStoppedImmediately = true;
      }
    });
    const propagationPath = getComposedPath(target, event);
    const roundTripPath = propagationPath.slice().reverse().concat(propagationPath.slice(1));
    toggleTick(callNextListenerAsync.bind(null, event, roundTripPath, propagationPath.length, undefined, undefined, undefined));
  }
</script>

<div id="outer">
  <h1 id="inner">Click on me!</h1>
</div>

<script>
  function log(e) {
    const thisTarget = e.currentTarget.id;
    console.log(e.type + " on #" + thisTarget);
    Promise.resolve().then(function () {
      console.log("microtask from #" + thisTarget);
      Promise.resolve().then(() => {
        console.log("nested microtask from #" + thisTarget);
      });
    });
  }

  function log2(e) {
    log(e);
  }

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");

  inner.addEventListener("click", log);
  inner.addEventListener("click", log2);
  outer.addEventListener("click", log);

  dispatchEvent(inner, new MouseEvent("click", {bubbles: true}));
  dispatchEventAsync(inner, new MouseEvent("click", {bubbles: true}));
</script>
```                        

## todo 

minor details:
* add the event.phase property.

## References

 * [MDN: sync vs async event listeners](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent#Notes)