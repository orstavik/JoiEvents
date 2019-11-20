# Pattern: DetailsOnDemand

In the Pattern: ExtendsEvent and HowTo: new CustomEvent we looked at *where* we can add properties and methods to custom events. In this chapter we discuss *when* we should process custom events' data.

## Up-front vs. on-demand processing

An event's details can be processed at two *times*: up-front or on-demand.

## Process details up-front

When an event occurs, the use-case for certain events likely need some recurring details from the event. The most direct approach would therefore be to:

1. process the event details *up-front* when the event is first triggered, and 

2. add the resulting values as properties on the event object that is dispatched.

The benefit of such an approach is that its simple, intuitive, and produce clean code.
But. There are two problems with this approach:

 * **Not all event listeners use all event details**. This means that the composed event function might end up calculating event details in vain. For fin-grained events such as `touchmove` and `mousemove`, such inefficiency is bad.

 * **Event data can change during event propagation**. If this data is "owned" by another entity than the event itself, then the details the event has processed and locked up front are at minimum redundant and at worst out-dated and wrong.

That all event listeners doesn't need all the event's details is an easy concept to grasp. But, event data changing during propagation van be a bit tricky to see at first. So, let's look at an example of that.

`submit` events process form data. But the `submit` event doesn't "own" the form data: `<form>` elements "own" form data. As a `submit` event propagates, a `submit` event listener may very well adjust and alter data in that `<form>`. But, if the `submit` event has made a copy of these details and present them to the user of the event "as the details", then changing these copied data will not have any affect to the end result. 

Even when you delay the processing of event details, it is tempting to *change the ownership* of the data too. For example, try to dictate for example that *the event owns the data while it propagates*. But. Don't do this. It doesn't work because:
 * In principle, `Event`s are **immutable messages**. Sure, they have methods such as `.stopPropagation()` and `.preventDefault()`, but these methods alter the state of the events propagation cycle, not the message itself.
 * other functions running asynchronously might also need to access the same data. An example of such an async function is the default action for `submit` events that has already been added to the task que when the `submit` event starts to propagate.
 * there is no way to ensure that the changes of the event's data do not simply vanish once the event stops propagating. (There is no `postPropataion` callback on events, so there is no way to safely and at the right time ensure that the changed data can be transmitted back to for example the DOM or a waiting default action task.)

So, event details are to be considered either *immutable* or *not owned by the event*.
    
## Process details on-demand
  
So, we want to:
 * process as few details as possible up-front and
 * avoid having the users of our custom events write the same boilerplate to hash out the same details for frequently recurring problems. 

The solution to this dilemma is to process the data *on-demand*. Instead of adding to the custom event object with a finished-calculated property value, we add a method that *can* calculate or retrieve the detail for the user, upon request. This hides all the arithmetic for the user, but avoids all the up-front problems.

## Demo: `browse` with `getQueryString()` from `submit` 

When a `submit` event is dispatched, the data in a `<form>` will be converted into a https request. If `<form>` as `method="GET"`, then the data in the form will be converted into a query on the form `?prop1=value&prop2=value...` and appended to the `action` attribute's URL. 

In such a case, the full link of the `<form>` might come in handy. You don't want to burden the user of the event with processing the `<form>` data into a query string, but because you don't need the full link all the time, you do don't want to calculate it up-front.
 
To solve this dilemma, we will echo the `submit` event as another custom event we call `browse`. We set up the `browse` event as a class that `extends Event`, and then we add to this class a method that can retrieve the query string on-demand.

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
    getQueryString() {
      const form = this.target;
      if (form.method === "POST")
        return "";
      const url = new URL("https://2js.no");
      for (let el of form.elements) {
        if (el.hasAttribute("name"))
          url.searchParams.append(el.name, el.value);
      }
      debugger;
      return url.searchParams.toString();
    }
  }

  function onSubmit(trigger) {
    var browse = new BrowseEvent("browse", {bubbles: true, composed: true});
    dispatchPriorEvent(trigger.target, browse, trigger);
  }

  window.addEventListener("submit", onSubmit, true);
})();
```

## Where to store event data

If a) the data concerning the event is primitive and b) the data is not associated with any one particular html element and c) read only (should remain fixed throughout event propagation, then this data should be in the event. Try to freeze the getter setter on the event for this data/these details.

If the data a) might be changed during the event propagation (such as a link reference during a click), b) is not a primitive, or c) is tightly associated with the target element, then it should be a property on the target element.

Global Composed events, as described in this book, provide a clear benefit over composing events from within custom elements, as they clearly embrace their universal and global purpose. Controlling global, universal from element types can likely cause conflicts as a parent and child might both implement some variant of the same global event (such as `pull`).

## References

 * 
