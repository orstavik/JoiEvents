# Pattern: add DefaultAction using `setTimeout(...)`

To add a default action to an event, we simply need to call a function when the event's propagation ends. But. There is no `event.postPropagationCallback(cb)` in JS. And there is no event listener option that ensures that an event listener will a) be called last and b) be triggered even if `stopPropagation()` or `stopImmediatePropagation()` is called on the event *before* it runs.

## How to queue a custom default action? 

To avoid StopPropagationTorpedoes, we must therefore add the default action task as a new macrotask in the event loop.

```
           prop(eventA)       actionA    =>   prop(eventB)       actionB
              ↓    ↑            ↑                 ↓    ↑            ↑
  DefaultAction    bub          ↑     DefaultAction    bub          ↑
      ↓       ↓    ↑            ↑        ↓        ↓    ↑            ↑
      ↓     cap    bub          ↑        ↓      cap    bub          ↑
      ↓       ↳tar ⮥            ↑        ↓        ↳tar ⮥            ↑
      ↓                         ↑        ↓                          ↑
      ↳----------- queue  ------⮥        ↳------------ queue  ------⮥
```

The simplest way to add a new task in the event loop is using `setTimeout(...)`.

To ensure that the `setTimeout(...)` default action task is added for every event instance that require it, we add an EarlyBird event listener that checks to see if there are relevant target elements for the given event type, and in such instances adds the `setTimeout` task that contains our default action.
 
## Demo: 

```html
<div singleclick-action>
  default action added to DIV elements with a singleclick-action attribute
</div>

<script>
  function singleClickDefaultAction(event) {
    console.log("click default action trigger by ", event.type);
  }
  
  //EarlyBird event listener that adds the default action task to the event loop 
  window.addEventListener("click", function (e) {
    for (let element of e.composedPath()) {  //finding matching element for the default action
      if (element instanceof HTMLDivElement && element.hasAttribute("singleclick-action"))
        return setTimeout(() => singleDefaultClickAction(e), 0);
    }
  }, true);

  window.addEventListener("click", e => console.log(e.type));
</script>
```

## References

 * 