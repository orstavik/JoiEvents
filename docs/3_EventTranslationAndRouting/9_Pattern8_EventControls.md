# Pattern: EventControls

Once a custom, composed event is deployed, it can be nice to `start()`, `stop()`, and otherwise control it. These methods are not particularly hard to implement, but we desire a nice interface for them. And the `class` created in the ExtendsEvent pattern is a good place to add these control methods.

## Demo: `browse` with `start()` and `stop()` 

```javascript
(function () {
  function onSubmit(trigger) {
    var browse = new BrowseEvent("browse", {bubbles: true, composed: true});
    trigger.target.dispatchEvent(browse);
  }

  var state = "dead";
  
  class BrowseEvent extends Event {
    constructor(type, props = {bubbles: true, composed: true}, trigger){
      super(type, props);
      this.trigger = trigger;
    }
    preventDefault () {
      this.trigger.preventDefault();
      this.trigger.stopImmediatePropagation ? this.trigger.stopImmediatePropagation() : this.trigger.stopPropagation();
    }
    static start(){
      if (state !== "dead")
        return;
      window.addEventListener("submit", onSubmit, true);
      state = "listening";
    }
    static stop(){
      if (state !== "listening")
        return;
      window.removeEventListener("submit", onSubmit, true);
      state = "dead";
    }
  }
  
  window.BrowseEvent = BrowseEvent;
})();
```

## Implementation details

In the example above we have chose to let the class definition remain in the composed event SIF, and then explicitly link the class definition to the window object after the fact. The reason we want this explicit link is so that:
 * *if* the class name has already been registered, the whole SIF will fail, giving the developer both an error message *and* possibly letting the developer reuse the same event from a different source if another similar/same event has already been registered,
 * we can use variables in the SIF as static private properties in the BrowseEvent class. There is no syntactic structure for this in JS at the moment. 
 * The static methods also needs to be able to reference the composed event functions in order to function.

For *single-trigger* composed events, the `start()` and `stop()` methods are very simple. As there is only a single state for the methods to consider, they only need to control one boolean state variable and one event listener function. However, when EventSequences and touch and mouse gestures enter with many more states, functions, and complexity, the logic of such global control functions for events become quite complex.

The event object that propagates should be considered *immutable*. An event listener receiving an event object should *not* need to consider if the data of that event object has been altered by another event listener earlier in the propagation path. Thus, the *setter* methods do *not* alter details regarding the event itself, but are convenience methods that alter structures associated with the event.

Thus far we have only described composed events that need only a single underlying, trigger event to be dispatched. The setter methods in **single-trigger events** alters:
 * propagation state such as `.stopPropagation()` and `.preventDefault()`,
 * elements in **the DOM** such as the `<form>` in the `browse` event,
 * **browser state**, such as `window.location` for generic, reusable events, and
 * **app state** for app-specific events.

But. Setter methods on Events becomes even more important in the next chapter about EventSequences. EventSequences are necessary for *multi-triggered events* and gestures. The composed event functions that realize these events has their own internal state. And when the user of these EventSequences need to guide the course of an ongoing EventSequence, using *getter* methods on initializing events dispatched from the EventSequence is the best strategy to do so.

## References

 * 