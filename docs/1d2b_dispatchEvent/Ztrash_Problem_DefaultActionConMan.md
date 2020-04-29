## The look from the inside

There is one pattern that is *very* tempting to make, when calling `dispatchEvent(myEvent)`. I call it the DefaultActionConMan problem. It looks like this:

```javascript
const myEvent = new CustomEvent("my-event", {/*bubble and composed settings doesn't matter*/});
someElement.dispatchEvent(myEvent);
//the event now propagates
if (!myEvent.defaultPrevented){
  console.log("do your defaultAction equivalent here");
}
``` 

This looks nice! Very nice and simple! But. It is unsafe. Unfortunately. Because it checks `e.defaultPrevented`, which is not unlikely to cause problems as event listeners for this event might assume that they can call `.preventDefault()` on the element from inside a microtask. Which is what the developers are used to from native events triggered by for example user actions.

Sure. There are native events that run sync. The focus events for example. But, from the developer perspective, these events are triggered outside of the developers focus. So the developer can never be fooled in the same way as when he/she dispatches the event themselves.   

## Demo: too late microtasks

```html
<a href="#go">hello sunshine! Calling preventDefault() on an link click can be done from a microtask.</a>
<script>
  document.querySelector("a").addEventListener("click", e => Promise.resolve().then(() => e.preventDefault()));
</script>

<h1>hello DefaultActionConMan!</h1>
<p>When you use dispatchEvent(...) be aware that microtasks have not run when the method returns.</p>
<script>
  const h1 = document.querySelector("h1");
  const a = document.querySelector("a");
  h1.addEventListener("click", e => {
    const myEvent = new CustomEvent("my-event", {cancelable: true});
    console.log("A");
    e.target.dispatchEvent(myEvent);
    if (!myEvent.defaultPrevented) {
      console.log(" - C");
      console.log(" - Hello DefaultActionConMan");
      console.log(" - when defaultPrevented is checked, we assume that event propagation is completed.");
    }
  });

  h1.addEventListener("my-event", e => console.log("B"));
  h1.addEventListener("my-event", e => Promise.resolve().then(function () {
    console.log("D");
    console.log("but in this microtask, I might assume that I could still call .preventDefault()");
    e.preventDefault();
  }));
</script>
```

This has two consequences:
1. adding a default action cannot be done sync in the code, immediately after the dispatchEvent. This will not work. Thus, the DefaultActionConMan is not a pattern that should be used when making and dispatching custom future-tense events. Instead, use the proper addDefaultAction pattern.
2. the dispatchEvent should not be done in the middle of the code. It should be done at the end of a frame, kinda-like a frame return statement. You should try to clean up your code before calling dispatchEvent(). 

## Solution: use `addDefaultAction()`

```html
<script src="addDefaultAction.js"></script>
<h1>hello DefaultAction sunshine!</h1>
<h2>hello world of preventDefault!</h2>
<p>When you use addDefaultAction(...), microtasks established during event propagation will run before the default action.</p>
<script>
  const h1 = document.querySelector("h1");
  const h2 = document.querySelector("h2");
  window.addEventListener("click", e => {
    const myEventTarget = e.target;
    const myEvent = new CustomEvent("my-event", {cancelable: true});
    myEvent.addDefaultAction(function(){
      console.log(" - D1");
      console.log(" - Hello DefaultAction");
      console.log(" - when defaultPrevented is checked, the event propagation is completed.");
    }, {preventable: myEventTarget});
    //be aware that the preventable element should be set as the target you plan to dispatch the event at
    console.log("A");
    myEventTarget.dispatchEvent(myEvent);
  });

  window.addEventListener("my-event", e => console.log("B"), true);
  h1.addEventListener("my-event", e => Promise.resolve().then(function () {
    console.log("C1");
  }));
  h2.addEventListener("my-event", e => Promise.resolve().then(function () {
    console.log("C2");
    console.log("I can still call .preventDefault() from microtasks");
    e.preventDefault();
  }));
</script>
```
 

## References