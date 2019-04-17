# Pattern: ReverseGlobalization

> Speed and efficiency matters. Especially in event management.
 
## Ergonomics of global event listeners
    
The EarlyBird is a **global** event listener. It attaches itself the top `document` node
and will capture all events that bubble/propagate globally. 

The biggest benefit of global event listeners is that you can process multiple target elements 
using a single function. This benefit is mostly associated with developer ergonomics, ie. how easy 
it is for the developer to write and maintain code, and how the patterns and architecture help or hinder
the developer in solving his or her problems and create. Having a single function gives the developer
a) a clear overview, b) a clear point of interception when pursuing bugs and c) removes the logic of 
event composition from JS state management and HTML content construction.

Another huge benefit of the composed events based on the EarlyBird pattern is that they are modular 
and DOM independent. 
This makes them both extremely **reusable** and **modular**.
Their reusability makes them highly worth while for the developer to invest in.
Their extremely low couplings to anything other than their triggering events makes them
simple to specialize and gives room for edge case management. They are super cool. 
You can make them highly specialized and efficient and still remain confident 
that when you just drop them into your app, they will work as intended.

A third benefit of EarlyBird composed events is that they are dynamic. 
Add any element to the DOM, and the composed event will automatically be applied to that element. 
No need to associate the composed event with the element in advance. No need to register anything.

Composed events based on localized event listeners have none of these benefits. Their code is mixed 
into the JS state management and/or HTML content structure. This makes them hard to reuse and 
transport between apps. And the more you make them efficient and enable edge case management, 
you more or less just pile complexity into your app.

## Efficiency of global event listeners

Local event listeners have one big advantage over global event listeners: efficiency.
If the event trigger is added to a local element, 
then the browser will only add a JS task to the event loop when the target element is affected.
But, if the event trigger function is added as a global event listener, 
then the browser will have to que a JS task every time the event occurs, on all elements.
Below is an example that illustrate this.

```html
<div id="a" mouseover-alert>This element should alert you on mouseover</div>
<div id="b">This element is normal, no mouseover alert</div>
<script>
  function onMouseover(type, e){
    console.log(type, e.id, e.target.hasAttribute("mouseover-alert"));
  }
  window.addEventListener("mouseover", function(e){onMouseover("global", e)}, true);
  var el = document.querySelector("div[mouseover-alert]");
  el.addEventListener("mouseover", function(e){onMouseover("local", e)}, true);
</script>
```

## Demo: `mouseover-echo` on fire everywhere

In this demo we make a composed event that echoes the `mouseover` event.
This is a very costly composed events which will cause the browser to que a JS task for every
native `mouseover` event. We use this composed event to put a set of divs on fire.

<code-demo src="demo/MouseoverOnFire.html"></code-demo>

## HowTo: speed up global event listeners

To speed up global event listeners we localize them. This is done by:

1. Find all the target elements, ie. the location for the event.

2. Add the initial event trigger listener to them.

3. Remove the initial event trigger listener from the window.

Once the event listeners are localized, the composed event is no longer dynamic:
if you add another element to the DOM and want the event listener attached to it, 
you must *register* that element too.

In addition, sometimes you would like to switch between global and localized state of the composed event.
To do this, we need a second function that:

1. gets all the previously localized elements.

2. removes the initial event trigger listener from them.

3. add the the initial event trigger listener to the window.

## Example: `localizable-mouseover-echo`

<pretty-printer href="demo/mouseover-echo-localizable.js"></pretty-printer>

## Demo: `mouseover-echo` on fire

<code-demo src="demo/MouseoverOnFireLocalizable.html"></code-demo>

## References

 * 