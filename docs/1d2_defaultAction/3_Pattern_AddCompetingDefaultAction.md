# Pattern: Competing DefaultAction

Sometimes multiple elements wish to do a default action on a specific event. One click can both open a details/summary AND start playing a video or audio element AND open a new link AND/OR check a checkbox. These default actions are competing for the same trigger event.

Which is no good. When a user clicks on a video play button that happens to be inside a summary/details element, then you only want one of the actions, you only want the action of the element closest to the target in the hierarchy.  

## Resolving competing default actions for an event

We change the signature to `.addDefaultAction(cb, ownerElement, raceEvents)`.

If `ownerElement` is `undefined`, then the `cb` is not `preventable` and is added as a standalone `toggleTick` callback.

All `default actions` that has an ownerElement are considered competing. There can only be *one* such default action per event instance.

To solve the problem of competing interactive elements, we need to add information about which element has already added a default action to the event instance. We do so by adding a special property to the event object which registers the `owner` element of the default action: `_addedDefaultActionTriggerElement`.

If an event already has `_addedDefaultActionTriggerElement` and this element is *lower*, the `addDefaultAction()` will not override it.

## Demo: competing default actions 

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
    value: function (cb, owner, raceEvents) {
      const self = this;
      if (owner === undefined)
        return toggleTick(() => cb(self), raceEvents);
      if (!(owner instanceof HTMLElement))
        throw new Error("The second argument 'owner' in Event.addDefaultAction(cb, owner, preEvent) must be undefined or an HTMLElement.");
      if (this.defaultPrevented)
        return;

      // the previously added default action happened below in the DOM
      // and therefore essentially calls preventDefault() on the one attempted to be added here.
      if (
        this._addedDefaultActionTriggerElement && (
        owner.contains(this._addedDefaultActionTriggerElement) ||
        owner === this._addedDefaultActionTriggerElement)
      )
        return;
      const wrapper = function () {
        if (!self.defaultPrevented)
          cb(self);
      };
      this._addedDefaultActionTriggerElement = owner;
      if (this._defaultAction)
        return this._defaultAction.reuse(wrapper, raceEvents);

      this._defaultAction = toggleTick(cb, raceEvents);
      this.preventDefault();
      Object.defineProperty(this, "defaultPrevented", {
        get: function () {
          !this._defaultAction.isActive();
        },
        set: function () {
          debugger;
        }
      });
      Object.defineProperty(this, "preventDefault", {
        value: function () {
          this._defaultAction.cancel();
        },
        writable: false
      });
    },
    writable: false
  });
</script>

<div id="one">
  click.addDefaultAction(#one, ()=> console.log("one"), target, [dblclick]);
  <div id="two">
    click.addDefaultAction(#two, ()=> console.log("two"), target);
    <div id="three">
      click.addDefaultAction(#three, ()=> console.log("three"), undefined, [dblclick]);
    </div>
  </div>
</div>

<script>
  // window.addEventListener("click", e => e.preventDefault());
  window.addEventListener("click", e => console.log(e.type));
  window.addEventListener("dblclick", e => console.log(e.type));
  const one = document.querySelector("#one");
  const two = document.querySelector("#two");
  const three = document.querySelector("#three");
  one.addEventListener("click", e => e.addDefaultAction(() => console.log("one"), e.currentTarget, ["dblclick"]), true);
  two.addEventListener("click", e => e.addDefaultAction(() => console.log("two"), e.currentTarget), true);
  three.addEventListener("click", e => e.addDefaultAction(() => console.log("three"), undefined, ["dblclick"]), true);
</script>
```