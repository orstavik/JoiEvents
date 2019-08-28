# Pattern: DetailsOnDemand

In the Pattern: ExtendsEvent and HowTo: new CustomEvent we discussed how and where we can add properties and methods to custom events. In this chapter we discuss *how* and *why* you can delay processing custom events data.

## Up-front vs. on-demand processing

There are two different *times* you can process an event's details: up-front or on-demand.

## Details up-front

When an event occurs, the use-case for certain events likely need some recurring details from the event. The most direct approach would therefore be to:
1. process the event details *up-front* when the event is first triggered, and 
2. add the resulting values as properties on the event object that is dispatched.

The benefit of such an approach is that its simple, intuitive, and produce clean code.
But. There are two problems with this approach:

1. Not *all* event listeners end up using *all* the event's details. This means that the composed event function might end up processing event details in vain. For fin-grained events such as `touchmove` and `mousemove`, such inefficiency is bad.

2. Sometimes, the data an event refers to change *while* the event propagates. If this data is "owned" by another entity than the event itself, then the details the event has processed and locked up front are at minimum redundant and at worst out-dated and wrong.

   For example, `submit` events process form data. But the `submit` event doesn't "own" the form data; form data are ordered under `<form>` elements. As a `submit` event propagates, a `submit` event listener may very well "clean up" data in that `<form>`. But, if the `submit` event has locked its details to the state of the form data when the `submit` was first triggered, then an error has occured.
    
## Details on-demand
  
So, we want to:
 * process as few details as possible up-front and
 * avoid having the users of our custom events write the same boilerplate to hash out the same details for frequently recurring problems. 

The solution to this dilemma is to process the data *on-demand*. Instead of adding to the custom event object with a finished-calculated property value, we add a method that *can* calculate the detail for the user, upon request. This hides all the arithmetic for the user, but avoids all the up-front problems.

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

## References

 * 


# OLD

## Example 1: `link-click` with naive `getHref()` method

To illustrate this practice we expand our `link-click` event from [Pattern: TypeFilteredEvent](Pattern7_TypeFilteredEvent). 
We create a function `getLinkHref(element)` that given a target element returns 
the `href` property of that element.
As a `getHref` property to the `new CustomEvent` object, 
we then add a closure that calls `getLinkHref(element)` using the `newTarget` as argument.

<pretty-printer href="demo/link-click-DetailsOnDemand.js"></pretty-printer>

## Example 2: `link-click` with DetailsOnDemand es6
                                                                    
A drawback with the `link-click` implementation above is that it creates a closure for each event.
As we only have both a single closure and non-frequent event click, this is slight inefficiency
is not problematic. But, if we provide DetailsOnDemand to fine-grained composed events, 
then we would like to avoid creating similar functions each time. 
And to avoid that we can create our own `Event` subclass.

<pretty-printer href="demo/link-click-DetailsOnDemand-es6.js"></pretty-printer>

## Example 3: `link-click` with DetailsOnDemand es5

Not all browsers support es6 (ie. IE). If you need to support older browsers, 
the same effect can be achieved with this similar, but less readable es5 alternative.

<pretty-printer href="demo/link-click-DetailsOnDemand-es5.js"></pretty-printer>

In this book we will base our explanations on es6 code. If you need to convert DetailsOnDemand to es5,
simply return to this chapter and convert the code manually.

## Demo: `link-click` with DetailsOnDemand navigation

<code-demo src="demo/link-click-DetailsOnDemand.html"></code-demo>

                                                                            