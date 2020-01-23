# Problem: Async vs sync event propagation

Event listeners dispatched by the browser as a reaction to system or user driven events are added as individual macrotasks. Event listeners triggered by scripts such as `el.click()`, `dispatchEvent(new MouseEvent("click", {bubbles: true}))` or `dispatchEvent(new CustomEvent("my-event"))` are run synchronously and not divided into tasks.

## Demo: Sync vs async `click` propagation   

```html
<div id="outer">
  <h1 id="inner">Click on me!</h1>
</div>

<script>
  function log(e) {
    const thisTarget = e.currentTarget.id;
    console.log(e.type + " on #" + thisTarget);
    Promise.resolve().then(function() {
      console.log("microtask from #" + thisTarget);
    });
  }
  
  function log2(e){
    log(e);
  }

  const inner = document.querySelector("#inner");
  const outer = document.querySelector("#outer");
  
  inner.addEventListener("click", log);
  inner.addEventListener("click", log2);
  outer.addEventListener("click", log);

  inner.dispatchEvent(new MouseEvent("click", {bubbles: true}));
</script>
```

When you `click` on "Click on me!" using either mouse or touch, then you will see the following result printed out in the console.

```

1. click on #inner
2. click on #inner
3. click on #outer
4. microtask from #inner
5. microtask from #inner
6. microtask from #outer

7.  click on #inner
8.  microtask from #inner
9.  click on #inner
10. microtask from #inner
11. click on #outer
12. microtask from #outer

``` 

 * Lines 1-6 is the output from `.dispatchEvent(new MouseEvent("click", {bubbles: true}))` on the "Click on me!" element. All three event listeners are run *before* any of the tasks added to the microtask queue.
 
 * Lines 7-12 is the output from the "native" reaction to the user action of clicking on "Click on me!" with either mouse or touch. Here, the tasks added to the microtask queue are run *before* the next event listener.
 
## Conclusion

When the browser dispatches native events, it will queue the event listeners in the event loop. Or. It will queue them in what would conceptually be *the top-most prioritized* macrotask queue in the event loop, but still a queue that would have lower priority than the microtask queue.

When a script dispatches an event to a target, these events are run synchronously. They run as if the browser simply loops through each task. But. The browser will handle and catch any errors that occur during each event listener callback, and will ensure that errors in an early event listener will not block the running of later event listeners.

## References

 * [MDN: sync vs async event listeners](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent#Notes)