# Pattern: ToggleRace 1

The `toggleTick` task is not always the fastest event in the event loop. For example, if you queue a `toggleTick` task from a `mouseup` event, then this task will be queued after both the `click` and `dblclick` events. So, is there a way to queue a `toggleTick` task *before* `click` and `dblclick`?

## Event racing: part 1

To get a single task to run first in one of many places, we:
1. queue the task to run in all places, and then
2. from the first task run cancel all the others. 

We use this strategy to push a `toggleTick` up the event loop stack.
1. we wrap the cb task in a function that will also cancel the other tasks waiting once it is run,
2. and then we add this wrapped task in both our normal `toggleTick` *and* in an event listener for the other event we wish to precede. 

```javascript
function toggleTick(cb, raceEvent) {
  // 1. make the details element for future reference.
  const details = document.createElement("details");
  details.style.display = "none";
  //2. make the task with the wrapped callback ._cb and a cancel method that will clear both event listener and the toggleTask
  const task = {
    _cb: function(){
      task.cancel();
      cb();
    },
    cancel: function () {
      window.removeEventListener(raceEvent, task._cb, true);
      details.ontoggle = undefined;
    }
  };
  //3. register the wrapped task in the toggleTick callback
  details.ontoggle = task._cb;
  document.body.appendChild(details);
  details.open = true;
  Promise.resolve().then(details.remove.bind(details));
  //4. and register it for the raceEvent
  window.addEventListener(raceEvent, task._cb, {capture: true});
  return task;
}
```

### Demo: Race against click or dblclick  

```html
<script>
  function toggleTick(cb, raceEvent) {
    const details = document.createElement("details");
    details.style.display = "none";

    const task = {
      cb: function(){
        task.cancel();
        cb();
      },
      cancel: function () {
        window.removeEventListener(raceEvent, task.cb, true);
        details.ontoggle = undefined;
      }
    };

    details.ontoggle = task.cb;
    document.body.appendChild(details);
    details.open = true;
    Promise.resolve().then(details.remove.bind(details));
    window.addEventListener(raceEvent, task.cb, {capture: true});

    return task;
  }

  window.addEventListener("mouseup", e=> console.log(e.type));
  window.addEventListener("click", e=> console.log(e.type));
  window.addEventListener("dblclick", e=> console.log(e.type));

  window.addEventListener("mouseup", function () {
    toggleTick(()=> console.log("toggleTick task from mouseup that race click"), "click");
  });
  window.addEventListener("mouseup", function () {
    toggleTick(()=> console.log("toggleTick task from mouseup that race dblclick"), "dblclick");
  });
</script>
```

In the demo above we see two different toggleTasks being added when the `mouseup` event occurs:
1. race against `click`
2. race against `dblclick`

```
//1. click
mouseup
toggleTick task from mouseup that race click
click
toggleTick task from mouseup that race dblclick
//2. click
mouseup
toggleTick task from mouseup that race click
click
toggleTick task from mouseup that race dblclick
dblclick
```                

If you `dblclick` on they page, the demo will print the below result for the first click:
1. the mouse up event occurs.
2. the race event listener for `click` is triggered for the first toggleTask. This is added as an EarlyBird event listener, so it runs at the very beginning of the event propagation of `click`. This task also removes the toggleTask it was racing against.
3. the `click` event propagates.
4. the toggleTick task that raced against the `dblclick` event runs, as no `dblclick` event is dispatched before the queue position of the `toggleTick` task is reached. This `toggleTick` task also removes the event listener for `dblclick`.

For the second `click`, this happens:
1. the mouse up event occurs.
2. the race event listener for `click` is triggered for the first toggleTask. This is added as an EarlyBird event listener, so it runs at the very beginning of the event propagation of `click`. This task also removes the toggleTask it was racing against.
3. the `click` event propagates.
4. the race event listener for `dblclick` is triggered for the second toggleTask. This is added as an EarlyBird event listener, so it runs at the very beginning of the event propagation of `dblclick`. This task also removes the toggleTask it was racing against.
5. the `dblclick` event propagates.
 
## References

 * dunno
