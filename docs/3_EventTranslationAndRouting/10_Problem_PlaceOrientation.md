# Problem: PlaceOrientation

> Fortune cookie: Simplicity leads to efficiency, while efficiency leads to complexity.

**Global** event listeners are functions added to the root `window` or `document` that captures all events of a certain type for all elements. This means that *all events*, even if they are *targeted at different element* at different DOM locations, are still all processed in the *same place*, the root.

**Local** event listeners are functions added on an element within the DOM. These listeners will *only* capture events for a particular group of elements. To capture the same event type on many different targets, several event listeners must be registered in different places in the DOM.

Composed events use **global** listeners.

## The beauty of simplicity

Global listeners are **simpler** than local listeners. Global listeners can be added, removed, and managed *independently of the place* where the event occurs. This is not true for local event listeners. Even when local event listeners reuse the same function for all elements, scripts must still make sure that the correct event listeners are added and removed, both *at the right time* and *at the right place*. Thus, if `m` is the number of event types, `n` is the number of relevant DOM changes, and `p` is the number of locations/elements, then the complexity of:
  * local listeners is `m*n*p` and
  * global listener is `m*n*1` (because there is only `1` place).

Global listeners treat the **DOM as dynamic** by design. The root `window` or `document` is constant. So, even if elements are added and removed from the DOM as mad, the global listener will still automatically pick up the appropriate events on them.

Because global listeners are both **simple** and **dynamic**, they are also **reusable**. A single function that is not bound to a particular DOM context can easily be fashioned to be moved between different apps and use-cases.

> When you as a developer view an event listener from an app script or a web comp definition, your mind is literally "in place", in the DOM. A local listener might at this time feel unproblematic, transient. But, the problem occurs when you leave that place to go somewhere else and then try to link what is happening in that space with something happening in another space. Placing event listeners on elements local in the DOM is adding a place to your event. You might consume events from "in place", but you don't want to process and dispatch them in place.

## The value of efficiency

Local listeners are neither simple, dynamic, nor reusable. So, why can't we just skip thinking about local listeners in the context of composed events? Efficiency and speed.

In the DOM lots of events are constantly fired. A `load` here, and a `mouseleave` there. But, if no event listener are in the DOM forrest to hear these events, do they then exist? The answer is "No, not in JS land. No JS event object needs to be created. No JS event listener functions needs to be triggered."

The benefit of having event listeners on a local element down in the DOM is that it enables the browser to *skip* dispatching JS events for an OS event, even when there are JS event listeners added for a corresponding type of JS event. Lets look at a mousemove as an example:

1. The user moves the mouse. The OS makes a mousemove event, and passes this event to the browser. So far, the OS event exists.
2. The browser then checks to see which JS event listener it has registered that might be triggered by this OS event and to which elements these listeners are attached.
3. Global listeners will be linked with the root element, and this element fills the whole screen. This means that if there are any global event listeners for `mousemove`, `mouseleave`, `mousein`, `dragover`, etc., then there will be a match, regardless of *where* on screen the mouse moved.
4. Local listeners are linked with individual elements. This means that the browser can compare:
    1. the coordinate of the OS mousemove event with 
    2. the list of elements that has a corresponding JS event listener added with 
    3. the layout coordinates these elements.
    
   The browser can then *skip* triggering JS functions for elements whose coordinates do not fit with the OS mousemove event's coordinates.
   
## Demo: global vs local `mouseover`

If *only* a small box in the bottom right corner of the app needs to listen for mousemoves, then an app only a local listener on this bottom corner box will be *far more* efficient than the same app using a global listener to achieve the same effect.

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

In this demo we make a composed event that echoes the `mouseover` event. This is a very costly composed events which will cause the browser to que a JS task for every native `mouseover` event. We use this composed event to put a set of divs on fire.

<code-demo src="demo/MouseoverOnFire.html"></code-demo>

## Conclusion

We always need beauty. Complexity and DOM mutations will come and bite our ass if we don't worry about it, and we can't justify the time it takes to build the same event handlers again and again and again, and so we end up reducing their quality instead. 

And we need efficiency. But some types of events need it more than others. For example, `mousemove` events can occur often and highly frequent, while  `click` events are rare and slow. Having a global listener for `mousemove` is likely horrible, having a global listener for `click` insignificant. For some purposes, all events of a certain type might be captured, while for other use-cases only a select few events needs to be processed. A router might need to capture *all* `submit` events, but only a select few `click`s.

So, we need beauty that can be efficient. Is there such a thing?

## References

 * 