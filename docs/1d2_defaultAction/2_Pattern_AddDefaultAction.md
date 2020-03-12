# Pattern: AddDefaultAction

How to add our own default actions to an event or type of events? 

Default actions are best controlled from event instances and not per event type universal to all event instances. This is due to the fact that different, `preventable` default actions might compete with each other for the same trigger event, and in order to solve these conflicts we need to organize the default actions to each events propagation path. This require us working against each individual event object. More on this shortly.
  
To add a default action to an event we need to extend the `Event` interface with an `.addDefaultAction(...)` method. This method needs two arguments: `cb` and `raceEvents`.

## Implementation: `event.addDefaultAction(cb, raceEvent)`

The `.addDefaultAction(...)` method heavily relies on the `toggleTick` method described in detail in a preceding chapter.

1. **`cb`**: `function`. `event.addDefaultAction(...)` runs the `cb` function after the event cascade of the `event` has been completed.
2. **`raceEvents`**: `true`, `undefined`, `eventName`, or `[event1, event2, ...]`. 
   * If `raceEvents` is `true`, then the default action function (`cb`) will run immediately after the `event` has finished its propagation.
   * If `raceEvents` is `undefined`, then the default action function (`cb`) will run after the `event` has finished its propagation *and* after all the `event`'s `EventRoadMap.UNPREVENTABLES` events have finished their propagation.
   * If `raceEvents` is an `eventName` string, then then the default action function (`cb`) will run after the `event` has finished its propagation, but before any of the `eventName`'s `EventRoadMap.UNPREVENTABLES` events have begun their propagation.
   * If `raceEvents` is a list of `eventName`s, then then the default action function (`cb`) will run after the `event` has finished its propagation, but before any of the events listed in the list of `eventNames`.

```javascript
//requires the toggleTick function
Object.defineProperty(Event.prototype, "addDefaultAction", {
  value: function (cb, raceEvents) {
    if (raceEvents === true)
      raceEvents = this.type;
    toggleTick(() => cb(this), raceEvents);
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
      if (raceEvents === true)
        raceEvents = this.type;
      toggleTick(() => cb(this), raceEvents);
    },
    writable: false
  });
</script>

<div id="one">click.addDefaultAction((trigger)=> console.log("action ONE triggered by ", trigger.type));</div>
<div id="two">click.addDefaultAction((trigger)=> console.log("action TWO triggered by ", trigger.type));</div>

<script>
  window.addEventListener("click", e => console.log(e.type));
  window.addEventListener("dblclick", e => console.log(e.type));
  const one = document.querySelector("#one");
  const two = document.querySelector("#two");
  one.addEventListener("click", e => e.addDefaultAction((trigger) => console.log("action ONE triggered by ", trigger.type)));
  two.addEventListener("click", e => e.addDefaultAction((trigger) => console.log("action TWO triggered by ", trigger.type), ["dblclick"]));
</script>
```