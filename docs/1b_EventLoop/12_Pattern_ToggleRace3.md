# Pattern: ToggleRace 3

The final chapter on `toggleTick` is the ability to flush the task, ie. run it before it was originally set up.

## `toggleTick.flush()`

```javascript
const EventRoadMap = {
  UNPREVENTABLES: {
    mousedown: ["contextmenu", "focusin", "focus", "focusout", "blur"],
    mouseup: ["click", "auxclick", "dblclick"],
    click: ["dblclick"],
    keydown: ["keypress"],
    focusout: ["change"],
  }
};

function parseRaceEvents(raceEvents) {
  if (raceEvents instanceof Array)
    return raceEvents;
  if (raceEvents === undefined)
    return [];
  if (raceEvents instanceof String || typeof (raceEvents) === "string")
    return EventRoadMap.UNPREVENTABLES[raceEvents] || [];
  throw new Error(
    "The raceEvent argument in toggleTick(cb, raceEvents) must be undefined, " +
    "an array of event names, empty array, or a string with an event name " +
    "for the trigger event in the event cascade.");
}

function toggleTick(cb, raceEvents) {
  raceEvents = parseRaceEvents(raceEvents);
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
      if (details.ontoggle === undefined)
        throw new Error("toggleTick has already run. Cannot reuse a toggleTick after it has run.");
      raceEvents = parseRaceEvents(raceEvents);
      internals.cb = newCb;
      for (let raceEvent of internals.events)
        window.removeEventListener(raceEvent, wrapper, true);
      internals.events = raceEvents;
      for (let raceEvent of internals.events)
        window.addEventListener(raceEvent, wrapper, {capture: true});
    },
    isActive: function () {
      return !!details.ontoggle;
    },
    flush: function () {
      return wrapper();
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

## Demo: `toggleTick.flush()`  

todo. untested. pseudo-code only.

```html
<script src="toggleTick.js"></script>

<h1 tabindex="1">Hello sunshine!</h1>

<script>
  window.addEventListener("mouseup", e => console.log(e.type));
  window.addEventListener("click", e => console.log(e.type));

  document.addEventListener("mouseup", function () {
    toggleTask = toggleTick(() => console.log("toggleTick task from mouseup that race click"), ["click"]);
  });
  window.addEventListener("mouseup", function () {
    toggleTask.flush();
  });
</script>
```
 
## References

 * dunno
