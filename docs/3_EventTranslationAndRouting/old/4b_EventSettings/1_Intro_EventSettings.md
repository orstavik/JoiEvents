# Intro: EventSettings

The browsers and standard implement many different strategies to control the behavior of events and gestures. These strategies are implemented from *both* HTML template, HTML attributes, CSS properties, CSS pseudo-classes, and JS(!). This variety makes controlling event settings quite complex for the developer, and in this introduction chapter I will therefore run through these strategies and their pros and cons.

## Native


These strategies vary from HTML template (cf. `<map>` and `<area>`), HTML attributes (cf. `onclick`), CSS properties (cf. `pointer-events` and `cursor`), CSS pseudo-classes (cf. `:hover` and `:visited`) and JS (cf. `addEventListener()`, `stopPropagation()`,  Native events and gestures The behavior of native events can be controlled from both HTML, CSS, and JS(!).  First of all, from JS, in event listeners, their propagation, `defaultAction`, appear

There are several strategies one can use to control a gesture and composed event.  CSS, HTML, and JS. Each strategy has its benefits and drawbacks, and in this introducing chapter, we discuss these strategies merits.

## Strategy 1: custom CSS pseudo-class

Events can make their own "Css pseudo classes" like :hover. The only difference is that they are normal classes. With a single dot. 

The events will add them, and then remove them. It can add a class on just the target or the target and all its ancestor elements. There are two problems adding it to the entire target ancestor chain. The first is cost. It will need to alter and recalculate style for lots of elements. So adding a custom CSS pseudo-class to the target's ancestor chain should only be done when truly needed. Second is element conflict. If the `:visited` pseudo-class were added to all ancestors, then if one ancestor included a link that was visited, and another which wasn't visited, then there would be a conflict. 

Some Pseudo-classes, such as `:visited`, should *only* be added to target. Other pseudo-classes, such as `:hover`, should be added to the target and all its ancestors.

## Strategy 2: HTML

There is an old pair of HTML elements whose only purpose is to guide an event: `<map>` and `<area>`. 
```html
<img src="chess.jpg" width="64" height="64" alt="chessboard" usemap="#chessmap">

<map name="chessmap">
  <area shape="rect" coords="0,0,8,8" href="a1.html" alt="A1" title="A1">
  ...
  <area shape="rect" coords="56,56,64,64" href="h8.html" alt="H8" title="H8">
  ...
</map>
```

`<map>` and `<area>` are not visual feedback. They are invisible. And not very popular. And would if created today likely be implemented as CSS properties, not HTML elements. However, they illustrate how HTML elements can be set up whose sole purpose is to declaratively specify event behavior and event feedback (cf. the `title` attribute).

However, to use HTML elements directly to specify visual feedback of an event associated with an element would be slightly less strange than `<map>` and `<area>` which deal with invisible settings for the `click` event. After all, the HTML elements would be visible in certain cases. We can imagine the concept like so:

```html
<div long-press>
  <visual-feedback event="long-press">
    <style>
      @keyframes grow-circle {
        /*some animations*/
      }
      div {
        /*lots of style*/
        animation: grow-circle;
      }
    </style>
    <div style="border-radius: 50%; border-style: dashed;"></div>
  </visual-feedback>
  you can long-press on this element
</div>
```

But, this approach has a drawback. What if you have *two* `<div long-press>`s? What if some elements wished to reuse the same visual feedbacks, some of the time, while others not?

I suspect this is the reason the founding fathers in their new frontier experiments decided to *not* make `<map>` a child of the `<img>` element, but instead link `<img>` and `<map>` via the attributes `usemap` and `name`. Thus, to reuse the visual feedback element on several elements, the visual feedback element must be removed from the main DOM dimension and listed as meta elements on par with `<map>`, `<script>`, `<style>`, `<template>`, etc.

If such an approach were to be taken, the `<template>` tag with an `id` attribute would suffice. Elements needing to specify a custom long-press visual feedback could then simply use another HTML attribute or a CSS variable to reference it, like so:

```html
  <template id="long-press-visual">
    <style>
      @keyframes grow-circle {
        /*some animations*/
      }
      div {
        /*lots of style*/
        animation: grow-circle;
      }
    </style>
    <div style="border-radius: 50%; border-style: dashed;"></div>
  </template>

<div long-press long-press-visual="#long-press-visual">
  you could specify a custom visual feedback in this way
</div>
<div long-press long-press-visual="#long-press-visual">
  reuse it like so
</div>
<div long-press style="--long-press-visual: long-press-visual;">
  or specify it in HTML, and then reference it in CSS like so
</div>
```

Specifying custom event feedback in HTML `<template>` elements, and then reference that piece of template via HTML attributes or CSS properties, would be a good choice.

> Att! A problem with a custom CSS property such as `--long-press-visual`, is that it requires running `getComputedStyle()` on the initial event target element. This could accrue a performance penalty.

## Strategy 3: JS

In HTML 5, the drag'n'drop events enable developers to specify custom visual feedback element for the drag gesture events, using the `.setDragImage()` function accessible from the `dragstart` event:

```javascript
window.addEventListener("dragstart", e=> {
  var img = new Image(); 
  img.src = 'example.gif'; 
  e.dataTransfer.setDragImage(img, 10, 10);
});
```

The `dataTransfer` object is specific to the `drag` gesture, and its implementation. For this discussion, you can safely ignore it. But the concept of:
 1. having a `setVisualFeedback(element)` method
 2. on a gesture start event triggered just prior to the feedback element being shown (ie. added to the DOM)
 3. that will show an alternate feedback element/image for the remainder of the gesture, 
 
is a strong pattern. We call it `StartEvent.setVisualFeedback()` for "short".

The `StartEvent.setVisualFeedback()` can define the visual boilerplate in a `<template>` tag as in strategy 2. However, the developer can also create the visual feedback element from JS in the event listener that captures it. The main difference from strategy 2 is that instead of binding the new visual declaratively via HTML or CSS, strategy 3 would bing the new visuals to an ongoing sequence of events in an event listener. This would mean that the developer would manage an event's bells and whistles imperatively in JS, in the same place as he/she would manage the app's (state's) reactions to the same event. In my opinion, this would not complicate the HTML nor CSS in ways developers would find convoluted; it would be more familiar for developers to manage these visual changes reactively in JS, rather than proactively in HTML/CSS only.

The consequence of `StartEvent.setVisualFeedback()` strategy is that a start event at the beginning of the gesture must always be exposed to the system outside of the composed event. However, this could be considered good housekeeping, as a developer might otherwise need this start event for other and similar purposes that you, the developer of the composed event, do not foresee.

## Conclusion

As a general solution to allow developers to set their own visual feedback element, the `StartEvent.setVisualFeedback()` is the best. It requires good housekeeping in gesture events, ie. that a start event be dispatched upon where the developer can add the altered visual.

If the visual feedback for an event should be fixed to only one in a group (cf. `cursor: crosshair`), then using a custom CSS property would be best. However, this use-case, establishing a fixed group of feedback symbols is not considered very relevant.

## Demo: `long-press` squared

In this demo, we return to our naive `long-press` event from the previous chapter. We extend it with a) `long-press-start` event that b) contains a `setVisualFeedback()` method. The `setVisualFeedback()` will replace the builtin feedback element with an alternative version for the current gesture.

