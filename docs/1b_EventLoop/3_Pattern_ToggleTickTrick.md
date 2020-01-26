# Pattern: ToggleTickTrick

The first pattern we will look at is a method for adding task/callback in the event loop's "normal DOM Event macrotask queue". Ie. a method for adding a task with the same priority as a normal DOM Event. We call this method the ToggleTickTrick.

## Implementation: `toggle` from `<details>`

### Step 1: the naive basics

The ToggleTickTrick:
1. uses the `<details>` element 
2. and change the `.open` property on this element that in turn will
3. queue a `toggle` event in the event loop's "normal DOM Event macrotask queue" that
4. we can add an event listener for that in turn will
5. trigger the callback.

* But, for step 2 (changing the `.open` property on the `<details>` element) to trigger step 3 (queue a `toggle` event), the `<details>` the need to be connected to the DOM. We end up with this first draft. 

```javascript
function toggleTick(cb) {
  const details = document.createElement("details");
  details.ontoggle = cb;
  document.body.appendChild(details);
  details.open = true;
}

toggleTick(function(){
  console.log("two");
});
console.log("one");
//one
//two
``` 

The first big problem here is that the `<details>` element we added to the DOM will remain in the DOM indefinitely. We need to cleanup, remove the `<details>` element from the DOM when we have triggered the callback.

### Step 2: ToggleTickTrick clean 1

```javascript
function toggleTick(cb) {
  const details = document.createElement("details");
  details.style.display = "none";       //details is invisible and takes no layout space
  details.ontoggle = function () {
    details.remove();                   //details removed when the callback is made
    cb();
  };
  document.body.appendChild(details);
  details.open = true;
}

toggleTick(function(){
  console.log("two");
});
console.log("one");
//one
//two
``` 

### Step 3: ToggleTickTrick cleanest

But. There is a way to do this even better. We need to have the `<details>` element connected to the DOM in order for the `toggle` event to be added to the event loop. But for *how long* does the `<details>` element need to be connected? Does the `<details>` element need to be connected all the time until the `toggle` event is dispatched?

No. It doesn't. There are three details you need to know here:
1. When the `.open` property is flipped, this will always either adds or removes `open` attribute on the `<details>` element so that the `open` attribute and `open` property is in sync.
2. It is a `MutationObserver` on the `open` attribute on the `<details>` element that adds the `toggle` task to the event loop.
3. An element such as `<details>` *does NOT* have to be connected to the DOM for an event to be dispatched to it.

Wow.. This means that:
1. if we queue a task in the microtask after the `open` attribute `MutationObserver` has been triggered, and
2. remove the `<details>` element in that task, then
3. the `<details>` element will never be in the DOM after the current macro task is completed and thus never in the DOM when the browser does its next layout calculation.  

```javascript
function toggleTick(cb) {
  const details = document.createElement("details");
  details.style.display = "none"; //just in case someone triggers layout via script
  details.ontoggle = cb();
  document.body.appendChild(details);
  //1. microtask1 adds the MutationObserver task which will queue toggle iff
  //   a. details.isConnected === true and
  //   b. details.open has changed
  details.open = true;     
  //2. microtask2 disconnects the details element *after* microtask1
  Promise.resolve().then(details.remove.bind(details));
}

toggleTick(function(){
  console.log("two");
});
console.log("one");
//one
//two
``` 

#### Benefits: 

1. The `<details>` element will *not* affect layout nor the rendered image. It is both added and removed from the DOM within the time frame of the current macro task, and therefore makes no changes to the DOM from one layout to the next.

2. When the `toggle` event is dispatched, it's composed path will *only* consist of the `<details>` element. This means that its *only* the `ontoggle` event listener that will be triggered. Thus, if another script had added a capture phase event listener for `toggle` (ie. a `window.addEventListener("toggle", anotherFunction, true)`), then that event listener would not be affected nor triggered.

#### A drawback:

The ToggleTickTrick is *almost completely* isolated and independent from the DOM and other running functions. But not 100%. While the microtasks are running, the `<details>` element still lingers in the DOM. If the function calling `toggelTick` is done in an early event listener in a *sync event propagation* cycle, then this `<details>` element will be visible in the DOM if other event listeners query the DOM.
 
Having an extra `<details>` element as an appendix to the body *only until the next macrotask* is not a big disturbance. But if another script does:
 * `document.querySelectorAll("details")` or 
 * expects the last element on the body element to be something else (`document.body.children[document.body.children.length - 1]`),
 
then this temporary ToggleTickTrick `<details>` element will be evident.
 
### Step 4: `task.cancel()` and `task.resume()`
  
`const taskId = setTimeout(...)` can be cancelled using a `clearTimeout(taskId)`. This is handy, and we want a similar, but better, interface to both cancel and resume `toggleTick` tasks. We accomplish this by returning a simple, unique object for each task that contains two methods: `cancel()` and `resume()`.

```javascript
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

const taskA = toggleTick(function(){
  console.log("two");
});
const taskB = toggleTick(function(){
  console.log("three");
});
taskA.cancel();
taskB.cancel();
taskB.resume();
console.log("one");
//one
//three
``` 

### Discussion: Why `<details>` and `toggle`?

There are a couple of reasons why the `<details>` element and `toggle` event is chosen:
1. The `<details>` element and `toggle` event is well and consistently supported in all relevant browsers.
2. The ToggleTickTrick has a minimal footprint. Little JS code is needed to load, import and/or cut'n'paste.
3. The ToggleTickTrick is efficient. The browser needs only to natively create a `<details>` element, populate it with some properties, and run a MutationObserver to get to the core task of queuing the callback in the event loop.
4. The ToggleTickTrick is simple. Once you understand how and when the `toggle` event is triggered, there is really not much to it.
5. The `<details>` element and `toggle` event is not much used. It will less likely cause confusion with other code in the app.

## Conclusion

the ToggleTickTrick has drawbacks. But, relative to other methods of accessing the "Normal DOM event macrotask queue", the ToggleTickTrick is efficient, fairly unobtrusive, and well supported across browsers. Therefore, we will default to the ToggleTickTrick as the base method for adding "normal" tasks to the event loop.

## References

  * dunno