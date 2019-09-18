# Pattern: BlindManDom

> Even when you know *nothing* about the DOM, you can still *add* to it, *temporarily*.

The composed event implementation behind the gesture does not know anything about the state of the DOM. Except that it exists. Still, the VisualFeedback pattern needs to add something to the DOM in order to show it. And this something must behave consistently in all situations. So, how to do that?
 
1. The DOM *always* has a main `document`, and the main `document` *always* has one `<body>` element. Thus, the feedback element can be appended this `<body>` element. The feedback element can be added when the gesture is activated (or surpasses a particular threshold in the gesture state); it can be updated and mutated during the active gesture if need be; and it can be removed when the gesture ends.
 
2. The feedback element is given `position: fixed` with a set of coordinates and dimensions relevant for the gesture. This ensures that the positioning of the feedback element can be adjusted to the state data (including the HTML `target` element), and is not influenced by the DOM context.
 
3. The feedback element is given the `z-index: 2147483647` value. 2147483647 is the maximum z-index value (please, prove me wrong! :), and this `z-index` combined with the feedback elements position as last on the main `document` ensures that the feedback element is displayed in all situations.
 
4. The feedback element has `pointer-events: none`. This makes the feedback element invisible for touch and mouse interaction. Any BlindManDom element should do this, so the visual feedback doesn't conflict with any ongoing user interaction.

These properties can be put together in a layer element (ie. a `<div>`).

We will later work with visual elements being passed into an EventSequence from outside. The EventSequence might need to alter the position of these visual elements. However, setting the position on an HTMLElement passed in from another context can cause conflicts: the outer context might accidentally overwrite properties from the EventSequence, or vice versa. Thus, the BlindManDom layer should position the layer element, and not the content of the layer element. To achieve this effect, two sets of other CSS properties are added to the BlindManDom layer element:
 * `left`, `top`, `right`, `bottom`, and
 * `overflow: visible`

## Implementation

```javascript
  const blindManDomLayer = document.createElement("div");
  blindManDomLayer.style.position="fixed";
  blindManDomLayer.style.zIndex= 2147483647;
  blindManDomLayer.style.pointerEvents= "none";
  blindManDomLayer.style.overflow = "visible";
  // blindManDomLayer.style.left = 20px;
  // blindManDomLayer.style.top = 20px;
```

## Demo: BlindManDom

```html
<h1>Hello sunshine</h1>
<p>You can test that no clicks can be performed on the orange circle that is added in a BlindManDom layer.</p>
<script>
  //1. create a BlindManDom layer
  const blind = document.createElement("div");
  blind.style.position="fixed";
  blind.style.zIndex= 2147483647;
  blind.style.pointerEvents= "none";
  blind.style.overflow = "visible";

  //2. create an element to be displayed in the BlindManDom layer
  const ring = document.createElement("div");
  ring.style.width = "10px";
  ring.style.height = "10px";
  ring.style.borderRadius = "50%";
  ring.style.border = "3px solid red";
  ring.style.backgroundColor = "orange";

  const body = document.querySelector("body");

  setInterval(function () {
    //2. when a state change occurs, update the BlindManDom
    blind.style.left = Math.random() * 20 + 20 + "px";
    blind.style.top = Math.random() * 20 + 20 + "px";

    //3. append/remove a) the visual element to the blindManDomLayer, and
    //                 b) the blindManDomLayer on the body
    //   as needed.
    if (blind.isConnected) {
      body.removeChild(blind);
      blind.removeChild(ring);
    } else {
      blind.appendChild(ring);
      body.appendChild(blind);
    }
  }, 2000);

  window.addEventListener("click", e => console.log(e.target.tagName));
</script>
``` 

In the demo above, you see an element added and removed from above the Hello sunshine header every two seconds. This element cannot be clicked, you will never see a `DIV` in the console.

## References

 * []()

