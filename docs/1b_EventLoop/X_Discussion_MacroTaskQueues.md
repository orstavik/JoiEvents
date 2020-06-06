
Result:

```
Ubuntu                                                     |Windows 10
Chrome81            FF76                WebKit GTK2.26.4   |Edge18             IE11
                                                           |
loading             loading             loading            |loading             loading            
setZeroTimeout 1    imageOnloadTick 2   setZeroTimeout 1   |imageOnloadTick 1   imageOnloadTick 1    
setZeroTimeout 2    imageOnloadTick 1   setTimeout 1       |imageOnloadTick 2   imageOnloadTick 2           
imageOnloadTick 1   setZeroTimeout 1    setZeroTimeout 2   |setZeroTimeout 1    setZeroTimeout 1   
imageOnloadTick 2   setZeroTimeout 2    setTimeout 2       |setZeroTimeout 2    setTimeout 1       
setTimeout 1        setTimeout 1        interactive        |setTimeout 1        setTimeout 2        
setTimeout 2        setTimeout 2        imageOnloadTick 1  |setTimeout 2        complete
interactive         complete            imageOnloadTick 2  |complete            imageOnloadTick 1  
setZeroTimeout 1    setTimeout 1        imageOnloadTick 1  |setTimeout 1        imageOnloadTick 2  
imageOnloadTick 1   setTimeout 2        imageOnloadTick 2  |setTimeout 2        setZeroTimeout 2  
setZeroTimeout 2    setZeroTimeout 1    setZeroTimeout 1   |imageOnloadTick 1   setTimeout 1    
imageOnloadTick 2   setZeroTimeout 2    setZeroTimeout 2   |imageOnloadTick 2   setTimeout 2   
setTimeout 1        imageOnloadTick 1   setTimeout 1       |setZeroTimeout 1    setZeroTimeout 1           
setTimeout 2        imageOnloadTick 2   setTimeout 2       |setZeroTimeout 2    setZeroTimeout 2           
complete            complete            complete           |complete            complete           
setZeroTimeout 1    setTimeout 1        setZeroTimeout 1   |imageOnloadTick 1   imageOnloadTick 1    
imageOnloadTick 1   setTimeout 2        setTimeout 1       |imageOnloadTick 2   imageOnloadTick 2       
setZeroTimeout 2    setZeroTimeout 1    imageOnloadTick 1  |setZeroTimeout 1    setZeroTimeout 1  
imageOnloadTick 2   setZeroTimeout 2    imageOnloadTick 2  |setZeroTimeout 2    setZeroTimeout 2  
setTimeout 1        imageOnloadTick 1   setZeroTimeout 2   |setTimeout 1        setTimeout 1   
setTimeout 2        imageOnloadTick 2   setTimeout 2       |setTimeout 2        setTimeout 2       
```                 

These are messy results.
1. Firefox76 is consistent: results do not change when you reload the test document, and the priority order of these three macrotasks is reversed when the `document.readyState` switches from `loading` to `complete`:
 * After loading: 1. `setTimeout`, 2. `message`, 3. `load`.
 * During loading: 1. `load`, 2. `message`, 3. `setTimeout`.

2. Chrome81 is also consistent: results do not change when you reload the test document, and the priority order of the macrotasks is to always prioritize `setTimeout(..,0)` last, and then have an equal priority between `message` and image `load` events, except when the `document.readyState` is loading, when Chrome81 prioritize `message` events.    

3. WebKit is very inconsistent. It seems to have no altered priorities between neither of these three events/macrotasks, and so simply run the first it encounters. Furthermore, loading the base64 gif seems slower in Safari (or Safari is faster processing its `setTimeout` and `message` events, enabling it to jump to the second stage sooner.

4. Edge18 seems to be able to consistently trigger the different events in pairs. However, which pair is triggered can change completely every time the document is reloaded.

5. IE11 seems to consistently prioritize image `load` events, and consistently struggle with `message` events. The clear result being that `load` runs first, and `setTimeout` last.

The `load` event is similar to the `error` event in the UglyDuckling pattern. Both `load` and `error` are element lifecycle events. But, as opposed to the `error` in UglyDuckling, the `load` event does not represent something bad/unexpected.




# Discussion: Different MacroTaskQueues

How many MacroTaskQueues are there? And how does the browser prioritize them? Simple questions that doesn't have a simple answer.

First, the macrotask queues is an area where the browsers differ. Firefox and Chrome and Safari all have essentially different macrotask queues. The different browsers also place different native tasks (events) in different macrotask queues. And the browsers give different priorities to their different macrotask queues. Hurray!

Second, because the browsers implement the macrotask queues differently, there is no specification for the macrotask queues. There is no place where you can read a) how the macrotask queues should behave and b) how the macrotask queues do behave in different browsers. Short of analyzing the source code of the browsers themselves, the browsers event loop is essentially a black box. Hurray hurray!

So, when we need to queue tasks in the event loop, we need to investigate and analyze how the tasks are queued in different browsers, in different situations. The manageable way to do so, is to run a small set of experiments against a small selection of relevant browsers to see how they behave. 

## Experiment 1: `setZeroTimeout` vs. `setToggleTick` vs. `setTimeout`

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

setTimeout(() => console.log("setTimeout0 1"));
toggleTick(() => console.log("toggleTickTrick 1"));
setZeroTimeout(() => console.log("setZeroTimeout 1"));
setTimeout(() => console.log("setTimeout0 2"));
toggleTick(() => console.log("toggleTickTrick 2"));
setZeroTimeout(() => console.log("setZeroTimeout 2"));
```

## Results: Chrome 79 and Firefox 71

```
 toggleTickTrick 1
 setZeroTimeout 1
 toggleTickTrick 2
 setZeroTimeout 2
 setTimeout0 1
 setTimeout0 2
```

Chrome and Firefox adds the `message` and `toggle` event in the same macrotask queue, or at least two macrotask queues that have the same priority. All browsers prioritize `setTimeout` last.  

## Results: Safari IOS 13.3

```
 toggleTickTrick 1
 toggleTickTrick 2
 setZeroTimeout 1
 setZeroTimeout 2
 setTimeout0 1
 setTimeout0 2
```

Safari behaves differently. While Chrome and Firefox consistently puts setTimeout tasks last, Safari can on some occasions run setTimeout tasks first. However, most often, the Safari event loop prioritizes `toggle` over `message` over `setTimeout`.

## Conclusion

All three browsers use a separate macrotask queue for `setTimeout` tasks. This macrotask queue is not processed until all `toggle` and `message` events (tasks) have been dispatched (processed).

In Chrome and Firefox, there is no difference in priority between `toggle` and `message` events. They appear to be added to the same macrotask queue and processed FIFO.
  
However, in Safari, `message` events appear not to be queued in the same macrotask queue as `toggle`. Safari operates with a different macrotask queue for `messages`, and Safari gives this macrotask queue a lower priority than `toggle` (and most likely other DOM events).

So, while `setZeroTimeout` would be the most practical and efficient pattern in Chrome and Firefox in isolation, it appears as though the ToggleTickTrick is the best pattern when the solution aims to be consistent with Safari.

Safari appears to take more contextual factors into account when deciding event loop priorities than Firefox and Chrome, thus becoming more inconsistent. But, if you for example need to add two tasks to the event loop that both should be completed in the given order, then you are likely best served using ToggleTickTrick.     

## References

  * dunno