# Pattern: EventRoadMap

An event cascade is a series of events and actions that trigger each other with a domino-effect. When one event occurs another might or must follow. Such "chain of events" are very important to us when we try to eek out the most efficient and simple and safe `toggleTick` function possible (today).

In this chapter we simply make a JS map of these events with the key being the trigger event. We need three different maps:
1. `EventRoadMap.ALL`: all the different possible paths that an event might trigger,
2. `EventRoadMap.UNPREVENTABLES`: all the different possible paths that an event might trigger that cannot be stopped using `.preventDefault()`, and
3. `EventRoadMap.UNPREVENTABLES_FIRST_ONLY`: all the different possible paths that an event might trigger that cannot be stopped using `.preventDefault()` that are not always preceded by another event in the same list.    

In later chapters we will dive deeper into event cascades.  

## Different roadmaps for different purposes

```javascript
const EventRoadMap = {}; 
EventRoadMap.ALL={
  mousedown: ["contextmenu"],
  mouseup: ["click", "auxclick"],
  click: ["dblclick", "submit", "reset"],
  wheel: ["scroll"],
  keydown: ["keypress"],
  keypress: ["beforeinput"]
};
EventRoadMap.UNPREVENTABLES = { 
  mouseup: ["click", "auxclick", "dblclick"],
  click: ["dblclick"],
  keydown: ["keypress"]
};
EventRoadMap.UNPREVENTABLES_FIRST_ONLY = Object.assign({}, EventRoadMap.UNPREVENTABLES, { 
  mouseup: ["click", "auxclick"]
});
```

## `toggleTick(cb, raceEvents=true)`

Here we use the `EventRoadMap.UNPREVENTABLES_FIRST_ONLY` map to enable developers to automatically queue `toggleTick` callbacks before any other racing events by only specifying the `raceEvents` attribute as a string, whose value is the name of the triggering event whose cascading events we wish to race.

```javascript
const EventRoadMap = {};
EventRoadMap.UNPREVENTABLES = {
  mouseup: ["click", "auxclick", "dblclick"],
  click: ["dblclick"],
  keydown: ["keypress"]
};
EventRoadMap.UNPREVENTABLES_FIRST_ONLY = Object.assign({}, EventRoadMap.UNPREVENTABLES, {
  mouseup: ["click", "auxclick"]
});

function parseRaceEvents(raceEvents){
  if(raceEvents instanceof Array)
    return raceEvents;
  if(raceEvents === undefined)
    return [];
  if (raceEvents instanceof String || typeof(raceEvents) === "string")
    return EventRoadMap.UNPREVENTABLES_FIRST_ONLY[raceEvents];
  throw new Error("The raceEvent argument in toggleTick(cb, raceEvents) must be undefined, an array of event names, empty array, or a string with an event name for the trigger event in the event cascade.");
}

function toggleTick(cb, raceEvents) {
  raceEvents =parseRaceEvents(raceEvents);
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
      raceEvents =parseRaceEvents(raceEvents);
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

### Demo: RoadMap Race against click AND auxclick  

```html
<script>
  const EventRoadMap = {};
  EventRoadMap.UNPREVENTABLES = {
    mouseup: ["click", "auxclick", "dblclick"],
    click: ["dblclick"],
    keydown: ["keypress"]
  };
  EventRoadMap.UNPREVENTABLES_FIRST_ONLY = Object.assign({}, EventRoadMap.UNPREVENTABLES, {
    mouseup: ["click", "auxclick"]
  });

  function parseRaceEvents(raceEvents){
    if(raceEvents instanceof Array)
      return raceEvents;
    if(raceEvents === undefined)
      return [];
    if (raceEvents instanceof String || typeof(raceEvents) === "string")
      return EventRoadMap.UNPREVENTABLES_FIRST_ONLY[raceEvents];
    throw new Error("The raceEvent argument in toggleTick(cb, raceEvents) must be undefined, an array of event names, empty array, or a string with an event name for the trigger event in the event cascade.");
  }

  function toggleTick(cb, raceEvents) {
    raceEvents =parseRaceEvents(raceEvents);
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
        raceEvents =parseRaceEvents(raceEvents);
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
  
  window.addEventListener("contextmenu", e => e.preventDefault());

  window.addEventListener("mouseup", e => console.log(e.type));
  window.addEventListener("click", e => console.log(e.type));
  window.addEventListener("auxclick", e => console.log(e.type));

  window.addEventListener("mouseup", function (e) {
    toggleTick(() => console.log("toggleTick task from mouseup that race click, auxclick"), e.type);
  });
  window.addEventListener("mouseup", function (e) {
    toggleTick(() => console.log("toggleTick task from mouseup that do not race other events"));
  });
</script>
```

In the demo above, we see the `toggleTick` both winning and loosing races to the `click` and the `auxclick` events.

```
//1. left click
mouseup
toggleTick task from mouseup that race click, auxclick
click
toggleTick task from mouseup that do not race other events
//2. right click
mouseup
toggleTick task from mouseup that race click, auxclick
auxclick
toggleTick task from mouseup that do not race other events
```        
 
## References

 * dunno
