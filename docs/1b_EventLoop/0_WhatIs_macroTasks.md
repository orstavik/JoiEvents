# WhatIs: Macrotask queues?

The browser has only **one event loop** per tab/`window`. But, the *single event loop* consists of **multiple macrotask queues**.

Each macrotask queue contains a different task types. For example might:
 * all events directly or indirectly driven by the user such as `mousemove`, `keydown`, `input`, etc. be placed in one "UIEvent" macrotask queue; 
 * all `setTimeout(tasks)` be placed in another "setTimeout" macrotask queue; 
 * all `postMessage` callbacks be placed in a third "message" macrotask queue;  
 * all tasks associated with `load`ing resources be placed in yet another "load" macrotask queue; and
 * all tasks associated with handling `error` messages from loading resources in an "error" task queue.
    
Tasks in each macrotask queue run in the order they were added (FIFO). For example, the browser always dispatches a `keypress` and a `click` event in the order it receives them.

A macrotask can contain several microtasks. This means that the time frame (the scope of time) of a macro task is bigger than that of microtasks. Many microtasks, such as those returned by `fetch(..)` are often not completed during the active macrotask, and then the remainder of that macrotask is put back in the event loop to be processed when the delayed microtask is ready. 

## HowTo: manage different macrotask queues? 
 
The browser gives different priority to different macrotask queues. For example:

 * UIEvent tasks considered more important/time-sensitive than `setTimeout` tasks and message tasks. And this makes sense. When the developer wraps a call to a function in a `setTimeout` call he explicitly marks that function call as *delayable*. The developer receiving `postMessage` callbacks must also consider that external constraints might delay the callback arbitrarily. On the other hand, quick response to UI events is critical for user experience. Thus, it makes sense running UI events *before* `setTimeout` and `postMessage` callbacks, even though the UI events were queued *after* the `setTimeout` and `postMessage` callbacks.

 * Error events are considered less time-sensitive. Error events are commonly used to report about problems used for debugging/quality control, or the error would likely cause such a delay of form or function in the app that running a couple of other tasks ahead of it might not really matter.  

This means that **the event loop as a whole is *not* FIFO!** Wow.. Let me say that again: **the event loop as a whole is *not* FIFO!** The browser juggles between different macrotask queues in this highly elaborate way in order to provide a better user experience (giving UI events high priority and error events low priority).

## Different DOM state = different macrotask priorities

The browser also changes the priorities of different macrotask queues depending on the state of the DOM. For example:

1. Chrome81 prioritize `message` events before image `load` events while `document.readyState === "loading"`, but once the document has completed loading, Chrome81 give `message` and image `load` events equal priority.

2. Firefox76 prioritize `message` events before `setTimeout(.., 0)` callbacks while `document.readyState === "loading"`,  but after the document has completed loading, Firefox76 prioritize `setTimeout(.., 0)` callbacks before `message` events.

3. Safari handles maybe the first setTimeout and load differently during the main document load. document.readyState === loading vs. document.readyState === completed.   

## Problem: browser variations
 
Different browsers might:
1. **place the same macrotask in different macrotask queues**, 
2. **prioritize their differing macrotask queues differently**, and even
3. **change the priorities between macrotask queues depending on the DOM state, differently**. 

Yes. This means that for example Safari 13.3 might queue `load` events in a separate macrotask queue while the main document is loading, while Chrome and Firefox might queue `load` events together with other DOM events such as `toggle`. And then, when the document has finished loading, Safari alters its behavior and queues the `load` along side `toggle` events too. Ahhh.. The sweet, sweet smell of variety and uncertainty in web development.
  
> The *single event loop* is a highly misleading concept. What developers *should* envisage is a *set of macrotask queues* that individually runs FIFO, but that prioritize tasks in some queues over tasks in other. Depending on the state of the DOM and the version of the browser.
  
## References:

 * https://qdivision.io/javascript/blog/
 * https://qdivision.io/javascript-settimeout-an-in-depth-look-part-2/blog/
 * jake archibalds blog post (old)
 * the Phillips youtube and jake archibalds youtube 
 * discussions about the nextTick in node and the setImmediate in node
 * discussion about the setImmediate in IE and why the browsers didn't implement it. 
 
      
