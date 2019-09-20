## `touchover` / `touchleave` / `touch-cancel` composed events
As you know, there are many ways to change the styles of an element when hovering. But unfortunately they are all created for the mouse. But what about touch events? Why are they ignored? In order to restore justice, a `touch-hover` composed event was created. 

Presented function implements two composed events:
* `touch-hover` - is activated whenever a touch point or mouse appears over the item.
* `touch-leave` - is activated whenever a touch point is moved to a new target.
* `touch-cancel` - is activated whenever the event was interrupted (e.g. by an alert message).
* `click` - will dispatch a "click" event on the element if the user lifts his touch finger on that element.

These events based on `touchstart`, `touchmove` and `touchend` events. In order to get the element over which the movement occurs, using `.elementFromPoint(touch.clientX, touch.clientY)` method, which returns the element at the specified coordinates (relative to the viewing window). 

There are two custom attributes to control events:
1. `touch-hover` - indicates that `touch-hover` event will occur when a touch point hover element.
2. `touch-hover="click"` - when lifting the touch point, `click` event will be activated (convenient for elements with references)

### Implementation
```javascript
 (function () {

    var supportsPassive = false;                                           
    try {
      var opts = Object.defineProperty({}, 'passive', {
        get: function () {
          supportsPassive = true;
        }
      });
      window.addEventListener("test", null, opts);
      window.removeEventListener("test", null, opts);
    } catch (e) {
    }
    var thirdArg = supportsPassive ? {passive: false, capture: true} : true;     //[4]

    var relatedTarget = undefined;
    var initialUserSelect = undefined;

    function findParentWithAttribute(node, attName) {                            //[2]
      for (var n = node; n; n = (n.parentNode || n.host)) {
        if (n.hasAttribute && n.hasAttribute(attName))
          return n;
      }
      return undefined;
    }

    function dispatchTouchHover(target, name) {                                  //[7]
      setTimeout(function () {
        target.dispatchEvent(new CustomEvent("touch-" + name, {bubbles: true, composed: true}));
      }, 0);
    }

    function getTarget(e) {                                                      //[2]                          
      var finger = e.touches[0];
      var target = document.elementFromPoint(finger.clientX, finger.clientY);
      return findParentWithAttribute(target, "touch-hover");                    
    }

    function onTouchmove(e) {                                                    //[5]
      e.preventDefault();                                                        
      let touchHoverTarget = getTarget(e);
      if (touchHoverTarget === relatedTarget)
        return;
      if (relatedTarget)
        dispatchTouchHover(relatedTarget, "leave");
      relatedTarget = touchHoverTarget;
      if (touchHoverTarget)
        dispatchTouchHover(touchHoverTarget, "hover");
    }

    function end() {                                                             
      setBackEventListeners();                                                  //[9]
      if (!relatedTarget)
        return;
      dispatchTouchHover(relatedTarget, "leave");                      
      if (relatedTarget.getAttribute("touch-hover") === "click")
        setTimeout(relatedTarget.click.bind(relatedTarget), 0);                //[10]    
      relatedTarget = undefined;
    }

    function cancel() {                                                        //[11]  
      setBackEventListeners();
      if (!relatedTarget)
        return;
      dispatchTouchHover(relatedTarget, "leave");
      dispatchTouchHover(relatedTarget, "cancel");
      relatedTarget = undefined;
    }

    function setBackEventListeners() {                                           //[9]
      document.removeEventListener("touchmove", onTouchmove, thirdArg);
      window.removeEventListener("blur", cancel);
      document.removeEventListener("touchend", end);
      document.removeEventListener("touchstart", cancel);
      document.addEventListener("touchstart", start);
      document.addEventListener("touchend", start);                                 
      document.children[0].style.userSelect = initialUserSelect;                
      initialUserSelect = undefined;
    }

    function setupActiveListeners() {                                             //[3]
      document.removeEventListener("touchend", start);
      document.removeEventListener("touchstart", start);
      document.addEventListener("touchend", end);
      document.addEventListener("touchstart", cancel);
      window.addEventListener("blur", cancel);
      document.addEventListener("touchmove", onTouchmove, thirdArg);              //[4]
      initialUserSelect = document.children[0].style.userSelect;                  //[6]
      document.children[0].style.userSelect = "none";                          
    }

    function start(e) {                                                           
      if (e.touches.length !== 1)
        return;
      let touchHoverTarget = getTarget(e);                                        //[2]
      if (!touchHoverTarget)
        return;
      // e.preventDefault();
      // see problem 2:
      // the start listeners are not passive, to prevent them making the scroll behavior laggy?
      setupActiveListeners();                                                     //[3] 
      dispatchTouchHover(touchHoverTarget, "hover");                              //[7]
      relatedTarget = touchHoverTarget;                                           //[8]
    }

    document.addEventListener("touchstart", start);                               //[1]               
    document.addEventListener("touchend", start);                                 //[1]
  })();
```
1. Initial event listeners for both `touchstart` and `touchend` events which call `start(e)`. they are not passive,
to prevent them making the scroll behavior laggy. This means that scrolling and context menu default actions can enter
before we start our activities, which will block our activities. To avoid conflicts with a activities blocking **add touch-action none at the appropriate place**
2. `getTarget()` checks whether the `touchstart` event starts on the target, with the `touch-hover` attribute. To avoid scrolling prevention, in the case if start event starts from another node. The `findParentWithAttribute` function checks if there is a `touch-hover` attribute on the element.
3. After a sucessful start `setupctiveListeners()` removes initial event listener of the `start()` and add new listeners. 
Then added new event listener for `end()` which allows dispatch `touch-leave` event in the case if `touchend` event will be activated.
In the case if `touchstart` event will be activated one more time or alert event will be shown `touch-cancel` event will be dispatch. 
4. In order to be able to pre-turn the default action for the `touchmove` event, used the value of `thirdArg`, which will  set `passive = false` property in the case if it is possible.
5. Each time a 'touchmove' event is activated, `onTouchmove(e)` prevents default action and checks the target over which the event occurred. In order to dispatch a `touch-leave` event each time a touch point is moved to a new target, a check has been added that compares the new target to the current target. If they are not equal, it means that the touch point has moved to a new target and `touch-leave` event dispatch. When it is moving over current trget, the `touch-hover` event dispatch.
6. To prevent the text from being scrolled, disable this feature for the duration of the `touch-hover` gesture.
In order not to cause side effects, let's save the value of the `userSelect` property, which was at the time of execution in the variable `initialUserSelect` to restore it at the end of the gesture.
7. If the previously added event listener has not been activated, `touch-hover` event will be dispatch. 
8. To make sure that the `touch-leave` event will only be dispatch after `touch-hover` event, added `relatedTarget` variable which store the target from the point 2.
9. When `end()` is activated, `setBackEventListeners()` will be called to remove the active event listeners and add the initial event listeners for the next gesture activation.
10. If the target has `touch-hover="click"` attribute value, `click` event will be dispatch.
11. If an event is cancelled (e.g. an alert message), the active event listener will also be deleted. Provided the cancellation event occurred on an existing target both `touch-leave` and `touch-cancel` events will be dispatch.
<hr>
Both `touch-hover` and `touch-cancel` events are bubbles, so the event listener can be attached to the window.
```javascript
 window.addEventListener("touch-hover", function (e) {
   //stuff here
});
 
 window.addEventListener("touch-leave", function (e) {
   // and here too
  });
  
window.addEventListener("touch-cancel", function (e) {
   // other stuff here
});

window.addEventListener("click", (e) => {
   // if touch-hover="click" attribute was added, or will be done manually
  });
```

