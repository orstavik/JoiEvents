# WhatIs: `<input type="text">`?

The `<input type="text">` element is a single-line box for user text input.

The `<input type="text">` element has two key aspects:
1. the **`.value` property** and
2. the **`value` attribute**.

> The `name` attribute is also important. The name will be translated to the key for the data of the input field in the post/get HTTPS request sent to the server. However, the `name` property is static. From the viewpoint of the `<input type="text">` element it is simply there to be read by the parent `<form>` element who makes this request. 

## The `.value` property

The `.value` **property** is the *current, updated* value of the `<input type="text">` element that you see on screen. If the app updates this value:

1. via script, such as `textInputElement.value += "the end";`, then 
   1. the value on screen will be updated.
 
2. via user-driven `keypress` (or `keydown`) events, such as the user pressing a single key such as "a", then 
   1. a `beforeinput` event is dispatched with this `key` value which (if not prevented) will 
   2. alter the `.value` property and update the value on screen.
   
   We call this method `_native_requestInput(key)`. This method can only be triggered by user-driven actions. 

## The `value` attribute

> The `value` attribute should have been called `original-value`.

The `value` **attribute** is the *original, static value* of the `<input type="text">` element, ie. the value that the `<input type="text">` element starts with/defaults to. The `value` attribute can only be set in the HTML template or from JS script. The `value` attribute does not mirror the `.value` property, and vice versa: If the app updates this attribute *after* the element is constructed, the `.value` property will not change as a consequence (except in alternative state); when the `.value` property changes, the `value` attribute *does not automatically!* reflect this change.

But. There is a problem: **an alternative state**. The `<input type="text">` element behaves differently when the `value` attribute is not set at startup. **When the `<input type="text">` element is *created without a `value` attribute*, then all later changes of the `value` attribute will be reflected down to the `.value` property.** This happens both if the element is created without an attribute in the template (ie. `<input type="text">`) or from script (ie. `document.createElement("input")`).

The `value` attribute is *only* used to populate the current `.value` property when:

1. the `<input type="text">` element is **created**,
2. the `_native_reset()` function is called,
3. the `<input type="text">` element is re-connected to the DOM, or
4. the `value` attribute changes (only for "alternative state":`<input type="text">` elements *created without a `value` attribute*).


## Demo: `<input type="text">` element

```html
<form>
  <input id="one" type="text" value="original">
  <input id="two" type="text">
</form>

<script>
  const form = document.querySelector("form");
  const one = document.querySelector("#one");
  const two = document.querySelector("#two");
 
  one.value = "updated";
  console.log(one.value + " !== " + one.getAttribute("value"));
  
  one.setAttribute("value", "updated-attribute");
  console.log(one.value + " !== " + one.getAttribute("value"));

  two.value = "hello";
  console.log(two.value + " !== " + two.getAttribute("value"));
  form.reset();
  console.log(one.value + " === updated-original");
  console.log(two.value + " === ''");

  two.setAttribute("value", "sunshine");
  console.log(two.value + " === ''");
  two.remove();
  form.appendChild(two);
  console.log(two.value + " === sunshine");

  window.addEventListener("beforeinput", e=>console.log(e));
  window.addEventListener("input", e=>console.log(e));
</script>
```

## `<input>` controls `beforeinput`,`input`, and `change`

The `<input type="text">` element controls three events:
1. `beforeinput`
2. `input`
3. `change`

## The `_native_requestInput(key)` and `beforeinput`/`input` events

The `beforeinput` event is dispatched from the `_native_requestInput(key)` method on the `<input type="text">` element. The `beforeinput` event is future-tense: it precedes the mutation of the `.value` property when this mutation is driven by a user event such as a `keypress`. If `preventDefault()` is called on the `beforeinput` event, then the mutation of the `<input type="text">` element's `.value` property is cancelled.

The `input` event is *also* only dispatched from the `_native_requestInput(key)` method. The `input` event is past-tense: it follows the state change of the `.value` property of the `<input type="text">` element and only alerts any event listeners about a mutation that has already happened. Calling `preventDefault()` on the `input` event does nothing.

The purpose of the `beforeinput`, `input` events and thus the `_native_requestInput(key)` are:
 * The `beforeinput` event provides the scripts with the ability to cancel and control user-driven changes of the `<input type="text">` element.
 * The `input` event enables scripts to observe state changes of `<input type="text">` elements.
 
When the `.value` property is changed from within a script, then that script can obviously both control and observe the value itself. This is why the `beforeinput` and `input` events are only dispatched from user-driven state changes, and not when the state of the `.value` property is first set up nor when it is altered by a script.
 
## Demo: Naive `<input type="text">` element

To illustrate the basic functionality of the `<input type="text">` element, we implement a `<my-input>` element which essentially duplicates the functionality of the native `<input type="text">` element.

There is one major problem making the demo. The browser can implicitly detect if an element was constructed with a value attribute at startup. Regular JS functions cannot. From the `constructor()` of a web component, or its `attributeChangedCallback(...)`, we cannot find out if the element's constructor is being triggered by the parser (during loading, upgrading, or from `.innerHTML`) or from a normal script (`new WebComponent()` or `document.createElement()`). Instead, in this demo, we mark the elements that are hypothetically created with a `value` attribute at startup with another attribute: `_value_at_startup_`.  

