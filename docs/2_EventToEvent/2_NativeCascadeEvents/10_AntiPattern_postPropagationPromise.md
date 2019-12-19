# Anti-pattern: postPropagation Promise

Can we implement a postPropagationCallback using `Promise`?

`Promise.resolve().then( callback )` places the callback in the micro-task queue. The micro-task queue is checked for new available tasks as soon as the current javascript stack is empty. 

But. Event listeners are added to the javascript stack one by one. And the native function in the browser that handles event propagation is not added to the javascript stack. This essentially means that there are *three* task queues in JS:
1. **The event loop**. The top, macro-task queue of the main, overall tasks in the main thread. The EventCascade is handled at this level.
2. **The event listener queue**. The native event propagation function that call JS event listeners one by one in correct order.
3. **The micro-task queue**. Promises handled asap.

## Demo: Promises are honored before the next event listener is called

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

## Conclusion

A `Promise` either `resolve` or `reject` during the current javascript frame. If a `Promise` is to be checked again at a later time, it must be polled by setting up a new task. This polling task to check if the `Promise` has resolved yet is most commonly achieved using `setTimeout()`. In conclusion, a postPropagationCallback cannot be created using `Promise` and the micro-task queue.

## References

 * 