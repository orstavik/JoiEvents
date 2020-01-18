# WhatIs: the Microtask Queue?

There are two main queue levels in the browsers: 
1. The event loop with its various and varying macrotask queues.
2. The microtask queue.

In order for the browser to pick a new task from the event loop, the microtask must be completely emptied.

It is possible to go on describing the microtask queue in English metaphors for a long time. But. I'm not sure it would help that much in order to understand it. Instead, I will skip the metaphors, and "teach" the microtask queue in JS.
 
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

## Demo 4: A minimalistic microtask queue with simple error handling 

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


## References

  * dunno