The `long-press-setvisual` composed event:

```javascript
(function () {

  const builtinFeedbackElement = document.createElement("div");
  builtinFeedbackElement.classList.add("long-press-feedback-ring");
  builtinFeedbackElement.innerHTML = `
<style>
.long-press-feedback-ring {
  position: fixed; 
  z-index: 2147483647; 
  pointer-events: none; 
  margin: -7px 0 0 -7px;
  box-sizing: border-box;
  width: 10px; 
  height: 10px; 
  border-radius: 50%; 
  animation: long-press 300ms forwards;
}
@keyframes long-press {
  0% {
    transform: scale(0);
    border: 1px solid rgba(9, 9, 9, 0.1); 
  }
  99% {
    transform: scale(2);
    border: 1px solid rgba(9, 9, 9, 0.1); 
  }
  100% {
    transform: scale(2);
    border: 4px double rgba(9, 9, 9, 0.1);
  }
}
</style>`;

  var feedbackElement;

  function addVisualFeedback(x, y){
    const style = feedbackElement.style;
    style.left = x + "px";
    style.top = y + "px";
    style.animationDuration = "300ms";
    document.body.appendChild(feedbackElement);    
  }
  
  function removeVisualFeedback(){
    document.body.removeChild(feedbackElement);    
  }
  
  function isInside(start, stop){
    const x = stop.clientX - start.clientX;
    const y = stop.clientY - start.clientY;
    return (x * x + y * y) < 81;
  }
  
  function dispatchPriorEvent(target, composedEvent, trigger) {
    composedEvent.preventDefault = function () {
      trigger.preventDefault();
      trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
    };
    composedEvent.trigger = trigger;
    return target.dispatchEvent(composedEvent);
  }

  var primaryEvent;

  function onMousedown(e) {                                 
    if (e.button !== 0)                                     
      return;
    primaryEvent = e;                                       
    window.addEventListener("mouseup", onMouseup, true);
    feedbackElement = builtinFeedbackElement;
    let longPressStart = new CustomEvent("long-press-start", {bubbles: true, composed: true});
    longPressStart.setVisualFeedback = function(el){
      feedbackElement = el;
    };
    dispatchPriorEvent(e.target, longPressStart, e); 
    addVisualFeedback(e.clientX, e.clientY);
  }

  function onMouseup(e) {                                   
    var duration = e.timeStamp - primaryEvent.timeStamp;
    //trigger long-press iff the press duration is more than 300ms ON the exact same mouse event target.
    if (duration > 300 && isInside(primaryEvent, e)){                                    
      let longPress = new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration});
      dispatchPriorEvent(e.target, longPress, e); 
    }
    primaryEvent = undefined;                               
    window.removeEventListener("mouseup", onMouseup, true);
    removeVisualFeedback();
  }

  window.addEventListener("mousedown", onMousedown, true);  
})();
```

