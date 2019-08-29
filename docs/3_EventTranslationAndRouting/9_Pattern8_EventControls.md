# Pattern: EventControls

Once a custom, composed event is deployed, it can be nice to `start()`, `stop()`, and otherwise control it. These methods are not particularly hard to implement, but we desire a nice interface for them. And the `class` created in the ExtendsEvent pattern is a good place to add these control methods.

## Demo: `browse` with `setQueryParameter(prop, value)` 

The use-case behind this demo is to add or alter a query parameter to the request in a `browse`. However, neither the `submit` nor `browse` events control this data; this data is owned by the `<form>` element that is the `target` of the events. Thus, to alter or add query parameter to the event, a function must be run that alters an existing `<input>` or `<textarea>` element, or add a new one, to this `<form>`.

To lessen the burden for the users of the `browse` event, we add a function `setQueryParameter(prop, value)` that can update the `submit` requests query parameters by altering or adding elements of the corresponding `<form>` in the DOM.

```javascript
(function () {
  function dispatchPriorEvent(target, composedEvent, trigger) {
    composedEvent.preventDefault = function () {
      trigger.preventDefault();
      trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
    };
    composedEvent.trigger = trigger;
    return target.dispatchEvent(composedEvent);
  }

  class BrowseEvent extends Event {
    constructor(type, props = {bubbles: true, composed: true}){
      super(type, props);
    }
    setQueryParameter(prop, value) {
      const form = this.target;
      debugger;
      if (form[prop]){
        form[prop] = value;
      } else {
        const input = document.createElement("input");
        input.setAttribute("hidden", "");
        input.setAttribute("name", prop);
        input.setAttribute("value", value);
        form.appendChild(input);
      }
    }
  }

  function onSubmit(trigger) {
    var browse = new BrowseEvent("browse", {bubbles: true, composed: true});
    dispatchPriorEvent(trigger.target, browse, trigger);
  }

  window.addEventListener("submit", onSubmit, true);
})();
```

## Implementation details

In the example above we have chose to let the class definition remain in the composed event SIF, and then explicitly link the class definition to the window object after the fact. The reason we want this explicit link is so that *if* the class name has already been registered, the whole SIF will fail, giving the developer both an error message *and* possibly letting the developer reuse the same event from a different source if another similar/same event has already been registered.

For *single-trigger* composed events, the `start()` and `stop()` methods are very simple. As there is only a single state for the methods to consider, they only need to control a single, boolean state variable and 

The event object that propagates should be considered *immutable*. An event listener receiving an event object should *not* need to consider if the data of that event object has been altered by another event listener earlier in the propagation path. Thus, the *setter* methods do *not* alter details regarding the event itself, but are convenience methods that alter structures associated with the event.

Thus far we have only described composed events that need only a single underlying, trigger event to be dispatched. The setter methods in **single-trigger events** alters:
 * propagation state such as `.stopPropagation()` and `.preventDefault()`,
 * elements in **the DOM** such as the `<form>` in the `browse` event,
 * **browser state**, such as `window.location` for generic, reusable events, and
 * **app state** for app-specific events.

But. Setter methods on Events becomes even more important in the next chapter about EventSequences. EventSequences are necessary for *multi-triggered events* and gestures. The composed event functions that realize these events has their own internal state. And when the user of these EventSequences need to guide the course of an ongoing EventSequence, using *getter* methods on initializing events dispatched from the EventSequence is the best strategy to do so.

## References

 * 