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