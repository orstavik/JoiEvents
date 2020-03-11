# Pattern: AddDefaultAction

In this chapter we will extend the `Event` interface with an `.addDefaultAction(...)` method with the following API:

1. `event.addDefaultAction(cb)` will run the function `cb` after the event cascade of `event` has been completed. The `event.addDefaultAction(cb)` does not cancel the browsers native default actions for the same event, as this can be controlled from the `preventDefault()` method. The function will not be added/cancelled if `.preventDefault()` has already been/is later called on the event. 
2. `event.addDefaultAction(cb, raceEvents)` will run `cb` only once either immediately before the subsequent raceEvents or as soon as the event cascade for the event is completed.
todo add the `true` argument to mean the name of the trigger event.

## `.addDefaultAction(cb, raceEvents)` 

1. The `cb` is a function that will be added as the new default action for the event. We pass the trigger `event` as the first argument to this method. 
2. If `raceEvents` is not specified, the new default action is queued as a `toggleTick()` task. If `raceEvents` is given as either an array of event names, or as a string event name, the `toggleTick` task will race the list of given event names, or all the unpreventable given event names for the given event name, cf. `toggleTick` raceEvents.

```javascript
//requires the toggleTick function
Object.defineProperty(Event.prototype, "addDefaultAction", {
  value: function (cb, raceEvents) {
    const self = this;
    toggleTick(() => cb(self), raceEvents);
  },
  writable: false
});
``` 

## Demo: 

```html
<script>
  const EventRoadMap = {
    UNPREVENTABLES: {
      mousedown: ["contextmenu", "focusin", "focus", "focusout", "blur"],
      mouseup: ["click", "auxclick", "dblclick"],
      click: ["dblclick"],
      keydown: ["keypress"]
    }
  };

  function parseRaceEvents(raceEvents) {
    if (raceEvents instanceof Array)
      return raceEvents;
    if (raceEvents === undefined)
      return [];
    if (raceEvents instanceof String || typeof (raceEvents) === "string")
      return EventRoadMap.UNPREVENTABLES[raceEvents];
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
        for (let raceEvent of internals.events || [])
          window.removeEventListener(raceEvent, wrapper, true);
        details.ontoggle = undefined;
      },
      reuse: function (newCb, raceEvents) {
        raceEvents = parseRaceEvents(raceEvents);
        internals.cb = newCb;
        for (let raceEvent of internals.events || [])
          window.removeEventListener(raceEvent, wrapper, true);
        internals.events = raceEvents;
        for (let raceEvent of internals.events || [])
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
    for (let raceEvent of internals.events || [])
      window.addEventListener(raceEvent, wrapper, {capture: true});
    return task;
  }

  //requires the toggleTick function
  Object.defineProperty(Event.prototype, "addDefaultAction", {
    value: function (cb, raceEvents) {
      const self = this;
      toggleTick(() => cb(self), raceEvents);
    },
    writable: false
  });
</script>

<div id="one">click.addDefaultAction(()=> console.log("one"));</div>
<div id="five">click.addDefaultAction(()=> console.log("five"), ["dblclick"]);</div>

<script>
  window.addEventListener("click", e => console.log(e.type));
  window.addEventListener("dblclick", e => console.log(e.type));
  const one = document.querySelector("#one");
  const five = document.querySelector("#five");
  one.addEventListener("click", e => e.addDefaultAction(() => console.log("one")));
  five.addEventListener("click", e => e.addDefaultAction(() => console.log("five"), ["dblclick"]));
</script>
```