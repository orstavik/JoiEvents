# WhatIs: LinkClick


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

<div href="#sunshine">hello</div>
<div href="#world">goodbye</div>

<script>
  window.addEventListener("click", e => console.log(e.type));

  const hello = document.querySelector("div[href='#sunshine']");
  const goodbye = document.querySelector("div[href='#world']");
  const hellosDefaultAction = function(e){
    console.log("triggered by: ", e);
    location.href = new URL(this.getAttribute("href"), document.baseURI).href;
  }.bind(hello);
  hello.addEventListener("click", e => e.addDefaultAction(hellosDefaultAction));
  const goodbyesDefaultAction = function(e){
    console.log("triggered by: ", e);
    location.href = new URL(this.getAttribute("href"), document.baseURI).href;
  }.bind(goodbye);
  goodbye.addEventListener("click", e => e.addDefaultAction(goodbyesDefaultAction));
</script>
```