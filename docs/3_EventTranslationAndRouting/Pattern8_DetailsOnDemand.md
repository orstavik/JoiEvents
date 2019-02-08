# Pattern: DetailsOnDemand

As described in SpecializedEventInterface, information about an event can be added both in a 
specialized `.detail` object or directly on the event object itself. But, regardless of *where* you
place your event data, there are two different *times* you can process them: up-front or on-demand.

## Up-front vs. on-demand processing

When you create a custom event, the most immediate approach would be to:
1. prepare all the data that the users of the event likely will need, and 
2. add them as values to the detail or the event object itself. 

The benefit of this approach is that it is simple. But, there are two problems with this approach:

1. Sometimes, the data of your event is not associated with the trigger event itself.
   The information about a `submit` event for example is not associated with the event itself, 
   but with the `<form>` element that the `submit` event points to.
   If the event stores the values of the form's `action` attribute or `<input>` values up-front,
   and then one of the event listeners for said `submit` event alters this data, then the values 
   in the event are outdated.
    
   Storing data up-front does not work for information kept outside of the event itself, 
   such as information from the DOM.                           
   
2. Events such as `touchmove` and `mousemove` are dispatched in rapid succession (fine-grained).
   If your custom event are triggered and map such native, fine-grained event, efficiency is important.
   You need to ensure that you do not process more data for each event than is strictly necessary.
   
   For fine-grained events, you want to process only the absolute essential data up-front. 
   But, at the same time, you want to avoid having the users of your custom events having to write
   lots of code to for frequently recurring problems. An example of such recurring processing can be
   to calculate the diagonal distance and angle of a custom swipe event. Lets say that half the 
   swipe event need only the diagonal distance, while the other half only needs the angle.
   Processing both angle and diagonal distance up-front thus presents the developer with a dilemma: 
   1. Should I burden the browser with processing both angle and diagonal distance, 
      when I only need one or the other? 
   2. Or should I burden the developer by making them calculate on their own the diagonal or the angle?
   
The solution that solves both of these problems is to process the data on-demand, instead of up-front.
Instead of providing the `submit` event with a value of the `action`, the `submit` event could have a
method `.getAction()` that retrieved the current value of the associated `<form>` element.
The `target` and `type` attributes of DOM Events are immutable, and so having a method that relies on 
these properties will work. In the same way two `.getAngle()` and `.getDiagonalDistance()` methods 
on a custom swipe event can perform the calculation needed *only* when asked for, thus 
avoiding both:
1. burdening the browser with unnecessary processing during fine-grained events, and 
2. burdening the developer with having to write procedures for recurring problems.

## DetailsOnDemand

A simple and clean way to make such methods is to:
 1. create som generic functions so as to avoid parsing the same functions twice 
    that accepts the event or the event.target as input,
 2. and then create an anonymous function (closure) that calls this method using the custom event 
    itself as input.

## Example 1: `link-click-2` with naive `getHref()` method

To illustrate this practice we expand our `link-click-1` event. 
We create a function `getLinkHref(element)` that given a target element returns 
the `href` property of that element.
As a `getHref` property to the `new CustomEvent` object, 
we then add a closure that calls `getLinkHref(element)` using the `newTarget` as argument.

<script src="https://cdn.jsdelivr.net/npm/joievents@1.0.0/src/webcomps/PrettyPrinter.js"></script>
<pretty-printer href="https://raw.githubusercontent.com/orstavik/JoiEvents/master/src/browse/link-click-2.js"></pretty-printer>

## Example 2: `link-click-2-es6`
                                                                    
A drawback with link-click-2 above is that it creates a closure for each event.
As we only have both a single closure and non-frequent event click, this is slight inefficiency
is not problematic. But, if we provide DetailsOnDemand to fine-grained composed events, 
then we would like to avoid creating similar functions each time. 
And to avoid that we can create our own `Event` subclass.

<pretty-printer href="https://raw.githubusercontent.com/orstavik/JoiEvents/master/src/browse/link-click-2-es6.js"></pretty-printer>

## Example 3: `link-click-2-es5`

Not all browsers support es6 (ie. IE). If you need to support older browsers, 
the same effect can be achieved with this similar, but less readable es5 alternative.

<pretty-printer href="https://raw.githubusercontent.com/orstavik/JoiEvents/master/src/browse/link-click-2-es5.js"></pretty-printer>

In this book we will base our explanations on es6 code. If you need to convert DetailsOnDemand to es5,
simply return to this chapter and convert the code manually.

## Demo: `link-click-2` navigation

<script async src="//jsfiddle.net/orstavik/at1e7opd/1/embed/html,result/"></script>

## References

 * 
                                                                            