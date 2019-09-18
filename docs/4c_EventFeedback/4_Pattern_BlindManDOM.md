# Pattern: BlindManDOM

> Even when you know *nothing* about the DOM, you can still *add* to it, *temporarily*.

The composed event implementation behind the gesture does not know anything about the state of the DOM. Except that it exists. Still, the VisualFeedback pattern needs to add something to the DOM in order to show it. And this something must behave consistently in all situations. So, how to do that?
 
1. The DOM *always* has a main `document`, and the main `document` *always* has one `<body>` element. Thus, the feedback element can be appended this `<body>` element. The feedback element can be added when the gesture is activated (or surpasses a particular threshold in the gesture state); it can be updated and mutated during the active gesture if need be; and it can be removed when the gesture ends.
 
2. The feedback element is given `position: fixed` with a set of coordinates and dimensions relevant for the gesture. This ensures that the positioning of the feedback element can be adjusted to the state data (including the HTML `target` element), and is not influenced by the DOM context.
 
3. The feedback element is given the `z-index: 2147483647` value. 2147483647 is the maximum z-index value (please, prove me wrong! :), and this `z-index` combined with the feedback elements position as last on the main `document` ensures that the feedback element is displayed in all situations.
 
4. The feedback element has `pointer-events: none`. This makes the feedback element invisible for touch and mouse interaction. Any BlindManDOM element should do this, so the visual feedback doesn't conflict with any ongoing user interaction.

## BlindManWebComp

To add a BlindManDOM element requires adding both the visual element itself, such as a `<div>`, and the style for that visual element, ie. a `<style>` element. Furthermore, you don't want this style to temporarily bleed into the rest of the DOM, and for other styles in the DOM to bleed into your BlindManDOM element. Thus, setting up the BlindManDOM element as a web component is a good fit.

## Demo: FlashyRing

```html
<script>

  //1. create a BlindManDOM layer
  const blindManDomLayer = document.createElement("div");
  blindManDomLayer.style.position="fixed";
  blindManDomLayer.style.zIndex= 2147483647;
  blindManDomLayer.style.pointerEvents= "none";

  class FlashyRing extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: "open"});
      this.shadowRoot.innerHTML = `
<style>
:host {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 3px solid red;
}
</style>
      `;
    }
  }

  customElements.define("flashy-ring", FlashyRing);
</script>
<h1>Hello sunshine</h1>

<script>
  const flashyRing = new FlashyRing();
  flashyRing.style.backgroundColor = "orange";

  const body = document.querySelector("body");

  setInterval(function () {
    //2. when a state change occurs, update the BlindManDOM
    blindManDomLayer.style.left = "10px";
    blindManDomLayer.style.top = "10px";
        
    //3. create a visual element to be placed in the BlindManDOM
    
    blindManDomLayer.appendChild(flashyRing);
    blindManDomLayer.isConnected ?
      body.removeChild(blindManDomLayer) :
      body.appendChild(blindManDomLayer);
  }, 2000);

  document.querySelector("h1").addEventListener("click", e => console.log(e.target.innerText));
</script>
``` 
In the demo above, you see an element added and removed from above the Hello sunshine header every two seconds. This element cannot be clicked, and its inner style doesn't bleed into the main document, while it can also be styled from outside when needed.

## References

 * []()

