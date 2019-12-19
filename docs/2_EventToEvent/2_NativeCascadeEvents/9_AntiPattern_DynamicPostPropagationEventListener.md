# Anti-pattern: Dynamic postPropagation event listener

> If you are already familiar with how events propagate, and how `.stopPropagation()` works, this chapter would be fairly self explanatory.

The last event listener that is called, marks in a sense the end of and events propagation. Thus, adding an event listener at the end of an event's propagation cycle, could be used as a strategy to implement a postPropagation callback.
 
The location of such an event listener would be known. It would either be:
* at the `window` element in the bubble phase (for events that bubble), or
* as late as possible on the target element (for non-bubbling events).
 
But. There are two major obstacles with this approach:
1. If another event listeners earlier in the propagation chain calls `.stopPropagation()` or `stopImmediatePropagation()`, later event listeners will be cancelled.
2. Other functions and event listeners may very well also add an event listener to the end placement in your propagation cycle. With good reason. Thus, relying on a particular event listener to always be called *after* all other event listeners, is not feasible unless you control all the event listeners (which again is not feasible if you aim to develop code modules that can be reused across many different apps).

## Demo: How to torpedo other event listeners

```html 
<div>
  <a href="#sunshine">Hello sunshine!</a>
</div>
<script>

  function log(e){                      
    debugger;
    console.log(e.type, e.currentTarget.TYPE);
  }
  
  function torpedo(e){
    console.log("here comes the torpedo! After me, there is nothing but silence.")
    e.stopPropagation();
  }
  
  const div = document.querySelector("div");
  const link = document.querySelector("a");
  div.addEventListener("click", log, true); 
  link.addEventListener("click", log, true);
  link.addEventListener("click", log);
  div.addEventListener("click", log); 
</script>
```

## Proposal: HowToMake

We want a callback for specific events that:
1. runs *after* all the (other) event listeners have been called for a specific event, and
2. that cannot be cancelled by `.stopPropagation()`.

We want this callback to be dynamically controlled using an event listener. Why? First, because controlling the callback from a static, universal state is problematic. The browser will not start event propagation for events that have no listeners. The browser can filter out unnecessary checks of event listeners if there are never any functions listening for the specified event. Put simply, the browser is actively geared against optimizing its functionality based on which event listeners are registered.

We have to add the call to the  

To achieve such functionality using the native event listener queue, would require us to:
1. monkey-patch-alter the `HTMLElement.addEventListener` method, and
2. monkey-patch-add a `Event.setPostPropagationCallback` method.

A monkey-patch solution is **NOT RECOMMENDED**. Implementing it could high-jack the consensus driven  as it is **NOT REUSABLE** and would likely **NOT WORK WITH OTHER LIBRARIES**. However, it would be  

```html 
<script>
  (function(){
    const ogAddEventListener = HTMLElement.prototype.addEventListener;
    HTMLElement.prototype.addEventListener = function(type, cb, options){
      const wrappedCb = function(...args){
        cb(...args);
        const event = args[0];
        if (event.cancelBubble && event._postPropagationCB)
          event._postPropagationCB(...args);
      };
      ogAddEventListener.apply(this, [type, wrappedCb, options]);
    };

    Event.prototype.setPostPropagationCallback = function(cb){
      this._postPropagationCB = cb;
    }
  })();
</script>

<div>
  <a href="#sunshine">Hello sunshine!</a>
</div>

<script>

  function log(e){
    console.log(e.type, e.currentTarget.tagName);
  }

  function torpedo(e){
    console.log("here comes the torpedo again!");
    e.stopImmediatePropagation();
  }

  const div = document.querySelector("div");
  const link = document.querySelector("a");
  div.addEventListener("click", function(e){
    e.setPostPropagationCallback(function(){
      console.log("a postPropagation callback!");
    });
  }, true);
  div.addEventListener("click", log, true);
  link.addEventListener("click", log, true);
  link.addEventListener("click", torpedo);
  link.addEventListener("click", log);
  div.addEventListener("click", log);
</script>
```

, and b) is not , would require monkey-patching `.stopPropagation()` methods, `.addEventListener()` and adding a `Event.postPropagation(cb)` method. This is deemed too invasive

## References

 * https://github.com/whatwg/dom/issues/211