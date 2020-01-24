# Problem: postPropagationCallback

We need to have a function run immediately after an event has finished its propagation. There are several approaches to accomplish this, and there are problems with all of them.

## 1. Postpone/trigger function callback using Promise

doesn't work because the Promise is executed before the next event listener. That means that the overall task que looks like this:

1. The event loop, or the macro task queue.
2. Event propagation, or the event listener function queue.
3. Promises, ie. the micro task queue.

https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent#Notes

The Event propagation queue is different from natively fired events and script triggered events. Put simply, when the browser dispatches a native event, it adds each event listener as a task in the event loop (the macro queue). When a script triggers event propagation via .dispatchEvent, then the event listeners are added one by one in the micro-task queue.

```html 
<div>
  <a href="#sunshine">Hello sunshine!</a>
</div>
<script>
  function a(){
    console.log("a");
    Promise.resolve().then(()=>{
      console.log("Has the propagation completed? If so, both 'a' and 'b' should be printed before this line.");
    });
  }
  
  function b(){
    console.log("b");
  }
  
  const div = document.querySelector("div");
  const link = document.querySelector("a");
  link.addEventListener("click", a);//bubble phase event listener, lowest target is processed first
  div.addEventListener("click", b); //bubble phase event listener, highest target is processed last
</script>
```

## 2. Postpone/trigger function using setTimeout

This works, but is postponed *after* the defaultAction being run as well.
The defaultAction is queued at the same time as the

Two drawbacks, a) defaultAction runs before the postPropagationCallback
b) if more than approx. 5 setTimeout0 functions are nested inside this callback, then they will be clamped with 4ms. 

## 3. Postpone/trigger function using postMessage

Has the same drawback as using setTimeout0 with regards to defaultAction, but does not have the problem with of being clamped by 4ms.