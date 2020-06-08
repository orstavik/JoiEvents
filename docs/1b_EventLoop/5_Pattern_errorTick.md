# Pattern: `errorTick`

When a resource, such as an `<img>`, `<link>`, or `<script>`, fails to `load` its `src`, it will dispatch an `error` event.

## Why: `load` events?

The use-case of `error` and `load` events differ, even when they target the same element.

A `load` event on an `<img>` element signals the `<img>` is ready to be shown on screen. A prime use case for listening for such an event would be to create and load an `<img>` off screen, and then only add the `<img>` and replace its placeholder if and when it has loaded completely.

There are good reasons why such an event would likely be given high priority. The function that reacts to it, is likely:
1. quite independent of other events and other state changes,
2. unlikely to do much other than append the `<img>` to the DOM, and
3. the user experience is likely to benefit greatly from receiving the `<img>` element.

Sure, `UIEvent`s such as `click` and `keydown` is likely to be given higher priority, but other than that the *show the ready `<img>`* use case is likely a task the browser should prioritize.

## Why: `error` events?

An `error` event would likely *not* cause any direct changes to the DOM because good practice would dictate that the developer should either put nothing or a simpler fallback placeholder in the `<img>` elements place *before* the browser starts to load it, not after it fails.
 
One use-case for the `error` event is quality control and logging. This use-case is not time sensitive, neither for the developer nor the user.
 
Another use-case for the `error` event is to fallback to an alternative image source. To initiate this alternative, fallback src would both be a) very cheap (it doesn't take long to queue a network request from within the browser) and b) time sensitive (the `<img>` is already delayed once, we do not want to dilly dally before asking for the backup source).

So, the `error` event can be used for both high and low priority tasks. We will look more at this in the later chapter on "WhatIs: macrotask priorities?" in different browsers.
 
## Implementation: `errorTick`  

We implement the `errorTick` on three different elements, mirroring the implementation of `loadTick`:
 * `<img src="img://">`
 * `<link rel="stylesheet" href="link://">`
 * `<script src="script://">`

As with the `load` event, the `error` events are dispatched in the order the processing of the `src` resource fails in the browser, not the order in which the `src` properties are added to the `<img>` elements. This means that the `errorTick` methods needs an internal queue too. 

```javascript
var _imageOnerrorTick_queue = [];
function imgOnerrorTick(cb){
  _imageOnerrorTick_queue.push(cb);
  var img = document.createElement("img");
  img.onerror = function () {
    _imageOnerrorTick_queue.shift()();
  };
  img.src = "img://";
}

var _linkOnerrorTick_queue = [];
function linkOnerrorTick(cb){
  _linkOnerrorTick_queue.push(cb);
  var link = document.createElement("link");
  link.onerror = function(){
    document.head.removeChild(link);
    _linkOnerrorTick_queue.shift()();
  }
  link.href = "link://";
  link.rel = "stylesheet";
  document.head.appendChild(link);
}

var _scriptOnerrorTick_queue = [];
function scriptOnerrorTick(cb){
  _scriptOnerrorTick_queue.push(cb);
  var script = document.createElement("script");
  script.onerror = function(){
    document.head.removeChild(script);
    _scriptOnerrorTick_queue.shift()();
  }
  script.src = "script://";
  document.head.appendChild(script);
}
```

## References

  * dunno
  

## old drafts
  
Ok. So far we have seen that we can access the following queues in the event loop:
1. setTimeout macrotasks: `setTimeout()`
2. Normal DOM event macrotasks: 
  * `toggle` on `<details>` in all browsers.
  * `message` events from `postMessage()` in Chrome and Firefox.
3. Message macrotasks (this macrotask queue exists in Safari only).
  * `message` events from `postMessage()` in Safari.

But, are there any other macrotask queues we can access? Macrotask queues that might have higher priority, that might yield less disturbance in the app code, that behave more consistently across browsers, that might be more efficient, or have some other unknown benefit?

## The ugly duckling

Errors in code is ugly. We don't like them. They color the console with red messages and fill our heart with dread. But. Are there any errors that journey via the event loop? And if so, what macrotask queue are such errors added to, and what priority are they given? And can we produce such errors in efficiently and unobtrusively? 

```javascript
function queueUglyDucklingTask(cb) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.onerror = function () {
    link.remove();
    cb();
  };
  document.head.appendChild(link);
  link.href = "://ivar/";
}
```

## Test: UglyDuckling vs ToggleTickTrick vs setTimeout

This code is slightly less obtrusive than the ToggleTickTrick as the BlindManDOM `<link>` element is added to `document.head` instead of the `document.body`. But it is also far less efficient than the ToggleTickTrick as it requires a link to be queried by the browser. It is also more obtrusive in dev tools as it will print an error message in the console. Thus, so far, still a duck.
    
But, the real question is if the error callback will be a) placed in a different macrotask queue that the other events and if so b) if it is prioritized higher or lower than the other tasks?

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

