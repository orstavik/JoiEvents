# HowTo: Add a task to the event loop?

In this chapter we will look at the timing when browsers run their events and JS code combined with a DOM. And we start by looking at the timing of `setTimeout(task, 0)`. 

So, how to add a task to the event loop? Why, just call `setTimeout(task, 0)`. `setTimeout(task, 0)` will initiate a timer that will count down `0ms`, and when this time has passed, the `task` function will be added to the event loop and run. Nice! Problem solved!

But wait. As with all simple things, there is a problem. Is `setTimeout(task, 0)` truly that fast? Is `setTimeout(task, 0)` truly immediate?

## Problem: the timing of `setTimeout(task, 0)`?

Naively, `setTimeout(task, 0)` should:
1. spend `0` time counting down, and then
2. add the task to the *one, single* event loop.

But. There are problems:
 * The "count down" function underlying `setTimeout` in the browser does *not* guarantee that the task will be added *as soon as it has finished* counting down; the browser's underlying "count down" function *only* guarantees that it will count a *minimum* of `0` ms. That means that the browser might call the function after for example 2ms or 8ms or even 80ms, if the browser finds it appropriate. And what the browser decides for itself, you (the developer) do not control.

 * If `setTimeout(task, 0)` are nested more than 4-5 times, ie. you call a `setTimeout(task, 0)`-tasks from within `setTimeout(task, 0)`-tasks 4-5 times in a row, then the browser *will* "clamp" (ie. delay) your `setTimeout(task, 0)`-tasks with `4ms`.
 
 * Although there is *a single event loop*, this one event loop is divided into several different **macrotask queues**. All tasks from `setTimeout(task, 0)` calls are added to one such *macrotask queue* that we can call the *setTimeout macrotask queue*. Other tasks such as mouse event reaction and propagation are added to what we can call the *UI event queue*. Yet other tasks such as `postMessage` callbacks are added to the *other DOM event macrotask queue* (in Chrome) or the *postMessage macrotask queue* (in Firefox). So even though browsers run tasks from the event loop one-by-one, it can and do prioritize some macrotask queues over others. Within each macrotask queue, the browser should run the tasks in FIFO order. But, as different tasks are added to different macrotask queues in the event loop, and the browser prioritize some macrotask queues over others, **the event loop as a whole is NOT FIFO!** And guess which macrotask queue the browser gives the least priority to? Yup, you are right, the *setTimout macrotask queue*.
 
## Solution: different methods for different macrotask queues

This means that to add a task to the event loop is not as straight forward as one might think. Yes, using `setTimeout(task, 0)` will add a task to the event loop. Yes, in most instances `setTimeout(task, 0)` tasks are run almost immediately and fast enough. But, if you really need to control the timing of different tasks, `setTimeout(task, 0)` is too blunt and not immediate enough.

In this chapter we will look at various methods of adding things to the event loop and how the macrotask queues in the event loop relate to the microtask queue accessible in which both a) some DOM callbacks/events are added and b) some JS callbacks are added.

## Discussion: Node's `nextTick(task)` and `setImmediate(task)`

cf `nextTick` and `setImmediate` for more information.

## References:

 * https://qdivision.io/javascript/blog/
 * https://qdivision.io/javascript-settimeout-an-in-depth-look-part-2/blog/
 * jake archibalds blog post (old)
 * the Phillips youtube and jake archibalds youtube 
 * discussions about the nextTick in node and the setImmediate in node
 * discussion about the setImmediate in IE and why the browsers didn't implement it. 
 
      