```html
<script>
  (function () {
    class MyInput extends HTMLElement {

      static get observedAttributes() {
        return ["value"];
      }

      constructor() {
        super();
        const shadow = this.attachShadow({mode: "closed"});
        shadow.innerHTML = `<div tabindex="0" style="border: 1px solid grey; width: 200px; height: 1.2em;"></div>`;
        this._innerDiv = shadow.children[0];
      }

      get value() {
        return this._innerDiv.innerText;
      }

      set value(newValue) {
        this._innerDiv.innerText = newValue;
      }

      attributeChangedCallback(name, oldValue, newValue) {
        //The browser can implicitly detect if an element was constructed with a value attribute at startup.
        //Regular JS functions cannot, so instead we add an explicit attribute (_value_at_startup_) to flag this state.
        if (name === "value" && !this.hasAttribute("_value_at_startup_")) {
          this.value = newValue;
        }
      }

      _native_reset() {
        this.value = this.getAttribute("value");
      }

      _native_requestInput(data) {
        let insertType = "insertText";
        if (data === "Backspace") {
          insertType = "deleteContentBackward";
          data = null;
        }
        const beforeInputEvent = new InputEvent("my-beforeinput", {
          composed: true,    //composed should be false
          bubbles: true,
          cancelable: true,
          insertType,
          data,
        });
        this.dispatchEvent(beforeInputEvent);
        // Event listeners in the propagation above might queue microtasks.
        // These microtasks should be emptied before _native_updateValue is called.
        // To delay updating the state properly until these microtasks are run, we use toggleTick.
        toggleTick(() => {
          if (!beforeInputEvent.defaultPrevented)
            this._native_updateValue(data, insertType);
        }, ["keypress"]);   //keydown might trigger keypress.
      }

      //simplified
      _native_updateValue(data, insertType) {
        if (insertType === "deleteContentBackward")
          this._innerDiv.innerText = this._innerDiv.innerText.substr(0, this._innerDiv.innerText.length - 1);
        else
          this._innerDiv.innerText += data;
        const inputEvent = new InputEvent("my-input", {
          composed: true,   //composed should be false
          bubbles: true,
          cancelable: true,
          data,
          insertType
        });
        this.dispatchEvent(inputEvent);
      }
    }

    customElements.define("my-input", MyInput);
  })();
</script>

<!--<form>-->
<my-input id="one" type="text" value="original" _value_at_startup_></my-input>
<my-input id="two" type="text"></my-input>
<!--The browser can implicitly detect if an element was constructed with a value attribute at startup.-->
<!--Regular JS functions cannot, so instead we add an explicit attribute (_value_at_startup_) to flag this state.-->
<!--</form>-->


<script>
  // const form = document.querySelector("form");
  const one = document.querySelector("#one");
  const two = document.querySelector("#two");

  console.log("----normal case, attribute changes does not affect property changes, and vice versa.");
  one.value = "updated";
  console.log(one.value + " !== " + one.getAttribute("value"));
  one.setAttribute("value", "updated-attribute");
  console.log(one.value + " !== " + one.getAttribute("value"));
  //connectedCallback doesn't reset the input value the value
  one.remove();
  document.body.prepend(one);
  console.log(one.value + " !== " + one.getAttribute("value"));
  //even when the attribute is removed, the element disconnected and then set up anew
  one.removeAttribute("value");
  one.remove();
  document.body.prepend(one);
  one.setAttribute("value", "updated-attribute");
  console.log(one.value + " !== " + one.getAttribute("value"));
  one._native_reset();
  console.log(one.value + " === updated-attribute");

  console.log("----alternativeState, the attribute changes DO change the property, but not the other way round");
  two.value = "hello";
  console.log(two.value + " !== " + two.getAttribute("value"));
  two._native_reset();
  console.log(two.value + " === ''");
  two.setAttribute("value", "sunshine");
  console.log(two.value + " === sunshine");
  two.setAttribute("value", "world");
  console.log(two.value + " === world");

  console.log("----created from script behaves as ");
  const three = document.createElement("input");
  three.setAttribute("type", "text");
  three.setAttribute("_no_value_at_startup_", "");
  //The browser can implicitly detect if an element was constructed with a value attribute at startup.
  //Regular JS functions cannot, so instead we add an explicit attribute (_value_at_startup_) to flag this state.
  three.setAttribute("value", "alternativeState");
  console.log(three.value + " === alternativeState");
  three.value = "hello";
  console.log(three.value + " !== " + three.getAttribute("value"));

  // see next chapter
  // window.addEventListener("beforeinput", e => console.log(e)); //trigger only from user-driven keypress
  // window.addEventListener("input", e => console.log(e));       //trigger only from user-driven keypress
  // see next next chapter
  // window.addEventListener("change", e => console.log(e));       //trigger only from user-driven keypress
</script>
```

## References

 * 