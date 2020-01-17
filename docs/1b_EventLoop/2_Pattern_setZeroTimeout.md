# Pattern: setZeroTimeout

The most common alternative to `setTimeout(task, 0)` when adding tasks to the event loop is the pattern we here call "setZeroTimeout". The setZeroTimeout pattern uses the `window.postMessage()` function to queue a `message` event in the event loop that it in turn associates a callback with that executes the given task. For an introduction, see [mdn](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout#Reasons_for_delays_longer_than_specified) and [this blog post](https://dbaron.org/log/20100309-faster-timeouts).

Here, we will not focus on describing the details of the `postMessage()` and the `message` event listener callback. Instead, we implement the pattern with a `setZeroTimeout` and `clearZeroTimeout` methods that echoes the `setTimeout` and `clearTimeout` methods.  

## `setZeroTimeout` and `clearZeroTimeout`

To illustrate the concept of this method, we here present a naive implementation of the message handling.

```javascript 
var idOrigin = {};
var idCb = {};

function zetZeroTimeout(task) {
  const mid = "pm." + Math.random();    // IE 10 does not support location.origin
  const origin = window.location.origin || window.location.protocol + '//' + window.location.hostname + (window.location.port ? (':' + window.location.port) : '');
  idOrigin[mid] = origin;       //todo do I need origin??
  idCb[mid] = task;
  window.postMessage(mid, origin);
  return mid;
};

function onMessage(evt) {
  if (evt.source !== window)
    return;
  const mid = evt.data;
  if (!idOrigin[mid])
    return;
  evt.stopImmediatePropagation();
  const cb = idCb[mid];
  delete idOrigin[mid];
  delete idCb[mid];
  cb();
}

window.addEventListener("message", onMessage);

function clearZeroTimeout(mid){
  delete idOrigin[mid];
  delete idCb[mid];
}
```

### `setZeroTimeout` vs. `setTimeout`

Essentially, `setZeroTimeout` adds a `message` event to the event loop *asap*. Thus, while the `setTimeout(task, 0)` is hampered by both a) the browser being able to delay the countdown function underlying `setTimeout` at will and b) "clamp" down and delay recursive `setTimeout` tasks, the `setZeroTimeout` is *guaranteed* to be *added* to the event loop asap.

Furthermore, the `message` event is not added to the "setTimeout macrotask queue" in the event loop, but rather the "Normal DOM macrotask queue" (Chrome) or a "PostMessage macrotask queue" (Firefox). This means that the browsers will prioritize the `setZeroTimeout` tasks over the `setTimeout` tasks in most cases where the browsers can choose. Unfortunately, this can vary, depending on the browser and the state of the event loop. But, for simplicity purpuses, you might think that the browser will run `setZeroTimeout` before `setTimeout` 9 out of 10 times when both tasks are added to the event loop from the same tick of the event loop.    
   
The main drawback of `setZeroTimeout` is complexity. Calling `setTimeout` is utterly simple. A decent implementation of `setZeroTimeout` adds two methods and a flow of `message` events to the DOM that might interfere with a) the developer's understanding of his app and b) other event listeners reacting to `message` events. However, the performance cost of going via event messages instead of only calling `setTimeout` is insignificant in most use cases (todo do I need to verify this opinion on performance). 

## References

  * dunno