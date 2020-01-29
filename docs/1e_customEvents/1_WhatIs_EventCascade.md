# WhatIs: EventCascade

Very often, one event will *trigger* another subsequent event or action. For example: when a `mouseup` event occurs, it triggers a `click` event most of the time. And if that `click` event occurs on a checkbox, this will cause the checkbox to flip state. It's a domino-effect: the `mouseup` triggers a `click` that triggers a `checkbox.checked =! checkbox.checked` action. And we call this domino-effect between events an EventCascade.  

## Demo: `contextmenu` event cascade

To understand how EventCascades work, we look at an example containing *two* events (`mousedown` and `contextmenu`) and an action (`show context menu`). How does that work? In the demo below, we delay each step in the EventCascade by a second in order to see the sequence more clearly. 

```html
<h1>Right click me!</h1>

<script>
  function sleep(ms){
    const startTime = new Date().getTime();
    while(startTime + ms > new Date().getTime());
  }

  function log(e) {
    console.log(e.type);
    sleep(1000);
  }

  const h1 = document.querySelector("h1");

  h1.addEventListener("mousedown", log);
  h1.addEventListener("contextmenu", log);
</script>
```
Basically, this is happening:

1. The user triggers `mousedown`.
2. The browser sees that it is a right-click `mousedown` and triggers a `contextmenu` event.
3. The browser then sees the `contextmenu` and then runs the `show context menu` action.

## Demo 2: proper queue culture

But, the demo above hides an intriguing facet: the queue. To queue properly is an artform, and the JS event loop is the worlds biggest queue. So, to show how the different tasks are queued, we run a slightly different test of `contextmenu`.

```html
<h1>Right click me</h1>


<script>
  function sleep(ms){
    const startTime = new Date().getTime();
    while(startTime + ms > new Date().getTime());
  }

  function toggleTick(cb) {
    const details = document.createElement("details");
    details.style.display = "none";
    details.ontoggle = cb;
    document.body.appendChild(details);
    details.open = true;
    Promise.resolve().then(details.remove.bind(details));
    return {
      cancel: function(){ details.ontoggle = undefined; },
      resume: function(){ details.ontoggle = cb; }
    };
  }

  function macroTask(e) {
    toggleTick(function(){
      sleep(2000);
      console.log("mAcrotask queued from " + e.type);
    });
  }

  function microTask(e) {
    Promise.resolve().then(function(){
      console.log("mIcrotask queued from " + e.type);
    });
  }

  const h1 = document.querySelector("h1");

  h1.addEventListener("mousedown", e => console.log(e.type));
  h1.addEventListener("mousedown", e => microTask(e));
  h1.addEventListener("mousedown", e => macroTask(e));
  h1.addEventListener("mousedown", e => sleep(1000));
  h1.addEventListener("contextmenu", e => console.log(e.type));
  h1.addEventListener("contextmenu", e => microTask(e));
  h1.addEventListener("contextmenu", e => macroTask(e));
  h1.addEventListener("contextmenu", e => sleep(1000));
</script>
``` 

Results:

```
mousedown
mIcrotask queued from mousedown
contextmenu
mIcrotask queued from contextmenu
//shows the native context menu
mAcrotask queued from mousedown
mAcrotask queued from contextmenu
```

Findings:
1. The microtasks are run immediately after the event listener. This means that the tasks in the event cascade is queued in a queue with lower priority than the microtask queue: ie. the event loop.
   * Att! Note this finding about the task `show context menu`. As the microtask from `contextmenu` is run *before* we can see the context menu on screen, this default action of `contextmenu` event is queued separately from the function that dispatches the task `contextmenu` in the event loop.
2. But, the macrotask we add to the event loop during `mousedown` is run *after* both the event propagation of `contextmenu` and the task `show context menu`. This can mean one of two things:
 
   1. *Both tasks* (trigger `contextmenu` event and `show context menu` action) is added to the queue *at the same time*. This means that *before* the `mousedown` propagates, the two subsequent tasks in the event cascade has already been added to the event loop.
   2. Tasks in the event cascade is added to another macrotask queue in the event loop that is always given priority over "normal DOM event queue" (`toggleTick` tasks). A prime candidate for such a queue would be the AsyncEventListenerQueue from chapter 2.8.

In this chapter we are going to assume that *both* models are correct(!): 
1. Internally, we assume that the browser actually queues the `show context menu` task *after* the `contextmenu` is triggered, but that it does so in a macrotask queue in the event loop that has topmost priority over all other parts of the event loop (such as the AsyncEventListenerQueue).
2. But we cannot access these top-priority queues in the event loop. Therefore, for our practical purposes as developers, the browser essentially queues *both* tasks in the event loop at the outset. Since we have no means to put another task in between, never ever.

## Practical model of an event cascade

For us as JS developers, the event cascade looks like this:

```                                  
                ↱--------- queue 2 ----------↴
                ↱---- queue 1 ----↴    
trigger(A) ⇒ eval(A) ⇒ prop(A) ⇒ eval(B) ⇒ prop(B) ⇒ run(C)
                       ↓    ↑              ↓    ↑
                     cap    bub          cap    bub
                       ↳ tar⮥              ↳ tar⮥  
```

1. The user triggers `mousedown`.
2. The browser **pre-evaluates the `mousedown` event**.
3. During this pre-evaluation the browser sees that the right mouse button is being pressed. To the browser, this means that `mousedown` event should trigger a `contextmenu` event, which in turn should trigger a `show context menu` action. The browser therefore **queues two tasks in the event loop at the same time** dispatch `contextmenu` event and `show context menu` action.
4. The browser **dispatches `mousedown`**. The `mousedown` event propagates down and up the DOM and triggers `mousedown` event listeners added to targets in its path.
5. The browser **dispatches `contextmenu`** event.
6. The browser **runs `show context menu`**.

Practically, from a developers standpoint, the browser works as a que-list-of-tasks-per-event-model.

## Conceptual model of an event cascade

```
                ↱---- queue ----↴    ↱---- queue ----↴
trigger(A) ⇒ eval(A) ⇒ prop(A) ⇒ eval(B) ⇒ prop(B) ⇒ run(C)
                       ↓    ↑              ↓    ↑
                     cap    bub          cap    bub
                       ↳ tar⮥              ↳ tar⮥  
```

1. The first event A is triggered. Initial events are most often triggered by users, the network or something outside the browser window.
2. The browser **pre-evaluates*** event A in the context of the current session. For example, the browser keeps tabs on the previous `mousedown` event that it uses to evaluate a subsequent `mouseup` event.
3. During pre-evaluation of event A, the browser concludes that event A should trigger event B. The browser therefore **queues event B in the event loop**. Pre-evaluation of A ends.
4. *After* pre-evaluation of A and queueing of B in the event loop, the browser **dispatches event A**. The event propagates down and up the DOM and triggers event listeners added to targets in its path.
5. **Event B is pre-evaluated** in context.
6. During pre-evaluation of B, the browser discovers that it should trigger action C. This action can be a universal browser command such as "navigate to web page X" or a DOM related action such as "flip the value of checkbox Y". **Action C is queued in the event loop**. Pre-evaluation of B ends.    
7. The browser **dispatches event B**. Event B propagates down and up the DOM and triggers event listeners.
8. The browser **runs action C**. 

Conceptually, and probably internally, the browser works as a queue-one-task-per-event model.

## References

 * [Smashing: EventCascade](https://www.smashingmagazine.com/2015/03/better-browser-input-events/)