function queueUglyDucklingTask(cb) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.onerror = function () {
    link.remove();
    cb();
  };
  document.head.appendChild(link);
  link.href = "://ivar/";
}
    
for (let i = 0; i < 5; i++){ 
  setTimeout(() => console.log("setTimeout 1"));
  queueUglyDucklingTask(() => console.log("UglyDuckling 1"));
  toggleTick(() => console.log("toggleTickTrick 1"));
  setTimeout(() => console.log("setTimeout 2"));
  queueUglyDucklingTask(() => console.log("UglyDuckling 2"));
  toggleTick(() => console.log("toggleTickTrick 2"));
}
```  

#### Results: Chrome 79, Firefox 71 and Safari IOS 13.3

```
   toggleTickTrick 1
   toggleTickTrick 2
   toggleTickTrick 1
   toggleTickTrick 2
   toggleTickTrick 1
   toggleTickTrick 2
   toggleTickTrick 1
   toggleTickTrick 2
   toggleTickTrick 1
   toggleTickTrick 2
   setTimeout 1
   setTimeout 2
   setTimeout 1
   setTimeout 2
   setTimeout 1
   setTimeout 2
   setTimeout 1
   setTimeout 2
   setTimeout 1
   setTimeout 2
//Error message
1x UglyDuckling 2
3x UglyDuckling 1
1x UglyDuckling 2
2x UglyDuckling 1
3x UglyDuckling 2
``` 

## Problem: Increase efficiency and control order

As the demo above illustrate, the browser gives is no guarantee of the order in which your network requests fail. Thus, to control the order of the queue, you must make your own queue and loop. This is slightly more complex, but also much more efficient. An ordered, efficient version of the UglyDucklingError is given below:

```javascript
(function(){
  const link = document.createElement("link");
  link.rel = "stylesheet";
  document.head.appendChild(link);
  link.onerror = function(){
    while(tasks.length)
      Promise.resolve().then(tasks.shift());  
      //here we are using the microtask queue to simplify the management of Errors in different tasks 
  };
  const tasks = [];
  window.queueUglyDucklingTask = function(cb) {
    tasks.push(cb);
    if (tasks.length === 1)
      link.href = link.href === "://ivar/" ? "://max/" : "://ivar/";
  }
})();                                      

queueUglyDucklingTask(()=> console.log(1));
queueUglyDucklingTask(()=> console.log(2));
queueUglyDucklingTask(()=> console.log(3));

setTimeout(function(){
  queueUglyDucklingTask(()=> console.log("a"));
  queueUglyDucklingTask(()=> console.log("b"));
  queueUglyDucklingTask(()=> console.log("c"));
}, 0);

//will always print 1,2,3,a,b,c
```  

## Conclusion

If what you need is to add a task in the event loop with the *lowest* priority, then look no further, the UglyDuckling is your Swan! 

