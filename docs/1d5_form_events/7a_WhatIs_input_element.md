# WhatIs: `<input type="text">`?

The `<input type="text">` element is a single-line box for user text input.

The `<input type="text">` element has two key aspects:
1. the **`.value` property** and
2. the **`value` attribute**.

## The `.value` property

The `.value` **property** is the *current, updated* value of the `<input type="text">` element that you see on screen. If the app updates this value:

1. via script, such as `inputEl.value += "the end";`, then 
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
 
## The `_native_checkChange()` and `change` event

The `change` event is dispatched from the `_native_checkChange()` method on the `<input type="text">` element. The `change` event is past-tense: it follows a *group of* state changes to the `.value` property and is dispatched when the `<input type="text">` element *looses focus*. Calling `preventDefault()` on the `input` event does nothing.

The purpose of the `change` event is to provide a simplified hook for a series of `input` events. When a user updates a text input, he will often write tens or maybe hundreds of characters, make mistakes, edits, etc. within a short period of time. Most observations of `<input type="text">` elements require only that the script reacts when the user has *finished writing* and *moves onto* the next field. `change` is triggered by the `focusout` event, which is works as a proxy for "finished writing".

## Demo: Naive `<input type="text">` element

To illustrate the basic functionality of the `<input type="text">` element, we implement a `<my-input>` element which essentially duplicates the functionality of the native `<input type="text">` element.

## References

 * 