# Pattern: ToggleTickTrick

The first pattern we will look at is a method for adding task/callback in the event loop's "normal DOM Event macrotask queue". Ie. a method for adding a task with the same priority as a normal DOM Event. We call this method the ToggleTickTrick.

## Implementation: ToggleTickTrick

The ToggleTickTrick uses the `<details>` element to trigger and queue a `toggle` event in the event loop's "normal DOM Event macrotask queue" that it in turns adds an event listener too that in turn performs the needed task.

```javascript 
function toggleTick(cb) {
  const details = document.createElement("details");
  details.style.display = "none";
  details.ontoggle = function () {
    details.remove();
    cb();
  };
  document.body.appendChild(details);
  details.open = true;
}

toggleTick(function(){
  console.log("This is a task queued and then executed from the Normal DOM event macro task queue in the event loop.");
})
``` 

### Why `<details>` and `toggle`?

There are several reasons why the `<details>` element and `toggle` event is chosen:
1. The ToggleTickTrick is very simple to implement from JS. The code for creating the `<details>` element, triggering the `toggle` event, executing the task, and cleaning up is both minimal and simple.
2. The `<details>` element and `toggle` event is well supported and consistently handled across browsers (relatively speaking).
3. The `<details>` element and `toggle` event is not much used. It will less likely cause confusion with other code in the app.
4. The `toggle` event is non-bubbling. That means that there is a slightly smaller chance that it will interfere with other event listeners than other events that bubble.

### Drawbacks: the BlindManDOM

Constructing a `<details>` element, creating a custom callback function, setting three properties (`style`, `ontoggle`, and `open`), adding and removing the `<details>` element in the DOM, and executing the task from within the custom callback are all operations that needs to be performed to queue a `toggleTick` task. This adds a small burden to the app.

In addition, the ToggleTickTrick uses the [BlindManDOM pattern](todo add link) to add an element to the `document.body` that will remain in the DOM until the task is executed. This element is not pretty, it is actually a little bit dirty, as it doesn't really serve any purpose in the DOM, its just a temporary hack to get the `ontoggle` callback to be executed. It likely *will* confuse some developers using the trick, and the `toggle` event *can* cause conflicts if the app has added other event listeners for `toggle` in the `capture` phase on either the `window`, `document`, or `<body>` elements.  

## ToggleTickTrick API: `setEventQueue(task)` and `clearEventQueue(task)`

As with `setTimeout(task, 0)`, there are many use-cases where you need to cancel a queued task. To support this, the ToggleTickTrick needs to implement two methods `setEventQueue(task)` and `clearEventQueue(task)` that echo `setTimeout`and `clearTimeout`.

```javascript
function setToggleTick(cb) {
  const details = document.createElement("details");
  details.style.display = "none";
  details.ontoggle = function () {
    details.remove();
    cb();
  };
  document.body.appendChild(details);
  details.open = true;
  return details;
}

function clearToggleTick(key) {
  key.ontoggle = undefined;
  key.remove();
}

const task1 = setToggleTick(function(){
  console.log("task 1");
});
const task2 = setToggleTick(function(){
  console.log("task 2");
});
clearToggleTick(task1);
//prints: task 2
```

## Conclusion

the ToggleTickTrick has drawbacks. But, relative to other methods of accessing the "Normal DOM event macrotask queue", the ToggleTickTrick is efficient, fairly unobtrusive, and well supported across browsers. Therefore, we will default to the ToggleTickTrick as the base method for adding "normal" tasks to the event loop.

## References

  * dunno