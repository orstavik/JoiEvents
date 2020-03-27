# WhatIs: `<button type="submit">`?

`<button type="submit">` and `<input type="submit">` are more or less identical elements. When the two elements behave the same, we will describe their behavior as using `<button type="submit">` element. When `<input type="submit">` differs from `<button type="submit">`, we will highlight this.

The `<button type="submit">` element is a button to submit a form. To put text on the button, you add it as a text node child: `<button type="submit">Click here!</button>`. To add text to an `<input type="submit">`, the `value` attribute is used: `<input type="submit" value="Click here!">`. 

A third alternative to create a submit button is the `<input type="image" src="...">`. This creates a submit button with the same behavior as the `<button type="submit">` and the `<input type="submit">`, but with an image to replace the normal button presentation.

## Demo: `<button type="submit">`

```html
<form>
  <input type="submit" value="Click me!">
  
  <button type="submit">
    hello 
    <a href="#sunshine">sunshine</a>
    and 
    <span tabindex="0">blue skies!</span>
  </button>
  
  <a href="#world">
    <button type="submit">hello</button>
    world
  </a>
  
  <input type="image" src="https://via.placeholder.com/150" width="50">
  
</form>
<script>
  window.addEventListener("submit", e => e.preventDefault());

  window.addEventListener("keydown", e => console.log(e.type, e.target.tagName, e));
  window.addEventListener("keypress", e => console.log(e.type, e.target.tagName, e));
  window.addEventListener("click", e => console.log(e.type, e.target.tagName, e));
  window.addEventListener("submit", e => console.log(e.type, e.target.tagName, e));
</script>
```

## The default action of `<button type="submit">`

The default action of `<button type="submit">` is to submit a parent `<form>`. Which translates to calling `requestSubmit(theButtonElement)` on the parent `.form` of the submit button. The default action is triggered by a user-driven `click` event. If there is no `click` event, then there will be no submitting of the form from that button.

But. From the user perspective, there is another way to trigger a submit button.
1. Use the "tab" key to focus on the submit button.
2. Press enter.

For `<button>` and `<input type="submit">` the "enter" `keypress` event is translated to a `click` event dispatched on the submit element. This "enter-keypress-to-click" translation produce a `click` event that `isTrusted=true` that `target` the submit element.

It is worth noting that the "enter-keypress-to-click" is a default action. This means that the "enter" `keypress` event is only translated into a `click` event iff a) no other default action have been associated with the `keypress` event that b) target another element nearer the `keypress` `target`, ie. lower in the propagation path.

Other elements such as `<select>` and `<input type="reset">` has the same "enter-keypress-to-click" default action. The `<a href>` element has a very similar default action that also translates "enter-keypress-to-click", however the `<a href>` element associate this action with the `keydown` event, not the `keypress` event, for some legacy reason.
 
For other `<input>` elements, such as `<input type="text">`, `<input type="radio">` and `<input type="checkbox">`, the `keypress` enter is translated directly into a `requestSubmit()` call on their parent `<form>`: "press-enter-to-submit".  

## Demo: `<submit-button>`

```html
<script src="../../1d3_defaultAction/demo/addDefaultAction.js"></script>

<script>
  (function () {
    class SubmitButton extends HTMLElement {

      static get observedAttributes() {
        return ["value"];
      }

      constructor() {
        super();
        const shadow = this.attachShadow({mode: "closed"});
        shadow.innerHTML = `<span tabindex="0" style="background-color: lightgrey; border: 1px solid grey; margin: 2px; width: 250px; height: 1.2em;"><slot></slot></span>`;
        this._innerDiv = shadow.children[0];
      }

      get value() {
        return this._innerDiv.innerText;
      }

      set value(newValue) {
        this._innerDiv.innerText = newValue;
      }

      get form() {
        for (let parent = this.parentNode; parent instanceof HTMLElement; parent = parent.parentNode) {
          if (parent instanceof HTMLFormElement)
            return parent;
        }
      }

      set form(ignore) {
        //ignore
      }

      attributeChangedCallback(name, oldValue, newValue) {
        if (name === "value") {
          this.value = newValue;
        }
      }
    }

    customElements.define("submit-button", SubmitButton);

    //monkeyPatch into HTMLFormElement method .requestReset()

    //default action on click on the submit-button or one of its descendants
    window.addEventListener("click", function (e) {
      if ((!e.isTrusted && !e.isTrustedSimulation)|| e.defaultPrevented)
        return;
      for (let el of e.composedPath()) {
        if (el instanceof HTMLElement && el.matches("submit-button")) {
          e.addDefaultAction(() => !e.defaultPrevented && el.form.requestSubmit(/*el*/), {preventable: el});
        }
      }
    }, true);

    //default action on keypress on the submit-button or one of its descendants
    window.addEventListener("keypress", function (e) {
      if (!e.isTrusted|| e.defaultPrevented)
        return;
      for (let el of e.composedPath()) {
        if (el instanceof HTMLElement && el.matches("submit-button")) {
          const clickSimulation = new MouseEvent("click", {composed: true, bubbles: true});
          clickSimulation.isTrustedSimulation = true;
          e.addDefaultAction(() => !e.defaultPrevented && el.dispatchEvent(clickSimulation), {preventable: el});
        }
      }
    }, true);
  })();
</script>

<form>
  <submit-button>
    hello
    <a href="#sunshine">sunshine</a>
    and
    <span tabindex="0">blue skies!</span>
  </submit-button>
  <hr>
  <a href="#world">
    <submit-button>hello</submit-button>
    world
  </a>

</form>
<script>
  //todo test for preventDefault()
  window.addEventListener("submit", e => e.preventDefault());

  window.addEventListener("keydown", e => console.log(e.type, e.target.tagName, e));
  window.addEventListener("keypress", e => console.log(e.type, e.target.tagName, e));
  window.addEventListener("click", e => console.log(e.type, e.target.tagName, e.isTrusted, e.isTrustedSimulation, e));
  window.addEventListener("submit", e => console.log(e.type, e.target.tagName, e));
</script>
```

## References

 * 