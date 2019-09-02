# HowTo: `pointer-events`

## Native CSS control of events

`pointer-events` and `touch-action` are native CSS properties that control events. When these properties are assigned to DOM elements, they are actively *read* each time a mouse and touch event is triggered. The functions controlling mouse and touch events use these properties to direct: 
 * the choice of `target` (ie. `pointer-events: none;`) and
 * the `defaultAction` of the mouse or touch based gestures (`touch-action: pinch-zoom;`).

## Demo: `pointer-events: none`

```html
<style>
div {
  position: fixed;
}
#a {
  top: 30px;
  left: 30px;
  width: 200px;
  height: 50px;
  border: 6px solid red;

  pointer-events: none;
}
#b {
  top: 130px;
  left: 30px;
  width: 200px;
  height: 50px;
  border: 6px solid green;
}
#c1, #c2 {
  top: 230px;
  left: 30px;
  width: 200px;
  height: 50px;
}
#c1 {
  border: 6px solid blue;
}
#c2 {
  border: 6px solid grey;
  background: rgba(0,0,0,0.2);
  pointer-events: none;
}
</style>

<div id="a">i have "pointer-events: none", it doesn't do anything to click me</div>
<div id="b">pointer-events is a'ok! click me please.</div>
<div id="c1">I'm left behind, but you can still click me</div>
<div id="c2">I'm up front, but I have "pointer-events: none".</div>
<script >
window.addEventListener("click", function(e){
  console.log(e.target);
});
</script>
```

This demo shows us how `pointer-events: none` works. But it doesn't show us:
1. *why* are we adding `pointer-events` via CSS, and not as an HTML attribute?
2. *when* do the function controlling for example `mouse` events *read* the CSS attribute?
3. *how* does it do that, and *what* are the problems associated with *reading* CSS attributes?

We want the details of an EventSequence's state to be readable from JS. To do so, we simply add a global object on the `window`, such as `EventLongPress` and populate it when needed.

## Why control events via CSS?

There are several benefits of controlling events via CSS.  

1. Settings direct element-to-event behavior likely spans several DOM elements.
   * CSS properties cascades. For example, if you say that there should be `pointer-events: none` for a `<div>`, you likely want the same `pointer-events` behavior for all `<span>` and `<h1>` inside that block. HTML attributes don't cascade.
   * CSS properties can be grouped by `class` and other query selectors. This means that if you only want a particular `touch-action` for the images in a list of text and images, similar CSS properties can be grouped by element type and/or class.
   
      Todo: We could add a new example here that shows how pointer-events can be added both via class and cascade.
      
   * Why then the `draggable` attribute? My guess is legacy: `draggable` was fashioned before `pointer-events` and `touch-action` was established; or the task force that made the drag'n'drop interface were less CSS oriented. Whatever the answer, the `draggable` HTML attribute and `pointer-events` CSS property provide two alternative paths to achieve a similar objective: event control.

2. The property that controls an event *doesn't have to be* on the DOM element. It is extra. Like the style properties that CSS also control. The DOM is split into a *absolute and neccessary* HTML structure and an *extra and selective* CSS structure.

   This enables the designer who controls the style and UX to also control the events. And it enables the HTML developer to maintain a clearer and simpler base DOM. It is considered good ergonomy for both small and especially large development projects (however, if the split HTML and CSS in reality was a stroke of genious in this regard, or if it in reality caused as many secondary problems as primary problems it fixed, I for one do not feel certain of.)

## When and how to control events via CSS?
   
But. The benefit of moving the control of events from an HTML attribute (such as `draggable`) and to a CSS property (such as `pointer-events`) also caused a mayor drawback.

The HTML-based DOM with all its **attributes is always up to date**. Whenever a template adds to or script alters the DOM, they always work on the *real* data model. The DOM is always the DOM. This means that whenever the native function that controls the drag'n'drop function needs to check if an element contains the attribute `draggable`, it can just look up in the DOM. No problem. The DOM with all its attributes is *always* updated.

**Not so for CSS properties** such `pointer-events`, and `touch-action`! Precisely *because* these properties can be ascribed DOM elements in a myriad of ways (ie. via CSS classes, other query selectors, and cascade), the function that needs these properties need to check the CSSOM. And the CSSOM is *not* always updated. On the contrary! The CSSOM is preferably only calculated *once* per frame, because which of a myriad of CSS rules apply to which elements, and in what priority, can be heavy and costly.

Thus, the native function that controls mouse and touch events *must* ensure that the CSSOM is up to date when it reads the `pointer-events` and `touch-action` properties. To make sure the CSSOM is up to date, the browser has two choices:
1. native function that handles mouse and touch event must be called *first* after the CSSOM has been calculated for other purposes. Currently, the browser can get away with this because CSS properties only control mouse and touch events, and therefore there is still little competition to be first in this line. 
2. call `getComputedStyle(el)` on the target when the native function that controls pointer or touch events is triggered. If many different types of events could be controlled by CSS properties, this method would have to be used at the start *when* the CSS property is read. Soon we will employ the same pattern to our own custom, composed events, and then we need to consider the cost of `getComputedStyle(el)`.

> When custom CSS properties are used to control custom composed events, there is another problem to consider. Cascation can be turned off on native CSS properties; all custom CSS properties cascade. This means that if you want to add event controls that should *not* cascade, custom CSS properties cannot be used, and you must instead use HTML attributes (cf. the AttributableEvent pattern).

## References

 * [dunno]()