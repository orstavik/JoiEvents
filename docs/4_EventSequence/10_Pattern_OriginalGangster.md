# Pattern: OriginalGangster
                                                                          
First, three core principles:
1. The DOM *always* reflects the current reality. 
2. Historic states of the DOM can be stored as JS properties.
3. CSS pseudo-classes query (deep) DOM states that are only accessible via JS.

## API 1: `[checked]` is in, `:checked` and `defaultChecked` is out

When an `<input type="checkbox">` or `<input type="radiobox">` is "really" checked (on screen, etc.), then its checked state should be reflected in the DOM. We therefore expropriate the existing `checked` attribute. Under the OriginalGangster pattern the `checked` HTML attribute will always mirror the `checked` JS property which reflects the current, real state of the DOM.

This policy will eliminate the *external* need for the:
1. `:checked` pseudo-class: `[checked]` will now always *equal* `:checked`. 
2. `defaultChecked` and `checked` properties: in this setup, the `checked` attribute, and the `checked` and `defaultChecked` properties are always equal. Thus, the `checked` and `defaultChecked` properties are redundant.

## API 2: We make pseudo-classes for `:altered`, `:reset`, and `:submitted`

When the `<input type="checkbox">` and `<input type="radiobox">` is first altered by the user or a script, then each element's initial, "original" state is remembered by the browser. This historic value is preserved as a `initialChecked` property on the `<input>` element. 

Any checkbox or radiobox whose value has been changed after it was first initialized, is marked with a CSS pseudo-class `:altered`.

When a checkbox or radiobox is altered back to their initial state, they are no longer `:altered`, but instead `:reset`.

If a `<form>` is submitted, then *all* the `<form>`'s checkboxes and radioboxes are marked as `:submitted`.

The three pseudo-classes `:altered`, `:reset`, and `:submitted` are exclusive, there is only one such class active on a checkbox and radiobox at any time.

## Implementation

To implement the OG pattern we use an EventSequence that:
1. listens for all `input` events from checkbox and radiobox `<input>` elements,
2. remembers the `original` state of all checkboxes and radioboxes by storing a `defaultCheckedOG` JS property on the elements,
3. sets a `.checked-altered` pseudo-pseudo-class on the `<input>` element when their value has been altered,
4. sets a `.checked-reset` pseudo-pseudo-class on the `<input>` element when their value has been altered back to their original value, 
5. listens for all `submit` events from `<form>` elements, and
6. sets a `.checked-submitted` pseudo-pseudo-class on the `<input>` element when they have been submitted.

## Demo: The `altered-reset-submitted` EventSequence

```javascript
(function () {

  function removePseudoPseudoClasses(input) {
    input.classList.remove("input-altered");
    input.classList.remove("input-reset");
    input.classList.remove("input-submitted");
  }

  //make sure the "checked" attribute in the DOM is in sync with the checked property
  //now, the CSS querySelectors can use [checked] to query if the checkbox or radiobutton is checked.
  //this essentially renders the :checked pseudo-class redundant.
  function correctCheckedAttribute(input) {
    if (input.checked && !input.hasAttribute("checked"))
      input.setAttribute("checked", "");
    else if (!input.checked && input.hasAttribute("checked"))
      input.removeAttribute("checked");
  }

  function correctCheckedAndAddPseudoPseudo(input) {
    if (input.defaultCheckedOG === undefined)
      input.defaultCheckedOG = input.defaultChecked;
    correctCheckedAttribute(input);

    removePseudoPseudoClasses(input);
    if (input.defaultCheckedOG !== input.checked)
      input.classList.add("input-altered");
    else
      input.classList.add("input-reset");
  }

  function onSubmit(e) {
    for (let input of Array.from(e.target.elements)) {
      if (input.type === "radio" || input.type === "checkbox") {
        input.defaultCheckedOG = input.checked;
        removePseudoPseudoClasses(input);
        correctCheckedAttribute(input);
        input.classList.add("input-submitted");
      }
    }
  }

  function onInput(e) {
    if (e.target.type === "checkbox")
      correctCheckedAndAddPseudoPseudo(e.target);
    if (e.target.type === "radio") {
      const allInputs = Array.from(e.target.form.elements);
      const targetRadioGroup = allInputs.filter(el => el.type === "radio" && el.name === e.target.name);
      for (let radio of targetRadioGroup)
        correctCheckedAndAddPseudoPseudo(radio);
    }
  }

  window.addEventListener("input", onInput, true);
  window.addEventListener("submit", onSubmit, true);
})();
```

And in HTML it looks like so:
```html
<script src="./altered-reset-submitted.js"></script>

<style>
  input::after {
    width: 2px;
    height: 1em;
    content: ".";
    display: block;
    background-color: yellow;
  }
  input[checked]::after {
    width: 10px;
    content: "X";
  }
  input.input-altered::after {
    background-color: red;
  }
  input.input-reset::after {
    background-color: orange;
  }
  input.input-submitted::after {
    background-color: green;
  }

</style>

<form name="test">
  <input type="radio" name="group1">a<br>
  <input type="radio" name="group1" checked>b<br>
  <input type="radio" name="group1">c<br>
  <hr>
  <input type="radio" name="group2">radio-lonesome<br>
  <hr>
  <input type="checkbox" value="d">checkbox 1<br>
  <input type="checkbox" value="d" checked>checkbox 2<br>
  <hr>
  <input type="submit" name="case" value="Submit">
</form>
<script>
  //this is an app that manages form submit via xhr.
  window.addEventListener("submit", e => e.preventDefault(), false);
</script>
```

## Discussion

The OriginalGangster pattern does several things. 
 
1. The OG pattern makes the DOM synchronic. You can *trust* the `checked` attribute. What you see in the HTML template reflects what you see on screen. Synchronously. No historic, outdated DOM attributes. 

2. The OG pattern creates JS property that contains the historic value. History is relevant, and when we need to access the element's history from JS, we can do so. 

3. The OG pattern provides three useful pseudo-pseudo-classes: `.input-altered`, `.input-reset`, and `.input-submitted`. These automatic CSS classes gives the UX a declarative state over time. The history of a users interaction with `<form>` elements in a session is given a declarative API. You can access the UX event sequence directly from CSS in a meaningful way.

 * If you want, you can store the original, historical value as an attribute. For example, instead of adding a `defaultCheckedOG` as a JS property, we could have added it as a `checkedOG` attribute for example. This would have some cool benefits such as replacing the `input-altered` pseudo-pseudo-classes with an attribute only query such as `[checked]:not([checkedOG])), [checkedOG]:not([checked]))`. However, this works for binary `<input>` elements only, and if you plan to use such queries, then the attribute only CSS selectors are not really readable. If you feel the historic value can and should be an attribute too, that is possible.

## Pseudo-classes = EventSequence declarations

It is not common to talk about CSS pseudo-classes as driven by EventSequences' state. Usually, we describe CSS pseudo-classes as associated with an element's state. A pseudo-class as a way to represent the "shifting face of an element".
 
But, CSS pseudo-classes can also be understood as "the still face of an event sequence". Pseudo-classes such as `:hover` and `:visited` *reflect* the state of a native EventSequence *onto different elements*. 

## References

 * [Whatwg: `<input type="radio">`](https://html.spec.whatwg.org/multipage/input.html#radio-button-state-(type=radio))
 * [MDN: CSS pseudo-classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes)