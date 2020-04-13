# WhatIs: the Microtask Queue?

There are two main queue levels in the browsers: 
1. The event loop with its various and varying macrotask queues.
2. The microtask queue.

Thus, we can envisage the flow of control from top down in a web app as:
1. **a single queue** (the event loop) that consists of
2. **a series of macrotasks** that in turn consists of
3. **a series of microtasks**.

```
-- event loop --
|              |
|  --MACRO--   |
|  |       |   |
|  | micro |   |  1
|  |       |   |  
|  | micro |   |  2
|  |       |   |  
|  | micro |   |  3
|  |       |   |
|  ---------   |
|              |
|  --MACRO--   |
|  |       |   |
|  | micro |   |  4
|  |       |   |
|  ---------   |
|              |
|  --MACRO--   |
|  |       |   |
|  | micro |   |  5
|  |       |   |
|  | micro |   |  6
|  |       |   |
|  ---------   |
|              |
|     ...      |  ...
```

In order for the browser to pick a new (macro)task from the event loop, the microtask queue of the previous macrotask must be completely emptied.

> Some microtasks can be upgraded to macrotasks if they are not ready when its their turn. For example, a `fetch(...)` call might take too long to return, thus enabling other, later microtask to be run ahead of it as well as letting other macrotasks run before it. 

## Macrotasks vs. microtasks

Microtasks and macrotasks have much more in common, than what separates them:

1. Both the macrotask and microtask queues are lists of tasks. In the landscape of the JS browser these tasks are callable JS functions (or native equivalents).
2. Both the individual macrotask queues and the individual microtask queues are FIFO. However, the event loop consists of several macrotask queues, and the event loop can and do prioritize some queues over other, and therefore will run tasks in some macrotask queues before tasks in other macrotask queues, regardless of which one was called first. However, within each individual macrotask and microtask queue, tasks run FIFO.
3. The same type of tasks can be added to both the macro and the macro queues. Consider for example the loading of an image:
   * When an `<img>` element has loaded its source, a `load` event is queued as a macro task in the event loop.
   * When an `fetch` call is made to retrieve the source of the same image file, its result is added to the microtask queue.

The main difference between microtasks and macrotasks is their level: 
 * macrotasks run one-by-one under the event loop, 
 * microtasks run one-by-one under each macrotask.

However, it is simpler to understand the makeup of microtask queue in JS than in English. So, in this chapter I will describe the microtask queue directly in JS.
 
## Demo 1: A minimalistic microtask queue in JS

```javascript 
const microTasks = [];

function startMicroTaskProcessing(){
  while (microTasks.length){
    const nextTask = microTasks.shift();          //getting the next task from the queue, FIFO
    nextTask.call();                              //executing the next micro task
  }
}

microTasks.push(function(){ console.log("a"); }); //adding micro tasks
microTasks.push(function(){ console.log("b"); }); //adding micro tasks
microTasks.push(function(){ console.log("c"); }); //adding micro tasks
startMicroTaskProcessing();                       //flushing microtask queue
```   

This naively simple microtask queue shows the basic. The microtask queue starts up empty. The queue is then filled with 3 tasks. Each task is in the form of an executable function. The microtask queue is then started (also called "flushed"), and the function processing the microtask queue then simply runs from start to end.

## Demo x: what happens with errors in microtask queue?

Errors within a microtask do not affect the execution of the next microtask as such.

```javascript 
function a(){
  console.log("a");
}
function b(){
  throw new Error();
}
function c(){
  console.log("c");
}

Promise.resolve().then(a);
Promise.resolve().then(b);
Promise.resolve().then(c);
```

Result:

```
a
error
c
```

## Demo 2: A minimalistic microtask queue with simple error handling 

So far, so good. But, we would like to be a little safer. We need to ensure that:
1. only executable functions are added to the microTask queue, and
2. if an Error occurs during the execution of one micro task, we don't want that to stop the execution of later microtasks.  

```javascript 
const microTasks = [];

function startMicroTaskProcessing(){
  while (microTasks.length){
    const nextTask = microTasks.shift();
    try {
      nextTask.call();
    } catch(e){
      console.error(e.message);
    }
  }
}

function addMicroTask(task){
  if (!(task instanceof Function))
    throw new Error("you can only add executable functions as microtasks.");
  microTasks.push(task);
}

addMicroTask(function(){ console.log("a"); });
addMicroTask(function(){ console.log("b"); });
addMicroTask(function(){ console.log("c"); });
startMicroTaskProcessing();                   
```   

## Demo 3: A microtask queue with `unhandledrejection` event 