In HTML

```html
<script src="demo/naive-long-press-setvisual.js"></script>
<template id="heart">
<div class="long-press-heart">&#9829
<style>
.long-press-heart {
  position: fixed; 
  z-index: 2147483647; 
  pointer-events: none; 
  margin: -7px 0 0 -7px;
  box-sizing: border-box;
  width: 10px; 
  height: 10px; 
  border-radius: 50%; 
  animation: long-press 300ms forwards;
  color: rgba(0,0,0,0);
  -webkit-text-stroke: 1px rgba(0,0,0,0.1); 
}
  @keyframes long-press {
  0% {
    font-size: 0px;
    -webkit-text-stroke: 1px rgba(0,0,0,0.1); 
  }
  99% {
    font-size: 30px;
    margin: -18px 0 0 -10px;
    -webkit-text-stroke: 1px rgba(0,0,0,0.4); 
  }
  100% {
    font-size: 30px;
    margin: -18px 0 0 -10px;
    -webkit-text-stroke: 2px rgba(255,0,0,0.4); 
  }
}
</style>
  </div>
</template>
<div>press me</div>
<script >
  const feedbackEl = document.querySelector("#heart").content.children[0].cloneNode(true);
  document.addEventListener("long-press-start", e => {e.setVisualFeedback(feedbackEl)});  
  window.addEventListener("long-press", e => {console.log(e)});  
</script>
```


## References

 * []()