### Example
Let's consider a simple example that changes the background colors when hovering the mouse or touch point.
```html
<script src="https://unpkg.com/touchover@1.0.0/src/touchover.js"></script>

<a touch-hover="click" href="https://www.bbc.com/news">What's new?</a>  //[1]
<h1 touch-hover="click">touchover too</h1>
<h1 touch-hover="click">I am touchover too</h1>
<h1 touch-hover>touchover again</h1>                                    //[2]
<h1>I will not touchover</h1>                                           //[3]

<script>
  window.addEventListener("touch-hover", function (e) {
    e.target.style.backgroundColor = "yellow";                          //[4]
  });
  window.addEventListener("touch-leave", function (e) {
    e.target.style.backgroundColor = "pink";                            //[5]
  });
  window.addEventListener("click", (e) => {
    e.target.style.backgroundColor = "orange";                          //[6]
  });
  window.addEventListener("touch-cancel", function (e) {
    e.target.style.backgroundColor = "lightgreen";                      //[7]
  });
</script>

<style>
    [touch-hover="click"] {
      touch-action: none;                                               //[8]
    }
</style>
```
***
1. It is necessary to add `touch-hover="click"` attribute for elements, after hover of which the automatic click() will be activated when removing the touch point.
2. If there is no need to automatically click(), then an empty `touch-hover` attribute must be inserted.
3. Make sure the event doesn't work without an attribute.
4. When activating the `touch-hover` event, the target background will become yellow.
5. Moving the touch point to a new target will change the target's background to pink.
6. If there is `touch-hover="click"` attibute, when touch point will be lifted from the target, `click` event will be dispatch. Or it can be activated manually.
7. If the event is canceled, the background will be changed to lightgreen.
8. As mentioned in the description to the function, in order to avoid conflicts, it is necessary to add `touch-action: none` CSS property to the appropriate place.


Try it on [codepen](https://codepen.io/Halochkin/pen/YMMooY?editors=1000).

### Discussion
#### 1.Should touch and mouse have different cancel events?
Yes, definitely, because we can't initiate `cancel-event` if the touch point goes beyond the scope of the document, but we can do it for the mouse. For the event mouse, there are several events that can be used to cancel (`mouseleave`, `mouseout`).

#### Is it better/necessary for performance to initiate the cancel event listeners from within a touch or mouse gesture? Or can it be global and independent? (ie. is it a penalty for always listening for blur?)



### Reference 
1. [MDN: .elementFromPoint(x, y)](https://developer.mozilla.org/en-US/docs/Web/API/DocumentOrShadowRoot/elementFromPoint)
2. [MDN: Event.target](https://developer.mozilla.org/en-US/docs/Web/API/Event/target)
