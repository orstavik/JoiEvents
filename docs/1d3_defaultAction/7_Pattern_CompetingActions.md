# Pattern: Competing DefaultAction

To resolve conflicting actions, the `addDefaultAction(...)` method needs remember which element each default action is associated with. In the previous chapter about PreventableActions we saw how we could create preventable actions. In this chapter, we will extend this function slightly so that it will remember which element in the propagation path the default action is associated with and therefore be able to only register a) automatically select the conflicting default action associated with the lowest-most element in the trigger event's propagation path, and b) prevent the other conflicting default actions from being activated.

## Resolving competing default actions for an event

To achieve this, we instead of passing in a boolean `true`/`false` value to the `preventable` option, we pass in the `HTMLElement` associated with the default action from the trigger event's propagation path. If the `preventable` option is `undefined`, `false` or otherwise falsy, the default action is considered non-conflicting and non-preventable.

When a new conflicting, preventable default action is added to an event, the method will also call `preventDefault()` on any default actions associated with previous elements higher in the DOM. To avoid cancelling default actions on native elements situated lower in the propagation path, a per-trigger-event function is run first to register any native default action for that trigger event in the propagation path. Todo, this is added in the next chapter.

We register on the event object instance:
1. the element associated with existing default actions as `_defaultActionElement`, and 
2. any current, custom default actions added as `_defaultAction`. 

## `addDefaultAction(cb, options)` part 3

```javascript
//requires the toggleTick function
Object.defineProperty(Event.prototype, "addDefaultAction", {
  value: function (cb, options) {
    let {preventable, raceEvents} = options instanceof Object ? options : {};
    if (!preventable)
      return toggleTick(() => cb(this), raceEvents);
    if (this.defaultPrevented)
      return null;
    if (this.composedPath().indexOf(preventable) === -1)
      throw new Error("The preventable option in the addDefaultAction is not an element in this event's propagation path.");
    // the preventable element is above the  previously added default action happened below in the DOM
    // and therefore essentially calls preventDefault() on the one attempted to be added here.
    if (this._defaultActionElement && preventable.contains(this._defaultActionElement) && preventable !== this._defaultActionElement)
      return null;
    this.preventDefault();
    this._defaultActionElement = preventable;
    if (this._defaultAction) {
      this._defaultAction.reuse(() => cb(this), raceEvents);
      return true;
    }
    this._defaultAction = toggleTick(() => cb(this), raceEvents);
    Object.defineProperties(this, {
      preventDefault: {
        value: function () {
          this._defaultAction.cancel();
        }.bind(this),
        writable: false
      },
      defaultPrevented: {
        get: function () {
          !this._defaultAction.isActive();
        }.bind(this),
        set: function () {
        }
      }
    });
    return true;
  },
  writable: false
});
```

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
    value: function (cb, options) {
      let {preventable, raceEvents} = options instanceof Object ? options : {};
      if (!preventable)
        return toggleTick(() => cb(this), raceEvents);
      if (this.defaultPrevented)
        return null;

      if (this.composedPath().indexOf(preventable) === -1)
        throw new Error("The preventable option in the addDefaultAction is not an element in this event's propagation path.");
      // the preventable element is above the  previously added default action happened below in the DOM
      // and therefore essentially calls preventDefault() on the one attempted to be added here.
      if (this._defaultActionElement && preventable.contains(this._defaultActionElement) && preventable !== this._defaultActionElement)
        return null;

      this.preventDefault();
      this._defaultActionElement = preventable;
      if (this._defaultAction) {
        this._defaultAction.reuse(() => cb(this), raceEvents);
        return true;
      }

      this._defaultAction = toggleTick(() => cb(this), raceEvents);
      Object.defineProperties(this, {
        preventDefault: {
          value: function () {
            this._defaultAction.cancel();
          }.bind(this),
          writable: false
        },
        defaultPrevented: {
          get: function () {
            !this._defaultAction.isActive();
          }.bind(this),
          set: function () {
          }
        }
      });
      return true;
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
  one.addEventListener("click", e => e.addDefaultAction(() => console.log("one"), {
    preventable: e.currentTarget,
    raceEvents: ["dblclick"]
  }));
  two.addEventListener("click", e => e.addDefaultAction(() => console.log("two"), {preventable: e.currentTarget}));
  three.addEventListener("click", e => e.addDefaultAction(() => console.log("three"), {raceEvents: ["dblclick"]}));</script>
```