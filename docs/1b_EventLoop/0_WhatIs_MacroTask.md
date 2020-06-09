# WhatIs: Macrotask queues?

## WhatIs: the event loop?

The event loop is a queue of "events". An "event" in the event loop is not exactly the same as an `Event` is JS. The "events" in the event loop are tasks, kinda like a js function just waiting to be called one by one. Thus, the most simple, naive conception of the event loop in JS would be a function that iterates an array of function objects and calls them one by one:

```javascript
var tasks = [
  function(){
    console.log("task 1");
  },
  function(){
    console.log("task 1");
  }
];
//the event loop
for (var i = 0; i < tasks.length; i++) {
  var task = tasks[i];
  task();
}
``` 

Every browser tab/`window` has **one event loop**, and everything the browser does is essentially routed through this *one event loop*. However, when the browser has many windows open, it can let multiple tabs, usually from the same origin, share the same event loop to save resources).

## WhatIs: a macrotask?

Each event in the event loop is called a "macrotask".

A macrotask can contain several "mesotasks" and "microtasks" (we look in depth at what these are in the next two chapters). This means that the time frame (the scope of time) of a macro task is "big" and can room several "average" mesotasks and "small" microtasks. Some microtasks, such as those returned by `fetch(..)`, are sometimes not completed before the rest of the macrotask completes, and then the remainder of that microtask is converted into a macrotask and put back in the event loop to be "tried again later". 

## WhatIs: macrotask queues?
 
The browser sorts different types of macrotasks in different queues: 

 * The "UIEvent queue" contains macro tasks directly or indirectly driven by the user such as dispatching `mousemove`, `keydown`, `input` events. 
 * The "setTimeout queue" contains of all the callbacks made via the `setTimeout(cb)`. 
 * The "message queue" consists all `message` events triggered by `postMessage()`.  
 * The "link and script queue" consists of all `load` and `error` events from `<script>` and `<link>` elements.

The *single* event loop is therefore not so unary as one would imagine: **the single event loop is made up of several macrotask queues**.

## Problem 1: macrotask priority

Tasks in each macrotask queue run in the order they were added (FIFO). For example, the browser always dispatches a `keypress` and a `click` event in the order it receives them.

But. Some types of macrotasks are very important, and some macrotasks are not so important. The important macrotasks should be run quickly, and the not-so-important macrotasks can wait. Therefore, the browser gives different macrotask queues different priorities: the macrotasks in the important queues are given high priority, and the browser will run them asap; the less important macrotasks are given low priority, and the browser will likely postpone performing these tasks while there are (many) tasks yet to be performed in the more important macrotask queues.

Examples of the browsers priority might be as follows:

 * UIEvent macrotasks are often considered more important/time-sensitive than `setTimeout` macrotasks. And this makes sense: 
   1. Quick reactions to UI events is critical for user experience.
   2. When the developer wraps a call to a function in a `setTimeout`, then he also implies that this function call is best to *delay*. 
   3. The developer writing the `setTimeout` callback must also be aware that this callback will run *async*. The developer is therefore more likely to write a function that can cope with being delayed when he is writing a `setTimeout` callback than he/she might be when he is writing a `click` event listener.

 * Image `load` events are often considered more time sensitive than script `error` events. Image `load` events are commonly used to append an `<img>` element to the DOM when its `src` has completed loading. This task has a relatively low performance cost to high user benefit ratio, which gives the `load` event a higher priority. `error` events when loading a `script` has a relative low priority: `error` events from scripts are commonly used for debugging/quality control (not time sensitive), or initiating loading a fallback script (which would then already be delayed).  

This means that **the event loop *as a whole* is NOT fifo!** Instead, the browser juggles between different macrotask queues in a highly elaborate way in order to eke out a slightly better user experience.

## Problem 2: macrotask priority depends on DOM state

To add insult to injury, the browser also changes the priorities of different macrotask queues depending on the state of the DOM. The biggest and most evident change is the shift in macrotask priorities when the main document is loading vs. when it has completed loading: `document.readyState === "loading"` vs. `document.readyState === "completed"`.   

In fact, most of the browser's macrotask priorities change when the document finish loading. Examples include:

1. Chrome81 prioritize `message` events before image `load` events while `document.readyState === "loading"`, but once the document has completed loading, Chrome81 give `message` and image `load` events equal priority.

2. Firefox76 prioritize `message` events before `setTimeout(.., 0)` callbacks while `document.readyState === "loading"`,  but after the document has completed loading, Firefox76 prioritize `setTimeout(.., 0)` callbacks before `message` events.

3. Safari handles maybe the first setTimeout and load differently during the main document load. 

We will look more into these changes of priorities in a later chapter.

## Problem 3: different browsers priorities macrotasks differently

Different browsers:
1. place the same macrotask in different macrotask queues, 
2. prioritize their differing macrotask queues differently, and even
3. change their priorities when the DOM changes state differently. 

Yes. This means that for example Safari 13.3 might queue `load` events in a separate macrotask queue while the main document is loading, while Chrome and Firefox might queue `load` events together with other DOM events such as `toggle`. And then, when the document has finished loading, Safari alters its behavior and queues the `load` along side `toggle` events too. Ahhh.. The sweet, sweet smell of variety and uncertainty in web development. 
  
> The *single event loop* is a highly misleading concept. What developers *should* envisage is a *set of macrotask queues* that individually runs FIFO, but that prioritize tasks in some queues over tasks in other. Depending on the state of the DOM and the version of the browser.
  
## References:

 * https://qdivision.io/javascript/blog/
 * https://qdivision.io/javascript-settimeout-an-in-depth-look-part-2/blog/
 * jake archibalds blog post (old)
 * the Phillips youtube and jake archibalds youtube 
 * discussions about the nextTick in node and the setImmediate in node
 * discussion about the setImmediate in IE and why the browsers didn't implement it. 
 
      
