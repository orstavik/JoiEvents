# WhatIs: `setTimeout`?

The main method of putting a task in the event loop is... *drum roll*... `setTimeout(task, 0)`. `setTimeout(task, Xms)` will add a task in the event loop that will run *after* `Xms` has passed. By setting `Xms` to be `0`, the task runs *after* `0ms` has passed, what normal person would call immediately.

```javascript
                                                //macro 1  //macro2  
console.log("one");                             //1.1
Promise.resolve().then(()=>console.log("two"));     //1.3
setTimeout(function(){
  console.log("five");                                     //2.1
});
console.log("three");                             //1.2
Promise.resolve().then(()=>console.log("four"));        //1.4
```

## Problem 1: low-priority `setTimeout()`

Naively, `setTimeout(task, 0)` would:
1. spend `0` time counting down, and then
2. add the task to the *one, single* event loop.

But. As we saw in the previous chapter, the browser and `setTimeout` doesn't work this way. Tasks queued with the `setTimeout(..)` callback is put in a special macrotask queue with quite low priority. This means that if the browser has many other tasks to manage and is pressed for time, the `setTimout(..)` tasks are some of the first tasks to be delayed. 
 
Therefore, the browser only guarantees that `setTimeout` tasks will run *no sooner* than `Xms`. The browser doesn't hide the fact that it considers *all* `setTimeout` tasks less critical than most other tasks in the event loop, and will therefore quite often delay the task *much more than `Xms`* in order to run other event loop tasks it considers "more important/time-sensitive". This means that even though a `setTimeout(task1, 0)` asks the browser to run `task1` immediately, the browser often delays `task1` a couple of ms (and sometimes much, much more). 

## Problem 2: `setTimeout` clamp-down

If calls to `setTimeout(tasks, 0)` are nested more than 4-5 times, then the browser *will* "clamp" (ie. delay) your forth or fifth `setTimeout(..)` task with `4ms`. To nest `setTimeout(..)` calls, you simply need to call `setTimeout(..)` from another function that was also added using `setTimeout`, recursively 4-5 times. 

> Calling `setTimeout(..)` recursively 4-5 times might seem far fetched. But, in practice, it isn't really. 
> * `setTimeout(..)` is the *only, officially sanctioned method* that you can use to either a) queue a task in the event loop and/or b) scope a piece of JS script as a macrotask.
>  
> And frameworks that extend the fundamental universal capabilities of the browser might need both a) to queue tasks in the event loop and b) scope a piece of JS script as a macrotask. Such frameworks might very likely let their users trigger such functionality from their code, which then could run in circles that easily recurse via the `setTimeout` call more than 4-5 times. The browser(-nanny-state) felt that such behavior would lead to problems, rightly or wrongly, and so it decided to clamp down to deter such practice.
>
> Now. It is true that inconsiderate use of the browsers event loop quickly can lead to inefficient code and practices. You would like to enable recursion, but you would also like to avoid recursion of more than 4-5 levels deep. However, there are strong, strong reasons why the browser uses the event loop itself, and why any sensible framework should not implement its own implicit, parallel event loops, but instead extend the existing architecture instead. 
 
## Performance

The absolute performance of `setTimeout` depends on many factors that will vary greatly:
1. the OS and computer hardware
2. the browser
3. the number of other applications and tabs/windows in the browser
4. the application
5. the number of other events and task being processed
6. whether or not that butterfly in the Amazonas flapped its wings or not, etc. etc.

The relative performance of `setTimeout` however, ie. how much more time it takes to perform a javascript function when it is queued using `setTimeout` and run as an independent macrotask, is relevant. This tells us something about the extra cost of the setTimeout. This we can test in an individual browser using the following little script:

```javascript
let syncTime;
//test sync
setTimeout(function () {
  const array = new Array(1000);
  let i = 0;
  const cb = function () {
    array[i++] = performance.now();
  }
  const start = performance.now();
  for (let i = 0; i < array.length; i++)
    cb();
  console.log("Sync time: ", syncTime = performance.now() - start);
}, 1000);

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
  console.log("setTimeout trigger time costs (ms): ", triggerTime = performance.now() - start);
  setTimeout(function () {
    console.log("setTimeout callback time: ", callbackTime = array[array.length - 1] - array[0]);
    console.log("setTimeout is x" + (triggerTime + callbackTime) / syncTime + " slower than simple calling the same functions sync.");
    console.log("The average time for a setTimeout callback is (ms): ", (triggerTime + callbackTime) / 1000);
  });
}, 2000);
```    

As a rule of thumb, running a function via `setTimeout(..)`:
 * is approx **x25 slower** than running the same function sync/normally, and
 * takes approx **0.025ms** on a normal, stressed out, old, Ubuntu Chrome not shown much love nor attention.
 
> Todo, these figures are not very representative. To get relevant data, a representative selection of the browsers your website would encounter today should be queried. 

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
 
      
