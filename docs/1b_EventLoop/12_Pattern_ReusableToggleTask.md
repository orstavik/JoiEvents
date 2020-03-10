# Pattern: ReusableToggleTask

Although as efficient as it can be, to make and discard multiple `toggleTick` tasks would be inefficient. Thus, we need to make a mechanism to reuse a `toggleTick` task when necessary.

todo add a text explanation of the function below

```javascript
function toggleTick(cb, raceEvents) {
  const details = document.createElement("details");
  details.style.display = "none";
  const internals = {
    events: raceEvents,
    cb: cb
  };
  function wrapper() {
    task.cancel();
    internals.cb();
  }
  const task = {
    cancel: function () {
      for (let raceEvent of internals.events)
        window.removeEventListener(raceEvent, wrapper, true);
      details.ontoggle = undefined;
    },
    reuse: function (newCb, raceEvents) {
      internals.cb = newCb;
      for (let raceEvent of internals.events)
        window.removeEventListener(raceEvent, wrapper, true);
      internals.events = raceEvents;
      for (let raceEvent of internals.events)
        window.addEventListener(raceEvent, wrapper, {capture: true});
    },
    isActive: function () {
      return !!details.ontoggle;
    }
  };
  details.ontoggle = wrapper;
  document.body.appendChild(details);
  details.open = true;
  Promise.resolve().then(details.remove.bind(details));
  for (let raceEvent of internals.events)
    window.addEventListener(raceEvent, wrapper, {capture: true});
  return task;
}
```

### Demo: Reuse `toggleTick` task  

```html
<script>
  function toggleTick(cb, raceEvents) {
    const details = document.createElement("details");
    details.style.display = "none";

    const internals = {
      events: raceEvents,
      cb: cb
    };
    function wrapper() {
      task.cancel();
      internals.cb();
    }
    const task = {
      cancel: function () {
        for (let raceEvent of internals.events)
          window.removeEventListener(raceEvent, wrapper, true);
        details.ontoggle = undefined;
      },
      reuse: function (newCb, raceEvents) {
        internals.cb = newCb;
        for (let raceEvent of internals.events)
          window.removeEventListener(raceEvent, wrapper, true);
        internals.events = raceEvents;
        for (let raceEvent of internals.events)
          window.addEventListener(raceEvent, wrapper, {capture: true});
      },
      isActive: function () {
        return !!details.ontoggle;
      }
    };

    details.ontoggle = wrapper;
    document.body.appendChild(details);
    details.open = true;
    Promise.resolve().then(details.remove.bind(details));
    for (let raceEvent of internals.events)
      window.addEventListener(raceEvent, wrapper, {capture: true});

    return task;
  }

  window.addEventListener("mouseup", e => console.log(e.type));
  window.addEventListener("click", e => console.log(e.type));
  window.addEventListener("dblclick", e => console.log(e.type));

  let toggleTask;
  document.addEventListener("mouseup", function () {
    toggleTask = toggleTick(() => console.log("toggleTick task from mouseup that race click"), ["click"]);
  });
  window.addEventListener("mouseup", function () {
    toggleTask.reuse(() => console.log("toggleTick task from mouseup that race dblclick"), ["dblclick"]);
  });
</script>
```

In the demo above, we see the toggleTask racing with the `click` and `dblclick` event.

```
//1. first click
mouseup
click
toggleTick task from mouseup that race dblclick
//2. second click
mouseup
click
toggleTick task from mouseup that race dblclick
dblclick
```        
 
## References

 * dunno
