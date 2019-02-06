# Pattern: CustomEventMethod

When processing events, you want to prepare the event for general use, but you want to delay 
as much of this work as possible.
This means that instead of populating your custom event with processed data, 
you want to populate your event with methods that will retrieve that data later.

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
is not problematic. But, if we add more CustomEventMethods to our composed events or
if we add CustomEventMethods to high frequent composed events, then we would like to avoid
creating similar functions each time. And to avoid that we can create our own `Event` subclass.

<pretty-printer href="https://raw.githubusercontent.com/orstavik/JoiEvents/master/src/browse/link-click-2-es6.js"></pretty-printer>

## Example 3: `link-click-2-es5`

Not all browsers support es6 (ie. IE). If you need to support older browsers, 
the same effect can be achieved with this similar, but less readable es5 alternative.

<pretty-printer href="https://raw.githubusercontent.com/orstavik/JoiEvents/master/src/browse/link-click-2-es5.js"></pretty-printer>

In this book we will base our explanations on es6 code. If you need to convert CustomEventMethods to es5,
simply return to this chapter and convert the code manually.

## Demo: `link-click-2` navigation

<script async src="//jsfiddle.net/orstavik/at1e7opd/1/embed/html,result/"></script>

## References

 * 
                                                                            