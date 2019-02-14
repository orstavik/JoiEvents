# HowTo: drag-n-drop

The native gesture drag-n-drop is supported by the following browsers...

Is it a polyfill??

## What is the native `drag` event?

[`drag-and-drop`](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API) is a 
This is a native gesture/native DOM Event.
To activate it, one must add an HTML attribute `draggableSection="true"`.
It is a good native event, but it is hard to control the visuals of this event.

tomax find some good reviews/critiques of this native gesture

## Why make a custom dragging event?

Create a `drag` event that:
1. is easier to control.
2. has more methods, such as `fling()`
3. that maps `.preventDefault()`
4. can be controlled via HTML attributes

##  `drag` event is a killing machine
In the world of Web browsers, all browser events are very well brought up and interact very well. They allow you to listen to several different events at the same time, without worrying that they will “speak” at the same time, making it difficult for you to listen to several events at the same time.

```javascript
 window.addEventListener("mousemove", function (e) {
    console.log("Event one said: mousemove");
  });

  window.addEventListener("keypress", function (e) {
    console.log("Event two said: keypress");
  });

  window.addEventListener("mousedown", function (e) {
    console.log("Event three said: mousedown");
  });
  ```
 But there are exceptions in everything. I think that you have already guessed, that there is an event that breaks the wonderful world of uplifting, bringing discord and chaos.<br>
 This is a native `drag` event. The peculiarity of this event is that it completely blocks the wiretapping of other events, taking all attention to itself. And even after the end of the drags of the event, there are no traces of those events that attempted to interrupt the drags of the event, in an attempt to restore the previous order. Therefore, a drag event can be called a killing machine for other events.
  Consider a simple example that summarizes the number of activations of different types of events.
  
```html 
<div id="mousescore"></div>
<div id="dragscore"></div>
<div id="draggable" draggable="true">Drag me</div>

<script>

  let element = document.querySelector("#draggable");
  let mousescore = document.querySelector("#mousescore");
  let dragscore = document.querySelector("#dragscore");
  let mousecounter = 1;
  let dragcounter = 1;
  
  window.addEventListener("mousemove", function (e) {        //[1]
    mousescore.textContent = "mousemove: " + mousecounter++; //[2]
  });

  element.addEventListener("drag", function (e) {            //[3]
    dragscore.textContent = "drag: "+ dragcounter++;
  });

</script>
``` 
1. For greater clarity, add `mouemove` event listener for the whole window;
2. Each time when event will be active it increase counter;
3. Now add an event listener for the `drag` event.

Make sure that `mousemove` event is not activated simultaneously with the `drag` on [codepen](https://codepen.io/Halochkin/pen/RvBeLr)

## References

 * [layout problems with HTML5 drag'n'drop](https://kryogenix.org/code/browser/custom-drag-image.html)
 * [Native `Drag` event](https://developer.mozilla.org/en-US/docs/Web/Events/drag)
                                                                            
