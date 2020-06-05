# WhatIs: PropagationRoot  or `Event.root`?? or `Event.origin`??

The `Document`, `ShadowRoot`, and `Window` are the propagation roots. 

```javascript
const path = event.composedPath(); 
const PropagationRoot = path[path.length-1];

Object.defineProperties(Event.prototype, {
  "root":  {
    get: function(){
      const path = this.composedPath(); 
      return path[path.length-1];
    }
  },
  //current propagation root scopes
  //if the event has not yet a currentTarget, 
  //then the null value of currentTarget is returned.
  //this converts the document to the window 
  currentRoot: function() {
    const root = this.currentTarget?.getRootNode() || this.currentTarget;
    return root === window || root === document ? window : root;
  },
  //separates between window and document.
  currentRootBounce: function() {
    return this.currentTarget?.getRootNode() || this.currentTarget;
  }
});
```

The bug with the lacking focus event listener illustrate how the browser tries to use the document as a means to verify if it needs to send an event or not.

## PropagationRoot.addEventController..

It listens on the shadowRoot in the capture phase, but transport the event listener to the DOM contexts target in the bubble phase. It always knows the target, as it is marked in the capture phase listener. And it does it only once. And it can be a native once.

It would be a "guaranteed bubble listener". The important thing is to a) make sure that it runs once for the event, and b) that it runs in bubble order/bottom-up. And since non-bubbling events only hit the target element, the only way to achieve that is to add a capture phase event listener on the root, that dynamically adds a new event listener to the target that runs just the one time.


This is a method on the propagation root. Maybe we should think of this as the PropagationRoot interface. That the PropagationRoot has addEventObserver(name, cb). Runs on the last node during bubble propagation. And then this is the method that the event controller instances uses.

Yes, this is it.. The PropagationRoot interface also gets the methods that will activate and deactivate the different event controllers.

The PropagationRoot could automatically garbage collect the event controllers when they were no longer needed, but this is a hazzle. So, they should simply be added automatically by the first event listener for that event added (which can occur both from an event listener, an event listener that will add a defaultAction, and an event controller /observer).

> Bouncing functions must remember to transport defaultActions from the lower event (in the inner DOM context) to the higher event (in the outer DOM context). Always.

