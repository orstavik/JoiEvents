# Pattern: SpecializedEventInterface

## Pattern: CustomEvent.detail

DOM Events have a `.detail` property. The `.detail` property is the assumed place for 
added information about the event outside of the event's `type` name and `target` element.
Thus, the first choice is to add information about a custom event as data under its `.detail` property.

If all the custom information about an event is contained within the `.detail` property of the event,
then the Event parent object can be a generic `Event` or `CustomEvent` type. We can call this 
the "CustomEvent.detail" pattern: use a completely generic `CustomEvent` parent object with a
completely custom `.detail` object. It feels like the browsers is advocating that developers use
this model.

```javascript
var detail = {
  one: "something",
  two: function(){
    return "something else";
  }
}
var CustomEvent = new CustomEvent(
  "custom-event", 
  {bubbles: true, composed: true, cancelable: false, detail: detail}
);
```

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

## Pattern: SpecializedEventInterface

However. The browsers and their native DOM Event's has also established the practice of storing 
event information as properties directly on the DOM Event object: 
`touchmove` and `mousemove` events' coordinates are added directly on the DOM Event object; 
the `keydown` event has the `.key` property; etc.

These native events have their own `Event` interface such as `MouseEvent` and `KeyboardEvent`.
And these interfaces have their event properties *directly* attached to the event object;
they do *not* use the `.detail` object.

In es6, you make SpecializedEventInterface like this:

```javascript
class SpecialEvent extends Event {
  constructor(type, props = {bubbles: true, composed: true}){
    super(type, props);
  }
  two(){
    return "something else";
  }
}
var customEvent = new SpecialEvent("custom-event");
customEvent.one = "someting";
```

## SpecializedEventInterface vs. CustomEvent.detail

The SpecializedEventInterface is considered legacy. 
When the developer makes a new custom event today, he/she should use the CustomEvent.detail pattern.
But why?

Yes, if you are making your custom event alongside all your other DOM processing code, 
then making a specialized Event prototype mixed up in there would not be all that pretty.
The estethics of a generic `CustomEvent` with a specialized `detail` object is better:
the CustomEvent object is easier to make, and it is easy to separate all the custom properties of
your custom event in the custom `.detail` property.

Yes, in ES5 and old browsers such as IE, the CustomEvent.detail pattern is simpler and safer.

But, what happens when we make global, composed events. When composing DOM Events like we are doing here,
we separate the code that create the custom  event from the code that listens for the composed events. 
And this gives another estethics. 
For global, composed events a SpecializedInterface with its own type is *easier* to recognize when 
they have their own, custom interface. A custom event prototype: 
 * makes type-checks of this type of events easier to write and read,
 * is less likely to get mixed up with other events,
 * prints prettier in devtools, 
 * require less boilerplate when used (ie. `.detail.`),
 * echoes the pattern of the oldest, but by far the most commonly used native events, and
 * is easier to write correctly when making the composed Event.

So, when you are creating your custom DOM Events interspersed in the rest of your app's code, 
then the CustomEvent.detail pattern likely provides the better estethics. But, if you
are making global, composed events in ES6, the SpecializedEventInterface pattern is a better choice.

## References

 * 
                                                                            