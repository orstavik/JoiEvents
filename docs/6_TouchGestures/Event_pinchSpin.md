# Event: `pinch`

## `pinch` events and their attributes and properties/custom methods

1. `pinch`: will trigger the following events from the element:
   * `pinch-start`
   * `pinch-move`
   * `pinch-end`
   * `pinch-cancel`

The following properties are available on the different pinch events:

1. `pageX` : `pinch-start`, `pinch-move`, `pinch-end`,`pinch-cancel`
2. `pageY` : `pinch-start`, `pinch-move`, `pinch-end`,`pinch-cancel`
3. `spin()` : `pinch-end`

spin() includes the following custom details:

1. `spinStart`: the event that started the swipe gesture
2. `distX` : horizontal distance between active fingers
3. `distY` : vertical distance
4. `distDiag` : diagonal distance
5. `durationMs` : duration of the swipe event
6. `angle` : angle between fingers
 
 ***

## Example 1: Scalable element

Let's look at a simple but very useful example that allows you to change the block size using a `pinch` event.
```html
<div id="elem" pinch></div>                                                  
   
<script>
  let element = document.querySelector("#elem");                                                                                         
  let f1;
  let f2;
  let x1;
  let y1;
  let x2;
  let y2;
  let height;
  let width;
  let startDiagonal;                                                              //[1]

  window.addEventListener("pinch-start", e => {                            
    f1 = e.trigger.targetTouches[0];
    f2 = e.trigger.targetTouches[1];
    x1 = f1.pageX;
    y1 = f1.pageY;
    x2 = f2.pageX;
    y2 = f2.pageY;
    width = Math.abs(x2 - x1);
    height = Math.abs(y2 - y1);
    startDiagonal = Math.sqrt(width * width + height * height);                   //[2]
  });
 
  window.addEventListener("pinch-move", e => {
    element.style.transform = `scale(${e.detail.diagonal / startDiagonal})`;      //[3]
  });
</script>
```
1. Declare a variable in which will be store the value of the distance between the fingers.
2. Determine the distance between the touch points, provided that both are active and caused a pinch-start event.
3. At the beginning of the movement we get the zoom factor of the element.

Try it on [codepen.io](https://codepen.io/Halochkin/pen/wRbxbj);
***
## Example 2: Wheel of fortune
```html
<div pinch draggable id="circle">                                     //[1]
    <div class="color"></div>
    <div class="color"></div>
    <div class="color"></div>
    <div class="color"></div>
</div>
<div id="arrow"></div>                                                //[2]

<script>

  let element = document.querySelector("#circle");
  let arrow = document.querySelector("#arrow");
  let rotation;

  window.addEventListener("spin", e => {                              //[3]
    rotation = parseInt(e.detail.rotation);
    checkFunc(rotation);
    element.style.transform = `rotate(${rotation}deg)`;
    });

  function checkFunc(rotation) {                                      //[4]
    if (rotation > 5 && rotation < 79) arrow.style.borderBottom = `70px solid aqua`;
    else if (rotation > 80 && rotation < 169) arrow.style.borderBottom = `70px solid tomato`;
    else if (rotation > 170 && rotation < 259) arrow.style.borderBottom = `70px solid green`;
    else if (rotation > 260 && rotation < 349) arrow.style.borderBottom = `70px solid yellow`;
  }
</script>

```
1. Add a circle divided into 4 parts.
2. And also, a triangle that will change color, depending on the fourth circle, which will be the closest after rotation.
3. Add an event listener for a spin event. Using the details of the event we get the rotation value.
4. The function checks the rotation value and changes the color of the triangle, depending on the angle.

Try it on [codepen.io](https://codepen.io/Halochkin/pen/mvWQKa)

### Reference
* [Pinch](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures)
