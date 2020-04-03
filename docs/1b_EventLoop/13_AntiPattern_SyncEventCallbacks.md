# AntiPattern: SyncEventCallbacks

The purpose of any `nextTick(task)` function is to push the `task` into the event loop to run at the next tick of the event loop. The `task` should run *async*. 

```javascript
console.log("one");
nextTick(()=> console.log("task"));
console.log("two");
Promise.resolve().then(()=>console.log("three"));
```

When `nextTick(task)` correctly delays a task in the event loop, this task should produce the output:

```
one
two
three
task        //async
``` 

The `setTimeout`, `setZeroTimeout`, ToggleTickTrick, UglyDuckling, and LinkLoad patterns all dispatch their event *async*. These patterns therefore all work as so  which therefore indirectly queue any tasks added inside an event listener to their events in the event loop.

## Sync event dispatch

But. There are many other ways to queue a new event in a browser *sync*. These events begin their propagation immediately, and will therefore not indirectly delay any event listener tasks that listen for them in the event loop. Thus, when these event triggering mechanisms are used, the `nextTick(task)` will run sync and produce the following output:

```
one
task        //sync
two
three
``` 

The list of sync event dispatch mechanisms in this chapter are:

1. `dispatchEvent(new Event)` to `event` on `window` 
1. `click()` to `change` on `<input type="checkbox">`  
1. `checkValidity()` to `invalid` on `<input type="text">`  
1. `reset()` to `reset` on `<form>`  

## 1. `dispatchEvent(new Event)` to `event` on `window`

The below example produce **no async delay!**

```html
<h1>dispatchEvent(new Event) to event on window is sync</h1>

<script>
  function dispatchTick(cb) {
    const event = new Event("custom-event");
    const fun = function(){
      window.removeEventListener("custom-event", fun);
      cb();
    };
    window.addEventListener("custom-event", fun);
    window.dispatchEvent(event);
  }
  console.log("one");
  dispatchTick(()=> console.log("task"));
  console.log("two");
  Promise.resolve().then(()=>console.log("three"));
</script>
```

Produces a sync output: `one, task, two, three`.

##2. `click()` to `change` on `<input type="checkbox">`

The below example produce **no async delay!**

```html
<h1>.click() to change is sync</h1>

<script>
  function changeTick(cb) {
    const input = document.createElement("input");
    input.setAttribute("type", "checkbox");
    input.style.display = "none";
    input.onchange = cb;
    document.body.appendChild(input);
    input.click();
  }
  console.log("one");
  changeTick(()=> console.log("task"));
  console.log("two");
  Promise.resolve().then(()=>console.log("three"));
</script>
```

Produces a sync output: `one, task, two, three`.

## The sync `checkValidity()` to `invalid` on `<input>`

The below example produce **no async delay!**

```html
<h1>.checkValidity() to invalid is sync</h1>

<script>
  function invalidTick(cb) {
    const input = document.createElement("input");
    // input.setAttribute("type", "checkbox"); //not necessary as 'text' is default type 
    input.setAttribute("value", "");
    input.setAttribute("required", "");
    input.style.display = "none";
    input.oninvalid = cb;
    document.body.appendChild(input);
    input.checkValidity();
  }
  console.log("one");
  invalidTick(()=> console.log("task"));
  console.log("two");
  Promise.resolve().then(()=>console.log("three"));
</script>
```

Produces a sync output: `one, task, two, three`.

## The sync `reset()` to `reset` on `<form>`

The below example produce **no async delay!**

```html
<h1>.reset() to reset is sync</h1>

<script>
  function resetTick(cb) {
    const form = document.createElement("form");
    form.style.display = "none";
    form.onreset = cb;
    document.body.appendChild(form);
    form.reset();
  }
  console.log("one");
  resetTick(()=> console.log("task"));
  console.log("two");
  Promise.resolve().then(()=>console.log("three"));
</script>
```

Produces a sync output: `one, task, two, three`.

## References

  * dunno