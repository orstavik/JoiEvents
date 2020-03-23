# Pattern: AddPreventableAction

Default actions can be prevented by calling `.preventDefault()`. In this chapter, we extend the `addDefaultAction(...)` method to enable the added default action to be blocked by calling  `preventDefault()` on its triggering event.
 
The default is to make `preventDefault()` block added default actions. Thus, we add a second option: `unpreventable` that defaults to `false`, to the `options` parameter.
 
## `.addDefaultAction(cb, {unpreventable: false, raceEvents: false})` 

```javascript
//requires the toggleTick function
Object.defineProperty(Event.prototype, "addDefaultAction", {
  value: function (cb, options) {
    let {unpreventable, raceEvents} = options instanceof Object ? options : {};
    if (unpreventable)
      return toggleTick(() => cb(this), raceEvents);
    if (this.defaultPrevented)
      return null;
    const defaultAction = toggleTick(() => cb(this), raceEvents);
    Object.defineProperty(this, "preventDefault", {
      value: function () {
        defaultAction.cancel();
        this.preventDefault();
      }.bind(this),
      writable: false
    });
    return defaultAction;
  },
  writable: false
});
```  

If no default action task is queued, as someone has already called `preventDefault()` on the event and the default action is `preventable`, then `addDefaultAction()` returns `null`;

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
      let {unpreventable, raceEvents} = options instanceof Object ? options : {};
      if (unpreventable)
        return toggleTick(() => cb(this), raceEvents);
      if (this.defaultPrevented)
        return null;
      const defaultAction = toggleTick(() => cb(this), raceEvents);
      Object.defineProperty(this, "preventDefault", {
        value: function () {
          defaultAction.cancel();
          this.preventDefault();
        }.bind(this),
        writable: false
      });
      return defaultAction;
    },
    writable: false
  });
</script>

<div id="one">click.addDefaultAction(() => console.log("one"), {unpreventable: true, raceEvents: ["dblclick"]});</div>
<div id="two">click.addDefaultAction(() => console.log("two"), {unpreventable: false});</div>
<div id="three">click.addDefaultAction(() => console.log("three"), {unpreventable: true}); + click.preventDefault();</div>
<div id="four">click.addDefaultAction(() => console.log("four")); + click.preventDefault();</div>

<script>
  document.querySelector("#three").addEventListener("click", e => e.preventDefault());
  document.querySelector("#four").addEventListener("click", e => e.preventDefault());
  window.addEventListener("click", e => console.log(e.type));
  window.addEventListener("dblclick", e => console.log(e.type));
  const one = document.querySelector("#one");
  const two = document.querySelector("#two");
  const three = document.querySelector("#three");
  const four = document.querySelector("#four");
  one.addEventListener("click", e => e.addDefaultAction(() => console.log("one"), {unpreventable: true, raceEvents: ["dblclick"]}));
  two.addEventListener("click", e => e.addDefaultAction(() => console.log("two"), {unpreventable: false}));
  three.addEventListener("click", e => e.addDefaultAction(() => console.log("three"), {unpreventable: true}));
  four.addEventListener("click", e => e.addDefaultAction(() => console.log("four")));
</script>
```