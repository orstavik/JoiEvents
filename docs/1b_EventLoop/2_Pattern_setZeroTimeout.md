# Pattern: setZeroTimeout

The first alternative to `setTimeout(task, 0)` to add tasks to the event loop is the "setZeroTimeout" pattern. "setZeroTimeout" uses the `window.postMessage()` function to queue a `message` event in the event loop that it in turn trigger a callback function containing the task. For an introduction, see [mdn](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout#Reasons_for_delays_longer_than_specified) and [this blog post](https://dbaron.org/log/20100309-faster-timeouts).

## Implementation: `setZeroTimeout` and `clearZeroTimeout`

To implement the "setZeroTimeout" pattern, we create an interface with two methods: `setZeroTimeout` and `clearZeroTimeout`. These two methods echo `setTimeout` and `clearTimeout` and can be used interchangeably.
 
```javascript
(function(){
  var idOrigin = {};   //todo do we really need to handle the origin?? 
  var idCb = {};
  
  function setZeroTimeout(task) {
    const mid = "pm." + Math.random();    // IE 10 does not support location.origin
    const origin = window.location.origin || window.location.protocol + '//' + window.location.hostname + (window.location.port ? (':' + window.location.port) : '');
    idOrigin[mid] = origin;
    idCb[mid] = task;
    window.postMessage(mid, origin);
    return mid;
  }
  
  function onMessage(evt) {
    if (evt.source !== window)//does this check essentially replace origin?
      return;
    const mid = evt.data;
    if (!idOrigin[mid])
    // if (!idCb[mid])
      return;
    evt.stopImmediatePropagation();
    const cb = idCb[mid];
    delete idOrigin[mid];
    delete idCb[mid];
    cb();
  }
  
  function clearZeroTimeout(mid){
    delete idOrigin[mid];
    delete idCb[mid];
  }
  window.addEventListener("message", onMessage);
})();
```

## Event loop priority: `setZeroTimeout` vs. `setTimeout`

```html
<script>
  (function(){
    var idCb = {};

    window.setZeroTimeout = function(task) {
      const mid = "pm." + Math.random();
      idCb[mid] = task;
      window.postMessage(mid, "*");
      return mid;
    }
    window.clearZeroTimeout = function (mid){
      delete idCb[mid];
    }

    function onMessage(evt) {
      if (evt.source !== window)
        return;
      const mid = evt.data;
      if (!idCb[mid])
        return;
      evt.stopImmediatePropagation();
      const cb = idCb[mid];
      delete idCb[mid];
      cb();
    }

    window.addEventListener("message", onMessage);
  })();
</script>

<script>
  // setTimeout(function () {
    console.log(document.readyState);
    setTimeout(function(){console.log("setTimeout 1")});
    setZeroTimeout(function(){console.log("setZeroTimeout 1")});
    var mid1 = setTimeout(function(){console.log("setTimeout x")});
    var mid2 = setZeroTimeout(function(){console.log("setTimeout x")});
    clearTimeout(mid1);
    clearZeroTimeout(mid2);
    setTimeout(function(){console.log("setTimeout 2")});
    setZeroTimeout(function(){console.log("setZeroTimeout 2")});
  // }, 0);
</script>
```

When running this test, the queues can be tested in both the loading, interactive and complete state by wrapping the test in a `setTimeout(.., x)` itself:
 * no `setTimeout()` => `document.readyState == "loading"`
 * `setTimeout(.., 0)` => sometimes `document.readyState == "interactive"`
 * `setTimeout(.., 1000)` => `document.readyState == "complete"`

## Event loop sequence: `setTimeout` vs. `setZeroTimeout`

```
Chrome 81         Firefox 76          Safari IOs13      IE11  
                                    
//loading         //loading           //loading         //loading         
setZeroTimeout 1  setZeroTimeout 1    setZeroTimeout 1  ** setZeroTimeout 1 
setZeroTimeout 2  setZeroTimeout 2    setZeroTimeout 2  ** setZeroTimeout 2   
setTimeout 1      setTimeout 1        setTimeout 1      setTimeout 1      
setTimeout 2      setTimeout 2        setTimeout 2      setTimeout 2      
                                    
//complete        //complete          //complete        //complete        
setZeroTimeout 1  * setTimeout 1      setZeroTimeout 1  setZeroTimeout 1  
setZeroTimeout 2  * setTimeout 2      setZeroTimeout 2  setZeroTimeout 2  
setTimeout 1      setZeroTimeout 1    setTimeout 1      setTimeout 1      
setTimeout 2      setZeroTimeout 2    setTimeout 2      setTimeout 2      

//interactive
setZeroTimeout 1
setZeroTimeout 2
setTimeout 1
setTimeout 2
```

The results above illustrate how `setTimeout` and `message` events are placed in two different macrotask queues. All four tasks are added from the same sync script, the same macrotask. When the browser finishes adding the four tasks to the event loop, it then gets to run them. It then runs either both the `setZeroTimeout` tasks first before it runs both the `setTimeout` tasks. This illustrates how the browsers places the tasks in different macrotask queues, and then prioritize tasks in some macrotask queues over others.

*) However, there are two exceptions in this small test set of four browsers. The first is that Firefox 76 (on Ubuntu) runs both the `setTimeout` tasks *before* the `setZeroTimeout` tasks *after* it has finished loading the main document, while it runs the `setZeroTimeout` tasks *before* the  `setTimeout` *while* it is loading the main document. This makes explicit two things:
 * Firefox prioritize its `message` event macrotask queue and its `setTimeout` macrotask queue differently during different states of the DOM.
 * Firefox and the other browsers run their macrotasks in different order from each other.  

