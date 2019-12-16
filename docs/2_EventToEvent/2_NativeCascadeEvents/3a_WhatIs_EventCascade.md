# WhatIs: EventCascade

> You can't change the past with time travel. It is the main rule of time travel.

One way to view EventCascades is that one event *spawns* another subsequent event. When a `mouseup` event occurs, this event can spawn a `click` event. But, the browser *rarely* spawns another event for every instance of another event (cf. CascadeChaos). That would be redundant. Instead, the browser evaluates the context in which the first event occurs and then decides if/which other event it should spawn. 

For example, if the browser sees that the `mousedown` event occurred outside the browser window (such as in the debugger console), then it will not spawn a `click` event for the `mouseup` event. Furthermore, the browser will review which mouse button triggered the `mouseup` event: if the primary mouse button triggered the `mouseup` event, then the browser dispatches a `click` event; if the secondary mouse button was used, it dispatches a `contextmenu` event.  

Another way to view EventCascades is as a linear chain reaction, a domino effect. When event A "falls", it triggers event B "to start falling". Here, event A is the **trigger event** and event B is a **cascade event**. But, EventCascades can be long. Event A can trigger event B that in turn trigger event C, etc. etc. Here, event B is both a cascade event and a trigger event itself.
                                                                           
For example: The browser receives a `mouseup` trigger event. The browser evaluates the `mouseup` event and sees that the event was caused by the primary mouse button being pressed down and then released over an element in the DOM. This causes the browser to spawn a `click` cascade event on that element. The browser then receives the `click` event it just produced. It recognizes that the `click` event was happened on a `<submit>` button on a `<form>`. This causes the browser to spawn yet another `submit` event. 
     
    (mousedown + mouseup) => click => submit 

## The sequence of Event cascades and event propagation

> In the next chapters, we will explain in full the details about event propagation that are here just listed.  

Native events cascade in a single file, *one-by-one*. Native events do not cascade in parallel.

Event cascades is the main *outer* cycle of native events; event propagation is the main *inner* cycle of native events. When an event is triggered, it first propagates completely down and up the DOM from the `window` element to the event's `target` element. It is only when this inner cycle of event propagation of the current event is completed (or cancelled), that the outer cycle continues and the next cascade event is triggered.

Furthermore, when you add more than one event listener to a particular DOM element, the event listeners are not only sorted by capture or target phase, but also by the order they were added. This means that there is an inner-inner sequence in event propagation (a FIFO queue), where the event listeners added first are processed first. (This inner-inner sequence ignores the capture/bubble properties of the event listeners in the target pahse, more on this later).

In sum, events can be viewed as processed in three levels:
1. event cascade (the outer-/top-most sequence)
2. event propagation (the inner, primary processing of events) 
3. the event listener insertion order (the inner-inner, FIFO queue of event listeners).

## Demo: EventProcessing 

```html
<div>
  <a href="#clicked">click me!</a>
</div>

<script >
function a(){
  console.log("a");
}
function b(){
  console.log("b");
}
function c(){
  console.log("c");
}
function d1(){
  console.log("d1");
}
function d2(){
  console.log("d2");
}

const container = document.querySelector("div");
const link = document.querySelector("a");

container.addEventListener("mouseup", a, true);
link.addEventListener("mouseup", b, false);
link.addEventListener("mouseup", c, true);
container.addEventListener("mouseup", d1, false);
container.addEventListener("mouseup", d2, false);

container.addEventListener("click", a, true);
link.addEventListener("click", c, true);          //att! on click, c is added before b
link.addEventListener("click", b, false);
container.addEventListener("click", d2, false);   //att! on click, d2 is added before d1 
container.addEventListener("click", d1, false);
</script>
```

Produces the following output:

```
   mouseup   →    click    →  defaultAction
   ↓     ↑       ↓     ↑           ↓
   a     d1,d2   a     d2,d1      (adds "#clicked" to the URL address)
   ↓     ↑       ↓     ↑                 
     b,c            c,b 

//prints:
a
b
c
d1
d2
a
c
b
d2
d1
(#clicked added to the URL)
```

In the next chapter we look more at event propagation.

## List of native trigger => cascade event pairs

The browser provides many native CascadeEvents: 

 * `(mousedown + mouseup) => click`
    * primary (left) mouse button
    * target is the target of both `mousedown` and `mouseup`, or their nearest common ancestor in the DOM
 * `(mousedown + mouseup) => contextmenu`
    * secondary (right) mouse button
    * target is the target of both `mousedown` and `mouseup`, or their nearest common ancestor in the DOM
 * `(mousedown + mouseup) => auxclick`
    * any mouse button but the primary (left)
    * target is the target of both `mousedown` and `mouseup`, or their nearest common ancestor in the DOM
 * `click => submit`
    * the `click` event's target is an `<input type="submit">` in a `<form>`.
 * `keypress => submit`
    * `keypress` event has a key value of `enter` 
    * an `<input type="submit">` in a `<form>` has `focus`
 * `(click + click) => dlbclick`
    * the two click happen within 300ms,
    * the target of both `click` events is the same, or their nearest common ancestor in the DOM
 * `wheel => scroll`
    * todo
 
 * todo, add more examples.
 
 * todo, add references to the spec. for each list item

## References

 * [Smashing: EventCascade](https://www.smashingmagazine.com/2015/03/better-browser-input-events/)
 * [Lauke: event order table](https://patrickhlauke.github.io/touch/tests/results/)