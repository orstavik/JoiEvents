# Event: `dragging`

## `dragging` events and their attributes and properties/custom methods

The following attributes can be added to the elements that should support this custom composed DOM Event.

1. `dragging`: will trigger the following events from the element:
   * `dragging-start`
   * `dragging-move`
   * `dragging-end`
   * `dragging-cancel`

2. `dragging-cancel-leave`: will not fire `dragging-cancel` when the mouse leaves the window.

The following properties are available on the different dragging events:

1. `x` : `dragging-start`, `dragging-move`, `dragging-end`
2. `y` : `dragging-start`, `dragging-move`, `dragging-end`
3. `fling()` : `dragging-end`

## Code

The sequence of [patterns](https://github.com/orstavik/JoiComponents/tree/master/book/chapter11_event_comp) application is marked below.
```javascript
```

## Example 1: Slider
Let's look at an example of a slider that works on the basis of the `drag` events described above.
```html
<div width="300" id="viewport">                                               //[1]
    <div draggable draggable-cancel-mouseout id="frame">                                               //[2]
        <div>First</div>
        <div>Second</div>
        <div>Third</div>
        <div>Fourth</div>
    </div>
</div>

<script>
  let currentLeft = undefined;
  let startX;
  window.addEventListener("dragging-start", e => {                       
    startX = e.x;
    currentLeft = parseInt((e.target.style.transform).substr(10) || 0);       //[3]
  });

  window.addEventListener("dragging-move", e => {
    e.target.style.transform = `translate(${currentLeft + e.x - startX}px)`;  //[4]
  });

  window.addEventListener("dragging-cancel", e => { 
    e.target.style.transform = `translate(${currentLeft}px)`;                //[5]
  });

  window.addEventListener('dragging-stop', (e) => {
    let sliderWidth = parseInt(e.target.parentNode.getAttribute("width"));    //[6]
    let frames = e.target.children.length;                                    //[7]
    let movement = e.x - startX;
    if (Math.abs(movement) < 100)                                             //[8]
      movement = 0;
    else
      movement = (movement > 0 ? sliderWidth : -sliderWidth);
    let newPosition = (currentLeft + movement);
    if (newPosition > 0)                                                      //[9]
      newPosition = currentLeft;
    else if (newPosition <= -sliderWidth * frames)                            //[10]
      newPosition = currentLeft;
    e.target.style.transform = `translate(${newPosition}px)`;
  });

</script>
```
1. Use the custom attribute `width="300"` to set the width of the viewport that we use in the below.
2. Add the attribute `draggable` which marks the element, the position of which we will change using drag events.
3. The idea is to scroll the tape frame in the right direction. For this we need to get the actual value.
By default it is not defined, so when the `drag-start` event is first activated, the it will be equal 0.
4. Slide scrolling begins after the user activates the `drag-move` event. The slide scrolling will occur in accordance with the direction of the horizontal movement of the mouse.
5. In the case of a `cancel` event triggered during mouse movement - the current slide returns to its position, which corresponds to the position when the last` drag-start` event was activated.
6. In order to get the port width value, we use the `getAttribute` method. (Of course, we can also get this value using `getElementById` or `querySelector()`, but since we used other attributes, it was decided to do it that way).
7. To allow you to add any number of frames and not have unnecessary problems, let's just get the length of #frame childrens.
8. If the total length of the horizontal movement during an `drag-move` event is less than 100 pixels, then when the `drag-move` event is activated, the slide will not be switched, but return to the last position, as in step 5.
9. If the user tries to return to the previous slide, being on the first one - the slide will move in the appropriate direction during `drag-move` event. But when you activate the `drag-stop` event, the slide will return to the last position. 
10. Similarly, the last slide.

Try [mouse](https://codepen.io/Halochkin/pen/XOKjBd?editors=1010) or [touch](https://codepen.io/Halochkin/pen/RvRRvK?editors=1010) version on codepen.io
***
## Example 2: Shuffleboard game
Also consider the use of the application fling event on the example of the shuffleboard game.
```html
<h4 id="scores">SCORES: 0</h4>
<div id="outer">
    <div id="inner">                                                                  //[1]
        3
        <hr id="three">                                                               //[1a]
        2
        <hr id="two">
        1
        <hr id="one">
        <div draggable fling-distance="30" id="ball"></div>                            //[2]
    </div>
</div>
<script>
  let element = document.querySelector("#ball");                       
  let playground = document.querySelector("#inner");
  let width = parseInt(getComputedStyle(playground).width);                            //[3]
  let height = parseInt(getComputedStyle(playground).height);                          //[3a]
  let acceleration = 2.5;                                                              //[4]                                       
  let elemX = undefined;                                                               //[5]
  let elemY = undefined;
  let startX = undefined;                                                              //[6]
  let startY = undefined;
  let scores = 0;

  window.addEventListener("dragging-start", e => {
    startX = e.x;                                                                      //[7]
    startY = e.y;
    elemX = parseInt(getComputedStyle(element).left);                                  //[8]
    elemY = parseInt(getComputedStyle(element).top);
    element.style.transition = "all 0.3s cubic-bezier(0.39, 0.58, 0.57, 1)";           //[9]
  });

  window.addEventListener('fling', (e) => {                                            
    element.style.left = (e.trigger.x - startX + elemX) + parseInt(e.detail.distX * acceleration) + "px"; //[10]
    element.style.top = (e.trigger.y - startY + elemY) + parseInt(e.detail.distY * acceleration) + "px";
    let top = parseInt(element.style.top);                                             //[11]
    let left = parseInt(element.style.left);
    if (left < -10 || left >= width || top > height || top < 0) {                      //[12]
      setTimeout(function () {
        alert("ball out of the field");
      }, 300);
      resetBall();                                                                     //[13]
    }

    if (top > 161)                                                                     //[14]
      setScore(0);
    else if (top > 96 && top < 160)
      setScore(1);
    else if (top > 31 && top < 95)
      setScore(2);
    else if (top > 0 && top < 30)
      setScore(3);
    resetBall()
  });

  function setScore(score) {                                                           //[15]
    scores += score;
    document.querySelector("#scores").innerText = "SCORES: " + scores;
  }

  function resetBall() {                                                               //[16]
    setTimeout(function () {
      element.style.transition = undefined;
      element.style.left = "60px";
      element.style.top = "520px";
    }, 1000);
  }

</script>
```
1. Since the game implies a recess along the contour of the playing field, we will add an internal playing field inside the outer frame.
1a. Define marks with scores.
2. Add the ball.
3. Before the start of the game, we get the width and height [3a] of the playing field, at the exit of which points will not be counted
4. Since the event fling implies acceleration of the ball, we add an acceleration factor (distance of the ball).
5. Define the variables that determine the position of the element (ball).
6. As well as the initial coordinates of the movement.
7. When user start an `drag-move` event, the coordinate values will be added to the previously defined variables.
8. Similarly, with the starting position of the ball.
9. Also add the duration of the animation to add smoothness.
10. When activating a fling event, new ball coordinates will be determined based on previously obtained values.
11. Let's define the coordinates from the previous step to a new variable.
12. In order to make sure that the ball has not left the playing field, we will make a simple check.
13. In case the ball has gone beyond the playing field, we will get an alert about the unprotected result, and we will reset the position of the ball.
14. In the case of a successful launch, we calculate the scores, depending on the finishing position of the ball on the playing field.
15. After scoring for the launch, update their value in the scores field.
16. Drop the position of the ball for the next run.

Try [mouse](https://codepen.io/Halochkin/pen/dwroqG?editors=1000) or [touch](https://codepen.io/Halochkin/pen/jdypYq?editors=1100) version on codepen.io
***
### Reference

* [DragEvent](https://developer.mozilla.org/en-US/docs/Web/API/DragEvent)