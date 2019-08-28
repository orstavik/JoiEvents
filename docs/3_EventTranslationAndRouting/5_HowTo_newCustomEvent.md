# HowTo: `new CustomEvent()`

The `new CustomEvent("event-name", {bubbles, composed, cancelable, detail})` is the default strategy to create custom events in JS. With it, you can create and name your own `Event` objects that can be dispatched to JS event listeners attached to DOM elements.

## CustomEvent basics

`CustomEvent`s have a `.detail` property. The `.detail` property is the assumed place for added information about the event outside of the event's `type` name and `target` element. You can add both properties and methods to the `.detail` object if you want. To listen for a composed event, you add a normal event listener for the composed event's name, attached to a target in the DOM, or the root `window` object.

```javascript
  //1. HowTo declare a CustomEvent
  var detail = {
    one: "something",
    two: function(){
      return "something else";
    }
  };
  var customEvent1 = new CustomEvent(
    "basic-custom-event",
    {bubbles: true, composed: true, cancelable: false, detail: detail}
  );

  //2. HowTo listen for a CustomEvent
  window.addEventListener("basic-custom-event", function(e){
    console.log(e);
    console.log(e.detail.one);
    console.log(e.detail.two());
  });

  //3. HowTo dispatch a CustomEvent ("var customEvent1" was declared in step 1).
  window.dispatchEvent(customEvent1);
```

## HowTo avoid unnecessary `.detail`s

The above method can implement all custom events. It is simple to use. It is efficient. And it looks good when you need to declare custom events in code that primary serve other purposes, such as app scripts or web component definitions. But, using *only* the `new CustomEvent(...)` with a `.detail` can also be a bit annoying on the receiving end: all those pesky `.detail`s!

And they can be avoided. Instead of adding properties and methods under the `detail` object, we can add them directly on the CustomEvent object.

```javascript
  //1. Alternative declaration of a CustomEvent
  var customEvent2 = new CustomEvent(
    "extended-custom-event",
    {bubbles: true, composed: true, cancelable: false}
  );

  customEvent2.one = "something";
  customEvent2.two = function(){
    //"this" is the object (ie. customEvent2) to which the function belongs to
    return this.one + " else";   
  };

  //2. HowTo listen for a CustomEvent
  window.addEventListener("extended-custom-event", function(e){
    console.log(e);
    console.log(e.one);     //no `.detail`
    console.log(e.two());   //no `.detail`
  });

  //3. HowTo dispatch a CustomEvent
  window.dispatchEvent(customEvent2);
```

We have already seen this strategy employed in the PriorEvent and AfterthoughtEvent patterns when they override the `.preventDefault()` method. The benefit of this strategy is that it keeps the API of the custom event free of unnecessary `.detail`s.

## Polyfill for IE/es5

In IE and es5 you must add the `CustomEvent` polyfill *before* you try to make a CustomEvent object:

```javascript
(function () {

  if ( typeof window.CustomEvent === "function" ) return false;

  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: null };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();
```

## References

 * 
                                                                            