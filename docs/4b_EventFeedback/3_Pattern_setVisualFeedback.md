# Pattern: setVisualFeedback

There is not a single use-case for setting the visual feedback. A developer might need to set the visual feedback for:
1. all events,
2. all events on a certain type of elements,
3. some events, depending on the state of the app.

## Strategy 1: CSS

Use-case 1 and 2 would best be accomplished in CSS. CSS already enables setting visual feedback for different elements such as changing the mouse cursor icon, e.g. `cursor: crosshair`.

Use-case 3 can also be accomplished via CSS. If the developer reflect the application state in the DOM via attributes or classes on relevant elements, CSS rules could be selected depending on app state. 

But, there are two counter arguments against using CSS to set visual feedback:

1. CSS mainly support choosing between pre-existing template: the `cursor` property only let the developer choose one of a set of pre-existing icons. CSS doesn't support declaring additional HTML template: the only(?) CSS property that enable developers to add content to the DOM from CSS, ie. `content: "some text"`, is both very limited (it only allows text content) and messy (conceptually, CSS comes *after* HTML template, and thus should not itself *add* HTML template to the DOM). This makes CSS a bad choice if the developer wishes to add complex custom visual feedback, which it definitively will be.

2. Most developers think about events with their JS thinking-hat on. They "process" events with event listeners, and then in the JS code inside the event listener a) check to see if the app/DOM is in a certain state, and if so b) add some bells and whistles. Although similar objectives can be accomplished declaratively in the reverse order, by first reflecting the app state in the DOM as classes and attributes, and then declaratively turn on/off bells and whistles in CSS based on those attributes/classes, event processing most often require a) manipulation of application state (which needs JS 95% of the time) and b) heavier DOM manipulation, which might not easily lend itself to declarative programming.

Thus, CSS is not well suited to setVisualFeedback. VisualFeedback elements are likely small bits of HTML template that include custom style and elements. Furthermore, the developer would likely consider a CSS solution for setVisualFeedback as convoluted and strange.

CSS is therefore considered a bad place to control the more complex template needed for custom visual feedback.

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

Start with `StartEvent.setVisualFeedback()`. If highly desirable, implement a custom CSS property `--event-name-visuals: templateId`. In my hitherto opinion, the JS strategy suffices and I will therefore adhere to it.

## Demo: `long-press` squared

In this demo, we return to our naive `long-press` event from the previous chapter and extend it with a) `long-press-start` event that b) contains a `setVisualFeedback()` method. The `setVisualFeedback()` will replace the builtin feedback element with an alternative version.

```javascript
(function () {
  const builtinFeedbackElement = document.createElement("span");
  feedbackElement.innerHTML = `
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
</style>
<div class="long-press-feedback-ring"></div>`;

  function addVisualFeedback(x, y){
    feedbackElement.children[1].style.left = x + "px";
    feedbackElement.children[1].style.top = y + "px";
    document.body.appendChild(feedbackElement);    
  }
  
  function removeVisualFeedback(){
    feedbackElement.remove();    
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
  var feedbackElement;

  function onMousedown(e) {                                 
    if (e.button !== 0)                                     
      return;
    primaryEvent = e;                                       
    window.addEventListener("mouseup", onMouseup);
    feedbackElement = builtinFeedbackElement;
    let longPressStart = new CustomEvent("long-press-start", {bubbles: true, composed: true, detail: duration});
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
    window.removeEventListener("mouseup", onMouseup);
    removeVisualFeedback();
  }

  window.addEventListener("mousedown", onMousedown, true);  
})();
```

In HTML

```html
<script src="demo/naive-long-press-setvisual.js"></script>
<template>
<div class="long-press-heart"></div>
<style>
.long-press-heart {
  color: rgba(0,0,0,0);
  -webkit-text-stroke: 1px red; 
}
</style>
</template>
<a href="https://elizabethwarren.com/">Try to click me quick</a>
<hr>
<a href="https://time.com/5622374/donald-trump-climate-change-hoax-event/">The right thing to do is to press me hard and long</a>
<script >
  window.addEventListener("long-press", e => {e.preventDefault(); console.log(e)});  
</script>

```


## References

 * []()

