# Pattern: AddPreventableAction

In this chapter we add `preventDefault()` functionality to the `addDefaultAction` method. The `addDefaultAction()` works as in the previous chapter, except with the addition of a second parameter: `preventable`.  

`event.addDefaultAction(cb, preventable, raceEvents)`. If `preventable` is `true`, then calling `.preventDefault()` on the trigger event will block the added default action from running.
 
## `.addDefaultAction(cb, preventable, raceEvents)` 

1. The `preventable` arguments must be a `boolean` or `undefined` which defaults to `true`.
2. The `cb` is a function that will be added as the new default action for the event. We pass the trigger `event` as the first argument to this method. 
3. If `preventable`, then the default action will be blocked when `preventDefault()` is called on the trigger event. 
4. If `preventable` and the `preventDefault()` has been called on the event before `.addDefaultAction()` is called, then the default action will not be added to the event at all.

```javascript
function parsePreventableArg(preventable) {
  if (preventable === undefined)
    return true;
  if (typeof (preventable) === 'boolean' || preventable instanceof Boolean)
    return preventable;
  throw new Error("The second argument 'preventable' in Event.addDefaultAction(cb, preventable, preEvent) is neither undefined nor a boolean.");
}

//requires the toggleTick function
Object.defineProperty(Event.prototype, "addDefaultAction", {
  value: function (cb, preventable, raceEvents) {
    const self = this;
    preventable = parsePreventableArg(preventable);
    if (!preventable)
      toggleTick(() => cb(self), raceEvents);
    if (this.defaultPrevented)
      return;
    const defaultAction = toggleTick(() => cb(self), raceEvents);
    Object.defineProperty(this, "preventDefault", {
      value: function () {
        defaultAction.cancel();
        self.preventDefault();
      },
      writable: false
    });
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

  function parsePreventableArg(preventable) {
    if (preventable === undefined)
      return true;
    if (typeof (preventable) === 'boolean' || preventable instanceof Boolean)
      return preventable;
    throw new Error("The second argument 'preventable' in Event.addDefaultAction(cb, preventable, preEvent) is neither undefined nor a boolean.");
  }

  //requires the toggleTick function
  Object.defineProperty(Event.prototype, "addDefaultAction", {
    value: function (cb, preventable, raceEvents) {
      const self = this;
      preventable = parsePreventableArg(preventable);
      if (!preventable)
        toggleTick(() => cb(self), raceEvents);
      if (this.defaultPrevented)
        return;
      const defaultAction = toggleTick(() => cb(self), raceEvents);
      Object.defineProperty(this, "preventDefault", {
        value: function () {
          defaultAction.cancel();
          self.preventDefault();
        },
        writable: false
      });
    },
    writable: false
  });
</script>

<div id="one">click.addDefaultAction(()=> console.log("one"));</div>
<div id="two">click.addDefaultAction(()=> console.log("two"), true);</div>
<div id="three">click.addDefaultAction(()=> console.log("three"), false); + preventDefault called on click</div>
<div id="four">click.addDefaultAction(()=> console.log("four"), undefined); + preventDefault called on click</div>
<div id="five">click.addDefaultAction(()=> console.log("five"), undefined, ["dblclick"]);</div>
<div id="six">click.addDefaultAction(()=> console.log("six"), "throwMeAnError");</div>

<script>
  document.querySelector("#three").addEventListener("click", e => e.preventDefault());
  document.querySelector("#four").addEventListener("click", e => e.preventDefault());
  window.addEventListener("click", e => console.log(e.type));
  window.addEventListener("dblclick", e => console.log(e.type));
  const one = document.querySelector("#one");
  const two = document.querySelector("#two");
  const three = document.querySelector("#three");
  const four = document.querySelector("#four");
  const five = document.querySelector("#five");
  const six = document.querySelector("#six");
  one.addEventListener("click", e => e.addDefaultAction(() => console.log("one")));
  two.addEventListener("click", e => e.addDefaultAction(() => console.log("two"), true));
  three.addEventListener("click", e => e.addDefaultAction(() => console.log("three"), false));
  four.addEventListener("click", e => e.addDefaultAction(() => console.log("four"), undefined));
  five.addEventListener("click", e => e.addDefaultAction(() => console.log("five"), undefined, ["dblclick"]));
  six.addEventListener("click", e => e.addDefaultAction(() => console.log("six"), "throwMeAnError"));
</script>
```