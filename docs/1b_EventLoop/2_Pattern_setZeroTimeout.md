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

## Test event loop sequence: `setZeroTimeout` vs. `setTimeout`

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

## Test performance: `setZeroTimeout` vs. `setTimeout`

Another aspect of using `setZeroTimeout` is its performance. We have seen how `setTimeout` performs against sync running of the same function (x25 slower), but how much slower/faster is calling `setZeroTimeout` compared to `setTimeout`?

```html
<script>
  var time1, triggerTime1, callbackTime1, time2, triggerTime2, callbackTime2;
  //test setTimeout
  setTimeout(function () {
    const array = new Array(1000);
    let i = 0;
    const cb = function () {
      array[i++] = performance.now();
    }
    const start = performance.now();
    for (let i = 0; i < array.length; i++)
      setTimeout(cb);
    console.log("setTimeout trigger time costs (ms): ", triggerTime1 = performance.now() - start);
    setTimeout(function () {
      console.log("setTimeout callback time: ", callbackTime1 = array[array.length - 1] - array[0]);
      console.log("setTimeout time " + (time1 = triggerTime1 + callbackTime1));
      console.log("The average time for a setTimeout callback is (ms): ", time1 / 1000);
    });
  }, 2000);
</script>
```   

We need an endpoint that we can pass a link to a web site and get the sum total log from 4-5-7 tests. We could maybe do this via endtest.. here we get the log. but this is f..ing building an application, and i don't want that. Id rather do it manually than manage an application for testing.

We could set up a clientside testing service. Ie a web component that runs a test and then report back to a server about the result. This is a better approach. But, would we be able to see which browsers we have?? don't think so. This is a very bad way.

## `setZeroTimeout` result

https://the.world.is/beauti.ful?https://orstavik.github.io/JoiEvents/docs/1_Intro/demo/ValidateInvalid.html
=> {chrome: ..., firefox: ..., 

```
Chrome 81              Firefox 76          Safari IOs13      IE11  
                                         
//loading              //loading           //loading         //loading         
setTimeout 0.01ms      setTimeout 1        setTimeout 1      setTimeout 1      
setZeroTimeout 0.025ms setZeroTimeout 1    setZeroTimeout 1  ** setZeroTimeout 1 
                                      
//complete             //complete          //complete        //complete        
setZeroTimeout 1       * setTimeout 1      setZeroTimeout 1  setZeroTimeout 1  
setTimeout 1           setZeroTimeout 1    setTimeout 1      setTimeout 1      

//interactive
setZeroTimeout 1
setZeroTimeout 2
setTimeout 1
setTimeout 2
```

## Discussion: `setZeroTimeout` vs. `setTimeout`

`setZeroTimeout` adds a `message` event to the event loop, that should be processed without delay. But, so do `setTimeout(.., 0)`. The difference  Thus, while the `setTimeout(task, 0)` is hampered by both a) the browser being able to delay the countdown function underlying `setTimeout` at will and b) "clamp" down and delay recursive `setTimeout` tasks, the `setZeroTimeout` is *guaranteed* to be *added* to the event loop asap.

Furthermore, the `message` event is not added to the "setTimeout macrotask queue" in the event loop, but rather the "Normal DOM macrotask queue" (Chrome) or a "PostMessage macrotask queue" (Firefox). This means that the browsers will prioritize the `setZeroTimeout` tasks over the `setTimeout` tasks in most cases where the browsers can choose. Unfortunately, this can vary, depending on the browser and the state of the event loop. But, for simplicity purpuses, you might think that the browser will run `setZeroTimeout` before `setTimeout` 9 out of 10 times when both tasks are added to the event loop from the same tick of the event loop.    
   
The main drawback of `setZeroTimeout` is complexity. Calling `setTimeout` is utterly simple. A decent implementation of `setZeroTimeout` adds two methods and a flow of `message` events to the DOM that might interfere with a) the developer's understanding of his app and b) other event listeners reacting to `message` events. However, the performance cost of going via event messages instead of only calling `setTimeout` is insignificant in most use cases (todo do I need to verify this opinion on performance). 


//todo test the queueing, using 2+2 invocations.
//todo speed test the fucker!


## References

  * dunno