**) The second exception is the `setZeroTimeout` calls in IE11. While IE11 is loading the page either the second or both `message` events sometimes go missing. This is a clear bug, simply alerting developers that `setZeroTimeout` is unsafe in IE11 while the page is loading (and possibly at other times too).

## Performance: `setZeroTimeout` vs. `setTimeout`

Is `setTimeout` faster than `setZeroTimeout`? And how much does it cost to handle the `message` event? To test this, we run 1000 calls to `setTimeout` and compare that with 1000 calls to `setZeroTimeout`. 

```html
<script>
  (function(){
    var idCb = {};

    window.setZeroTimeout = function(task) {
      const mid = "pm." + Math.random();
      idCb[mid] = task;
      window.postMessage(mid, "*");
      return mid;
    }
    window.clearZeroTimeout = function (mid){
      delete idCb[mid];
    }

    function onMessage(evt) {
      if (evt.source !== window)
        return;
      const mid = evt.data;
      if (!idCb[mid])
        return;
      evt.stopImmediatePropagation();
      const cb = idCb[mid];
      delete idCb[mid];
      cb();
    }

    window.addEventListener("message", onMessage);
  })();
</script>

<script>
  var time1;
  var count = 10000;
  //test setTimeout
  setTimeout(function () {
    var triggerTime1, callbackTime1;
    const array = new Array(count);
    let i = 0;
    const cb = function () {
      array[i++] = performance.now();
    }
    const start = performance.now();
    for (let i = 0; i < array.length; i++)
      setTimeout(cb);
    console.log("1000x setTimeout trigger time costs (ms): ", triggerTime1 = performance.now() - start);
    setTimeout(function () {
      console.log("1000x setTimeout callback time: ", callbackTime1 = array[array.length - 1] - array[0]);
      console.log("1x setTimeout costs on this computer+browser in the current state (ms): ", (triggerTime1 + callbackTime1) / count);
      time1 = triggerTime1 + callbackTime1;
    });
    //test setZeroTimeout
    setTimeout(function () {
      var triggerTime1, callbackTime1;
      const array = new Array(count);
      let i = 0;
      const cb = function () {
        array[i++] = performance.now();
      }
      const start = performance.now();
      for (let i = 0; i < array.length; i++)
        setZeroTimeout(cb);
      console.log("1000x setZeroTimeout trigger time costs (ms): ", triggerTime1 = performance.now() - start);
      setTimeout(function () {
        console.log("1000x setZeroTimeout callback time: ", callbackTime1 = array[array.length - 1] - array[0]);
        console.log("1x setZeroTimeout costs on this computer+browser in the current state (ms): ", (triggerTime1 + callbackTime1) / count);
        console.log("setZeroTimeout takes x times that of setTimeout: ", (triggerTime1 + callbackTime1) / time1);
      });
    }, 500);
  }, 500); //give the browser a little time to stabilize after loading the document
</script>
```

Results:

```
                           Ubuntu            (GTK2.26.4)|    Windows 10
                             Chrome81    FF76   WebKit  |Edge18    IE11
10000x setTimeout trigger:        146      33       31  |   294     502
10000x setTimeout callback:       180      17       41  |   428    1706
1x setTimeout (ms):             0.033   0.005    0.007  | 0.072    0.22
10000x setZeroTimeout trigger:    123      21       24  |   353     526
10000x setZeroTimeout callback:   128      23       28  |   606    1811
1x setZeroTimeout (ms):         0.025   0.004    0.005  | 0.096    0.23
setZeroTimeout vs setTimeout:   0.77x   0.88x    0.72x  | 1.32x   1.05x
```

All browsers handle `setZeroTimeout` roughly as fast or slightly faster than `setTimeout`. This finding is important, as it shows that the system of dispatching and executing an event based is as fast as the system for counting down and executing a `setTimeout` call. And that the performance of the two methods are roughly irrelevant.

Another relevant finding is that Chrome, known to be the fastest, is roughly 5x slower than Firefox and WebKitGTK. But, this finding might be due to other factors related to the OS, and so should be checked further.
 
## Conclusion: `setZeroTimeout` vs. `setTimeout`

1. Looking at the performance of these two options, both `setTimeout` and `setZeroTimeout` are equally good options for queuing a task in the event loop.

2. Because the browsers "clamp down" on recursive `setTimeout` calls, `setZeroTimeout` is a better alternative. 

3. The `message`-event macrotask queue are consistently prioritized *before* the `setTimeout` macrotask queue, with the notable exception of Firefox which seems to consistently prioritize `setTimeout` *before* `setZeroTimeout` after the `document` has completed loading.

4. The `postMessage()` method in IE11 is unreliable while the `document` is loading. 

## References

  * dunno