When microtasks fail, Chrome and Firefox has an error called [unhandledrejection](https://developer.mozilla.org/en-US/docs/Web/API/Window/unhandledrejection_event). What this function essentially does is that instead of just immediately printing the error to the console, the browser first dispatches an `unhandledrejection` event to the `window` object and then after this event has propagated, write the error message to the console. And if someone calls `.preventDefault()` on the `unhandledrejection` event, it doesn't print the error message.    

```javascript 
const microTasks = [];

function startMicroTaskProcessing(){
  while (microTasks.length){
    const nextTask = microTasks.shift();
    try {
      nextTask.call();
    } catch(e){
      const error = new CustomEvent("unhandledrejection");
      setTimeout(function(){window.dispatchEvent(error);});
      const errorPrintId = setTimeout(function(){console.error(e.message);});
      error.preventDefault = function(){ clearTimeout(errorPrintId); };
    }
  }
}

function addMicroTask(task){
  if (!(task instanceof Function))
    throw new Error("you can only add executable functions as microtasks.");
  microTasks.push(task);
}

addMicroTask(function(){ console.log("a"); });
addMicroTask(function(){ console.log("b"); });
addMicroTask(function(){ console.log("c"); });
startMicroTaskProcessing();                   
```   

## Demo 4: Why use a microtask queue? async callbacks! 

Until now, we have added all the tasks to the microtask queue ourselves. Before we started the microtask queue. And in sync code. In this landscape, there is really no point to the microtask queue. So, why then have this peculiar microtask queue in the first place?

Well, the microtask queue is useful for 2 purposes:
1. when *other* parts of the system completes and needs to add code to be run. For example, the browser has completed a `fetch` call and downloaded a file, and the browser then wants to run a function based on that process.
2. when running a function has *side-effects* and you want to delay executing these side-effects until you have cleared the current task you are processing. You might want to control the order of things for two reasons:
   * It will be much simpler to debug and understand the running of your code if your current process completes first, and then the side-effect/consequence of some of your calls in this process is handled afterwards.
   * You might trigger related side-effects several times during your process. For example, the browser can trigger a side-effect function every time an HTML attribute changes, when that attribute is observed by a `MutationObserver`. If your function is incrementally changing this attribute value several times during its process, you would much rather that the side-effect runs *once after your process has completed* and all your incremental changes has been performed, instead of *several times in the middle of your process* for each increment of the same value.
   
In the next demo, we will illustrate the `MutationObserver` use case for the microtask queue. We will create our own `mutableObject` with a `count` property. We hide this property behind a pair of get/set methods, and when the set method changes the value of the `count` property, we add a method to the microTask queue. But! We only add one call to the microtask queue. If the `mutableObject` has already triggered such a call, we do nothing. (To simplify the code example, we strip out the error handling.)

```javascript 
/** microtask queue start **/
const microTasks = [];

function startMicroTaskProcessing(){
  while (microTasks.length){
    const nextTask = microTasks.shift();
    nextTask.call();
  }
}

function addMicroTask(task){
  microTasks.push(task);
}
/** microtask queue end **/

/** mutable object start **/
class MutableObject{
  constructor(){
    this._count = 0;
    this._countCallTriggered = false;
    this.message = "not yet!";
  }

  set count(value){
    console.log("setting new count");
    if (!this._countCallTriggered){   
      console.log("adding async call to the microtask queue");
      this._countCallTriggered = true;
      addMicroTask(this._updateMessage.bind(this));
    }
    this._count = value;
  }

  get count(){
    return this._count;
  }

  _updateMessage(){
    console.log("performing the async task (ie. updating message)");
    if (this.count > 2)
      this.message = "hello sunshine!";
    this._countCallTriggered = false;
    console.log(this.message);
  }
}
/** mutable object end **/

/** demo start **/
const mutableObject = new MutableObject();

addMicroTask(function(){ 
  console.log("a");
  mutableObject.count += 1; 
  console.log(mutableObject.message);
});
addMicroTask(function(){ 
  console.log("b");
  mutableObject.count += 1; 
  console.log(mutableObject.message);
});
addMicroTask(function(){ 
  console.log("c");
  mutableObject.count += 1; 
  console.log(mutableObject.message);
});

startMicroTaskProcessing();

/** demo end **/
```   

Result:

```
1.  a
2.  setting new count
3.  adding async call to the microtask queue
4.  not yet!
5.  b
6.  setting new count
7.  not yet!
8.  c
9.  setting new count
10. not yet!
11. performing the async task (ie. updating message)
12. hello sunshine!
```

1. Then, three tasks are added to the microtask queue array (3x `addMicroTask()`).
2. Then the microtask queue is started (`startMicroTaskProcessing()`).
   1. The first microtask is run. This prints line 1-4. As the `objectMutable.count` has not been changed since last update, the `objectMutable` wants to run a side-effect task of updating the `.message` based on the `.count` property. But, this task is not run immediately, it is instead added to the microtask queue. This means that the first task in the microtask queue adds another forth task to the microtask queue.
   2. The second microtask is run. This prints line 5-7.     
   3. The third microtask is run. This prints line 8-10. At this point, the `count === 3`, and so you might expect that the `message` would be updated. But, the process `_updateMessage()` is considered a side-effect, and to avoid this side-effect interfering with the logic of the current process, it is invoked *asynchronously*, ie. the system delays doing this task until it has completed the other tasks it is already working on/knows about. Hence, the message is still: `not yet!`     
   4. The forth microtask is run (`objectMutable._updateMessage()`). This prints line 11 and 12. The task was added during the execution of the first microtask.
3. The microtask queue is emptied, and the `startMicroTaskProcessing()` returns.

## References

  * dunno