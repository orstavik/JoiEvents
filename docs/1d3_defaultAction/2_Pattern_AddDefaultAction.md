# Pattern: AddDefaultAction

## Custom implementation of default actions 

In JS, we do not have access to a `postPropagationCallback`. To ensure that we run a function after an event has finished propagating (ie. so that it is not torpedoed by `stopPropagation()`), we must add it as a new task in the event loop. And to do that, we must evaluate the event to identify any default actions *and* queue the default action task in the event loop *up front*, and stop some of these default actions from being run if `.preventDefault()` has been called on the event during propagation. 
   
```
     ↱------------ queue  ------↴        ↱------------ queue  ------↴
     ↑                          ↓        ↑                          ↓
     ↑     prop(eventA)       actionA => ↑     prop(eventB)       actionB
     ↑        ↓    ↑                     ↑        ↓    ↑
  DefaultAction    bub                DefaultAction    bub
              ↓    ↑                              ↓    ↑
            cap    bub                          cap    bub
              ↳tar ⮥                              ↳tar ⮥
```

## 

> todo remove raceEvent and always use the event type name, because the default action proper should always race all other events.
>todo remove the default actions that are event controllers, and put this in the event controller chapter.

How to add our own default actions to an event or type of events? 

Default actions are best controlled from event instances and not per event type universal to all event instances. This is due to the fact that different, `preventable` default actions might compete with each other for the same trigger event, and in order to solve these conflicts we need to organize the default actions to each events propagation path. This require us working against each individual event object. More on this shortly.
  
To add a default action to an event we need to extend the `Event` interface with an `.addDefaultAction(...)` method. This method needs two arguments: `cb` and `options`.

## Implementation: `event.addDefaultAction(cb, options)`

The `.addDefaultAction(...)` method heavily relies on the `toggleTick` method described in detail in a preceding chapter.

1. **`cb`**: `function`. `event.addDefaultAction(...)` runs the `cb` function after the event cascade of the `event` has been completed.
   * The `cb` function is passed the trigger `event` object that has completed its propagation as its first argument. 
2. **`options`**: `{raceEvents}`. 
   * **`raceEvents`**:
      * `true`: the default action function (`cb`) runs immediately after the `event` has finished its propagation, but **before** any of the `event`'s `unpreventable` events have begun their propagation.
      * `undefined`: the default action function (`cb`) runs after the `event` has finished its propagation *and* after all the `event`'s `EventRoadMap.UNPREVENTABLES` events have finished their propagation.
      * `[eventNames]`: the default action function (`cb`) runs after the `event` has finished its propagation, but **before** any of the events listed in the `[eventNames]` array.
      * `eventName` string: the default action function (`cb`) runs after the `event` has finished its propagation, but before any of the `eventName`'s `EventRoadMap.UNPREVENTABLES` events have begun their propagation. You should likely use `true` instead of `eventName` here.

> We assume that normal use of `addDefaultAction()` would not be to specify `raceEvents`. But, if your use-case require or benefit from your default action coming ahead of for example `focus` or `dblclick` event, then the `addDefaultAction()` has the facilities to help you out.
      
The return value is the `toggleTick` task object that can for example be cancelled.

```javascript
//requires the toggleTick function
Object.defineProperty(Event.prototype, "addDefaultAction", {
  value: function (cb, options) {
    let raceEvents = options ? options.raceEvents : undefined;
    if (raceEvents === true)
      raceEvents = this.type;
    return toggleTick(() => cb(this), raceEvents);
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
        for (let raceEvent of internals.events)
          window.removeEventListener(raceEvent, wrapper, true);
        details.ontoggle = undefined;
      },
      reuse: function (newCb, raceEvents) {
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

  //requires the toggleTick function
  Object.defineProperty(Event.prototype, "addDefaultAction", {
    value: function (cb, options) {
      let raceEvents = options ? options.raceEvents : undefined;
      if (raceEvents === true)
        raceEvents = this.type;
      return toggleTick(() => cb(this), raceEvents);
    },
    writable: false
  });
</script>

<div id="one">click.addDefaultAction(trigger => console.log("action ONE triggered by ", trigger.type));</div>
<div id="two">click.addDefaultAction(trigger => console.log("action TWO triggered by ", trigger.type), {raceEvents: ["dblclick"]});</div>

<script>
  window.addEventListener("click", e => console.log(e.type));
  window.addEventListener("dblclick", e => console.log(e.type));
  const one = document.querySelector("#one");
  const two = document.querySelector("#two");
  one.addEventListener("click", e => e.addDefaultAction(trigger => console.log("action ONE triggered by ", trigger.type)));
  two.addEventListener("click", e => e.addDefaultAction(trigger => console.log("action TWO triggered by ", trigger.type), {raceEvents: ["dblclick"]}));
</script>
```