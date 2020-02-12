# Discussion: EventCascades queued

> Two perspectives: To queue is an art, and the JS event loop is the worlds biggest queue.

> Event controllers often queue multiple tasks per event.

JS is controlled by the event loop, and the event controllers respond to this queue and adds events to it. However, the computer moves at superhuman speed. Therefore it can be very difficult to understand (read: feel) where and how events in an event cascade are queued. This is bad, as we need a sense of how this works. So, to remedy this, we will slow down the event cascade so we can keep up.  

## Demo: a slow `contextmenu` event cascade

```html
<h1>Right click me!</h1>
<div>Right click me (no context menu)</div>

<script>
  (function () {
    function sleep(ms) {
      const startTime = new Date().getTime();
      while (startTime + ms > new Date().getTime()) ;
    }

    function log(e) {
      console.log(e.type);
      sleep(2000);
    }

    window.addEventListener("mousedown", e => log(e));
    window.addEventListener("contextmenu", e => log(e));
    window.addEventListener("auxclick", e => log(e));

    const div = document.querySelector("div");
    div.addEventListener("contextmenu", e => e.preventDefault());
  })();
</script>
```

From this demo we see with our own eyes that the `contextmenu` event is dispatched *before* the context menu is shown on screen. This we can also deduce from the fact that `.preventDefault()` on the `contextmenu` can block this action, but still, it is nice to see it happening real time with our own eyes too.  

## InDepth: queueing events

But, there are more questions remaining:
1. What about the microtask queue?
2. How do the tasks queued in the event loop compare to other tasks?
3. How do the browser implement event controllers?
4. How can developers implement event controllers?  

```html
<h1>Right click me</h1>


<script>
  function sleep(ms) {
    const startTime = new Date().getTime();
    while (startTime + ms > new Date().getTime()) ;
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
    toggleTick(function () {
      //debugger;
      console.log("mAcrotask queued from " + e.type);
    });
  }

  function microTask(e) {
    Promise.resolve().then(function () {
      Promise.resolve().then(function () {
        console.log("mIcrotask queued from " + e.type);
      });
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
1. The microtasks are run immediately after each event listener for both the async `mousedown` and `contextmenu` events. This means that each task in the event loop cascade is queued in a queue with lower priority than the microtask queue: ie. somewhere in the event loop.
   * Att! The microtask from `contextmenu` is run *before* we can see the context menu on screen. This means that the two subtasks of a) dispatching the `contextmenu` event and b) showing the context menu are *queued separately* in the event loop.
2. But, the macrotask we add to the event loop during `mousedown` is run *after* both the event propagation of `contextmenu` and the task `show context menu`. This likely means that:

   1. Native event controllers run each step in the event cascade as a controller that is triggered immediately after an event has finished propagating, as some kind of postpropagation callback. Note: such a callback does not(!) exist in JS.
 
   2. Alternatively, the controller *could* add the whole sequence up front, even *before* the `mousedown` propagates. This would achieve the same effect. This method *is* repeatable from JS, and this is what we did in our previous ContextmenuController.
   
   3. Tasks in the event cascade is added to another macrotask queue in the event loop that is always given priority over "normal DOM event queue" (such as `toggleTick` tasks). A prime candidate for such a queue would be the AsyncEventListenerQueue from chapter 2.8. It is however unlikely that the browser would do this, as method one seems conceptually simpler. This method is also not accessible from JS. 

In this chapter we assume that the browser natively follows method 1 above, and that we from JS should follow method 2.

## The native model of an event cascade

```
  prop(A) ⇒ eval(A) ⇒ prop(B) ⇒ eval(B) ⇒ prop(C) ⇒ run(D)
  ↓    ↑              ↓    ↑              ↓    ↑
cap    bub          cap    bub          cap    bub
  ↳ tar⮥              ↳ tar⮥              ↳ tar⮥  
```

1. First, the trigger **event A propagates**. Event A propagates down and up the DOM and triggers event listeners. Initial trigger events are most often triggered by the user, the network or something else outside the DOM.
2. The browser **post-evaluates*** event A in the context of the current session and DOM. For example:
   * the browser keeps tabs on the previous `mousedown` event that it uses to evaluate a subsequent `mouseup` event;
   * the browser might see that the `.button` property of the event has a certain value; or
   * the browser sees that the `.preventDefault()` has been called.

   During post-evaluation of event A, the browser concludes that event A should trigger event B. The browser therefore **immediately** dispatches event B.
3. **Event B propagates**.
4. The browser **post-evaluates event B**. The browser discovers that it should trigger action C. This action can be a universal browser command such as "navigate to web page X" or a DOM related action such as "flip the value of checkbox Y".
5. The browser **runs action C**.

 * However, during post-evaluation, the browser might find that it needs to run several tasks and/or dispatch several events. *If* these events are to run *sync*, then the browser can simply perform them one by one within the same macrotask. However, there are events that are queued asynchronously from a post-evaluation callback, for example `dblclick` and `auxclick`. To mirror such queuing, we use *two* `setTimeout()` callbacks in our demos.

Att! We do not *know* that the browser's native event controller functions behave in this way. But it is conceptually reasonable to assume so.

## The JS model of a SYNC event cascade

When we wish to mimic event cascades from JS, without access to any postpropagation callback, the event cascade looks like this:

``` 
SYNC event cascade

    ↱--------- queue 1 ---------↴    
eval(A) ⇒ prop(A)   ⇒ |-------- task 1 ---|
            ↓    ↑       prop(B) ⇒ run(C)   
          cap    bub     ↓    ↑              
            ↳ tar⮥     cap    bub          
                         ↳ tar⮥              
```
1. The user triggers A, such as a `mousedown`.
2. The JS function **pre-evaluates event A**, *before* event A propagates.
3. During this pre-evaluation the JS function sees that it needs to perform an action. Then, the function uses this info to decide that it wants to run a task that 
   * dispatches an event B and then
   * run task C.
   
The browser therefore **queues *one* tasks in the event loop** that will run these two (sub)tasks synchronously. 

Note: any microtasks added in an event listener for event B will run after task C. This makes the sync model of event control less than ideal.

## The JS model of an ASYNC event cascade

``` 
ASYNC event cascade

    ↱------------------- queue 3 ------------↴
    ↱------------- queue 2 ----------↴
    ↱------ queue 1 ------↴    
eval(A) ⇒ prop(A)   ⇒   prop(B) ⇒ run(C) ⇒ prop(D)
            ↓    ↑      ↓    ↑             ↓    ↑
          cap    bub  cap    bub         cap    bub
            ↳ tar⮥      ↳ tar⮥             ↳ tar⮥  
```

1. The user triggers A, such as a `mouseup`.
2. The JS function **pre-evaluates event A**, *before* event A propagates.
3. During this pre-evaluation the JS function sees that it needs to perform an action. It identifies *three* asynchronous tasks that it should do as a consequence of this task. An example of this might be a `mouseup` event that triggers a) a `click` event, b) the change of an `<input type="text">`, and finally c) dispatch of a `dblclick` event. The browser therefore queues *all* three tasks *separately* in the event loop, *at the same time*, and *before* the trigger event has even propagated. 

Note: any microtasks added in an event listener for event B will run before task C, and any microtasks triggered as a consequence of running C will run before event D propagates. This makes the async model of event control better suited than the sync model of event control.

## References

 * 
