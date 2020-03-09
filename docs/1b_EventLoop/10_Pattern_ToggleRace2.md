# Pattern: ToggleRace 2

Sometimes, it is not clear which events you need to race from an event. In such scenarios, we need to race more than one other event.

## Event racing with three or more horses

The strategy for racing more than one event from a `toggleTick` is more or less the same as racing one event. The only difference is that we need to add and remove multiple event listeners.

```javascript
function toggleTick(cb, raceEvents) {
  const details = document.createElement("details");
  details.style.display = "none";
  const task = {
    cb: function(){
      task.cancel();
      cb();
    },
    cancel: function () {
      // * cancelling all other event listeners.
      for (let raceEvent of raceEvents)
        window.removeEventListener(raceEvent, task.cb, true);
      details.ontoggle = undefined;
    }
  };
  details.ontoggle = task.cb;
  document.body.appendChild(details);
  details.open = true;
  Promise.resolve().then(details.remove.bind(details));
  // * adding all other event listeners.
  for (let raceEvent of raceEvents)
    window.addEventListener(raceEvent, task.cb, {capture: true});
  return task;
}
```

### Demo: Race against click AND auxclick  

```html
<script>
  function toggleTick(cb, raceEvents) {
    const details = document.createElement("details");
    details.style.display = "none";

    const task = {
      cb: function(){
        task.cancel();
        cb();
      },
      cancel: function () {
        for (let raceEvent of raceEvents)
          window.removeEventListener(raceEvent, task.cb, true);
        details.ontoggle = undefined;
      }
    };

    details.ontoggle = task.cb;
    document.body.appendChild(details);
    details.open = true;
    Promise.resolve().then(details.remove.bind(details));
    for (let raceEvent of raceEvents)
      window.addEventListener(raceEvent, task.cb, {capture: true});

    return task;
  }

  window.addEventListener("contextmenu", e=> e.preventDefault());

  window.addEventListener("mouseup", e=> console.log(e.type));
  window.addEventListener("click", e=> console.log(e.type));
  window.addEventListener("auxclick", e=> console.log(e.type));

  window.addEventListener("mouseup", function () {
    toggleTick(()=> console.log("toggleTick task from mouseup that race both click and auxclick"), ["click", "auxclick"]);
  });
</script>
```

In the demo above, we see the toggleTask racing with both the `click` and the `auxclick` event.

```
//1. left click
mouseup
toggleTick task from mouseup that race both click and auxclick
click
//2. right click
mouseup
toggleTick task from mouseup that race both click and auxclick
auxclick
```        
 
## References

 * dunno
