# Pattern: ToggleRace 1

The `toggleTick` task is not always the fastest event in the event loop. For example, if you queue a `toggleTick` task from a `mouseup` event, then this task will be queued after both the `click` and `dblclick` events. So, is there a way to queue a `toggleTick` task *before* `click` and `dblclick`?

## Event racing: part 1

To get a single task to run first in one of two places, we:
1. queue the task to run in both places, and then
2. from the first task to run cancel the other. 

In the case of `toggleTick` racing a different event, we add *both* a `toggleTick` callback *and* an `addEventListener` for the racing event, and we have them both cancel the other function, whichever runs first. To achieve this effect, we must wrap the callback task in a wrapper function that will cancel both the `toggleTask` and `removeEventListener` first, and then call the callback function. 

```javascript
function toggleTick(cb, raceEvent) {
  const details = document.createElement("details");
  details.style.display = "none";
  const wrapper = function(){
    task.cancel();
    cb();
  };
  const task = {
    cancel: function () {
      raceEvent && window.removeEventListener(raceEvent, wrapper, true);
      details.ontoggle = undefined;
    }
  };
  details.ontoggle = wrapper;
  document.body.appendChild(details);
  details.open = true;
  Promise.resolve().then(details.remove.bind(details));
  raceEvent && window.addEventListener(raceEvent, wrapper, {capture: true});
  return task;
}
```

### Demo: Race against click or dblclick  

```html
<h1>double click on me</h1>
<script>
  function toggleTick(cb, raceEvent) {
    const details = document.createElement("details");
    details.style.display = "none";

    const wrapper = function(){
      task.cancel();
      cb();
    };
    const task = {
      cancel: function () {
        raceEvent && window.removeEventListener(raceEvent, wrapper, true);
        details.ontoggle = undefined;
      }
    };

    details.ontoggle = wrapper;
    document.body.appendChild(details);
    details.open = true;
    Promise.resolve().then(details.remove.bind(details));
    raceEvent && window.addEventListener(raceEvent, wrapper, {capture: true});

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
  window.addEventListener("mouseup", function () {
    toggleTick(()=> console.log("toggleTick task from mouseup that race no events"));
  });
</script>
```

In the demo above we see two different toggleTasks being added when the `mouseup` event occurs:
1. race against `click`
2. race against `dblclick`
3. race against no other events.

```
//1. click
mouseup
toggleTick task from mouseup that race click
click
toggleTick task from mouseup that race dblclick
toggleTick task from mouseup that race no events
//2. click
mouseup
toggleTick task from mouseup that race click
click
toggleTick task from mouseup that race dblclick
dblclick
toggleTick task from mouseup that race no events
```                

If you `dblclick` on they page, the demo will print the below result for the first click:
1. the mouse up event occurs.
2. the race event listener for `click` is triggered for the first toggleTask. This is added as an EarlyBird event listener, so it runs at the very beginning of the event propagation of `click`. This task also removes the toggleTask it was racing against.
3. the `click` event propagates.
4. the toggleTick task that raced against the `dblclick` event runs, as no `dblclick` event is dispatched before the queue position of the `toggleTick` task is reached. This `toggleTick` task also removes the event listener for `dblclick`.
5. the toggleTick task that raced against no other event runs.

For the second `click`, this happens:
1. the mouse up event occurs.
2. the race event listener for `click` is triggered for the first toggleTask. This is added as an EarlyBird event listener, so it runs at the very beginning of the event propagation of `click`. This task also removes the toggleTask it was racing against.
3. the `click` event propagates.
4. the race event listener for `dblclick` is triggered for the second toggleTask. This is added as an EarlyBird event listener, so it runs at the very beginning of the event propagation of `dblclick`. This task also removes the toggleTask it was racing against.
5. the `dblclick` event propagates.
6. the toggleTick task that raced against no other event runs.

## Using `task.cancel()()` to flush the task

The `.cancel()` method returns the callback function that will no longer run. This means that the `cancel()` method can be used to *flush* the task if a script needs to force it to run before its scheduled time. There are two ways to accomplish this, the very short'n'snappy 

```
task.cancel()()
```
or the null-safe alternative: 
```
let cb = task.cancel();
if (cb) cb();
```  
 
## References

 * dunno
