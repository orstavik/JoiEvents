# Discussion: Different MacroTaskQueues

How many MacroTaskQueues are there? And how does the browser prioritize them? Simple questions that doesn't have a simple answer.

First, the macrotask queues is an area where the browsers differ. Firefox and Chrome and Safari all have essentially different macrotask queues. The different browsers also place different native tasks (events) in different macrotask queues. And the browsers give different priorities to their different macrotask queues. Hurray!

Second, because the browsers implement the macrotask queues differently, there is no specification for the macrotask queues. There is no place where you can read a) how the macrotask queues should behave and b) how the macrotask queues do behave in different browsers. Short of analyzing the source code of the browsers themselves, the browsers event loop is essentially a black box. Hurray hurray!

So, when we need to queue tasks in the event loop, we need to investigate and analyze how the tasks are queued in different browsers, in different situations. The manageable way to do so, is to run a small set of experiments against a small selection of relevant browsers to see how they behave. 

## Experiment 1: `setZeroTimeout` vs. ToggleTickTrick

```javascript
function toggleTick(cb) {
  const details = document.createElement("details");
  details.style.display = "none";
  details.ontoggle = function () {
    details.remove();
    cb();
  };
  document.body.appendChild(details);
  details.open = true;
}

var idOrigin = {};
var idCb = {};

function setZeroTimeout(task) {
  const mid = "pm." + Math.random();    // IE 10 does not support location.origin
  const origin = window.location.origin || window.location.protocol + '//' + window.location.hostname + (window.location.port ? (':' + window.location.port) : '');
  idOrigin[mid] = origin;       //todo do I need origin??
  idCb[mid] = task;
  window.postMessage(mid, origin);
  return mid;
}

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

toggleTick(() => console.log("toggleTickTrick 1"));
setZeroTimeout(() => console.log("setZeroTimeout 1"));
toggleTick(() => console.log("toggleTickTrick 2"));
setZeroTimeout(() => console.log("setZeroTimeout 2"));
```

## Results/output

#### Chrome
 
#### Firefox
 
#### Safari
 

## Conclusion



## References

  * dunno