# Pattern: ToggleRace 2

Some events have multiple possible cascading events. For example, a `mouseup` might either trigger a `click` and/or a `dblclick` or an `auxclick`. In such scenarios, we need to race more than one other event.

In later chapters we will look at the ability to place event listeners `first` in the event listener queue. If you provide such abilities, the EarlyBird event listeners in `toggleTick` should use it. 

## `toggleTick` race with two or more events

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

## `toggleTick` race using the `EventRoadMap`

Knowing which other events might lead to which other unpreventable events can be a tedious study. Therefore, we can automate the ability to race all other events by allowing   
 `toggleTick(cb, raceEvents=eventName)` to mean adding all the unpreventable cascade events for that `eventName` from the `EventRoadMap.UNPREVENTABLES`.

Here we use the `EventRoadMap.UNPREVENTABLES` map to enable developers to automatically queue `toggleTick` callbacks before any other racing events by only specifying the `raceEvents` attribute as a string, whose value is the name of the triggering event whose cascading events we wish to race.

In addition, we would like to reuse the `toggleTick` task to be more efficient. We therefore add a `reuse(newCb, raceEvents)` to our `toggleTick` task object. Although as efficient as it can be, to make and discard multiple `toggleTick` tasks would be inefficient. Thus, we need to make a mechanism to reuse a `toggleTick` task when necessary.

```javascript
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
```

### Demo: `toggleTick` race with multiple events and RoadMaps  

```html
<h1 tabindex="1">Hello sunshine!</h1>
<p tabindex="2">
  Click on the text and the header to see an event race.
  If you slow click, the event races are easier to dissect.
  Begin by right-click (reload if you want).
</p>

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

  window.addEventListener("contextmenu", e => e.preventDefault());

  window.addEventListener("mouseup", e => console.log(e.type));
  window.addEventListener("click", e => console.log(e.type));
  window.addEventListener("auxclick", e => console.log(e.type));
  document.addEventListener("contextmenu", e => console.log(e.type));
  document.addEventListener("focusin", e => console.log(e.type));
  document.addEventListener("focus", e => console.log(e.type), true);
  document.addEventListener("focusout", e => console.log(e.type));
  document.addEventListener("blur", e => console.log(e.type), true);

  window.addEventListener("mouseup", function (e) {
    toggleTick(() => console.log("mouseup toggleTick: race roadmap events (ie. click and auxclick)"), e.type);
  });
  window.addEventListener("mouseup", function () {
    toggleTick(() => console.log("mouseup toggleTick: race no events"));
  });
  window.addEventListener("mousedown", function (e) {
    toggleTick(() => console.log("mousedown toggleTick: race no events"));
  });
  window.addEventListener("mousedown", function () {
    toggleTick(() => console.log("mousedown toggleTick: race [contextmenu, focusout]"), ["contextmenu", "focusout"]);
  });
</script>
```

In the demo above, we see the following results:
 
1. Press down with the **right** mouse button on "hello sunshine!". The `toggleTick` on `mousedown` wins the race against `contextmenu` event and is printed before it.

   ```
   //1. right mousedown on "hello sunshine"
   focus
   focusin
   mousedown toggleTick: race [contextmenu, focusout]
   contextmenu
   mousedown toggleTick: race no events
   ```        

2. Release the right mouse button over "hello sunshine". The `toggleTick` on `mouseup` wins the race against the `auxclick` event and is printed before it.

   ```
   //2. right mouseup on "hello sunshine"
   mouseup
   mouseup toggleTick: race roadmap events (ie. click and auxclick)
   auxclick
   mouseup toggleTick: race no events
   ```        

3. Press down with the **right** mouse button on text on the page. The `toggleTick` on `mousedown` wins the race against `focusout` event and is printed before it. `contextmenu` is now later in the event cascade as both `focusout` and `blur` are run ahead of it.

   ```
   //3. left mousedown on the text paragraph
   blur
   mousedown toggleTick: race [contextmenu, focusout]
   focusout
   focus
   focusin
   contextmenu
   mousedown toggleTick: race no events
   ```        

4. Press and then release the **left** mouse button on the header. This time, the `toggleTick` on `mouseup` wins the race against `click` event, not the `auxclick` event.

   ```
   //2. left mouseup over "hello sunshine"
   mouseup
   mouseup toggleTick: race roadmap events (ie. click and auxclick)
   click
   mouseup toggleTick: race no events
   ```        
 
## References

 * dunno
