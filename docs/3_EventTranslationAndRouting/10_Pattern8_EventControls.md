# Pattern: EventControls

Once a custom, composed event is added to the app, it would be nice to have some control over it, for example to `start()` and `stop()` it. These methods are not particularly hard to implement, the only question is how we would like to expose them? The `class` created in the ExtendsEvent pattern is a good place to add these control methods.

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
      window.addEventListener("submit", BrowseEvent.onSubmit, true);
      state = "listening";
    }
    static stop(){
      if (state !== "listening")
        return;
      window.removeEventListener("submit", BrowseEvent.onSubmit, true);
      state = "dead";
    }
  }
  
  window.BrowseEvent = BrowseEvent;
  BrowseEvent.start();
})();
```

## Implementation details

Methods to control the BrowseEvent that we want to expose externally, we:
1. add as static methods on the BrowseEvent, and then we
2. expose the BrowseEvent class by adding it to the `window` object.

We keep the SIF intact to preserve the composed event's *private* functions and state variables from being accessible from outside the composed event. The SIF is essentially a mechanism to create a `private static` scope for the composed event; static methods + exposing the class on the `window` creates the `public static` scope for the composed event. Unfortunately, there is no `private static` scope syntax in JS, such as in Java.

An added bonus from this set-up is that the `BrowseEvent` isn't started until the developer has attempted to add it to the `window`. If something else named "BrowseEvent" had already been registered on the `window`, then the SIF will fail at this point. This means that the composed event in essence will stop working and no events will be dispatched nor listened for. And produce an error message. This is good as having already a `window.BrowseEvent` would likely mean that an identical or similar function has already been actived, and then you do *not* want to produce *two* identical events. The `class` name features as an implied feature check.

If you want an explicit feature check, simply add the following check at the very beginning of the composed event SIF:
```javascript
if (/*window.*/BrowseEvent)
  return;
```

For *single-trigger* composed events, the `start()` and `stop()` methods are very simple. As there is only a single state for the methods to consider, they only need to control one boolean state variable and one event listener function. However, EventSequences and gestures for touch and mouse have more states, more functions, and therefor will have more complex public and private static functions in the composed event SIF.

## References

 * 