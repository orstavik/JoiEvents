# Pattern: OriginalGangster
                                                                          
First, three core principles:
1. The DOM *always* reflects the current reality. 
2. Historic states of the DOM can be stored as JS properties.
3. CSS pseudo-classes query (deep) DOM states that are only accessible via JS.

## API 1: `[checked]` is in, `:checked` and `defaultChecked` is out

When the `<input type="checkbox">` and `<input type="radiobox">` is really and truly checked (on screen, etc.), then this checked state should be reflected in the DOM. We therefore expropriate the existing `checked` attribute and declare that under the DefaultCheckedOG pattern, the `checked` HTML attribute will always reflect the current state of the DOM and change to the same value as the `checked` JS property whenever this changes.

This change will have some consequences:
1. The CSS `[checked]` selector will now *equal* the `:checked` pseudo-class selector. Both should always produce the same result, rendering the `:checked` pseudo-class pointless.
2. Changing the `checked` attribute will also change the `defaultChecked` attribute accordingly. This means that if the `checked` attribute is always the same as the `checked` property, then the `checked` property will also always be the same as the `defaultChecked` property. `defaultChecked` is pointless.

## API 2: We make pseudo-classes for `:altered`, `:reset`, and `:submitted`

When the `<input type="checkbox">` and `<input type="radiobox">` is altered by the user, or a script, then this state is remembered by the browser. Any checkbox or radiobox whose value has been changed after it was first initialized, can be queried from CSS using pseudo-class `:altered`.

When a checkbox or radiobox is altered back to their initial state, they are no longer `:altered`, but instead `:reset`.

If a `<form>` is submitted, then all the `<form>`'s checkboxes and radioboxes have been `:submitted`. They are no longer considered untouched, nor `:altered`, nor `:reset`.

## Implementation

To implement such a pattern we use an EventSequence that:
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
 
1. The OG pattern makes the DOM synchronic. You can *trust* the `checked` attribute. What you see in the HTML template reflects what you see on screen. Synchronously. No more historic, outdated attributes in the DOM. 

2. The OG pattern creates JS property that contains the historic value. History is relevant, and when we need to access the element's history from JS, we can do so. 

3. If you want, you can store the original, historical value as an attribute. For example, instead of adding a `defaultCheckedOG` as a JS property, we could have added it as a `checkedOG` attribute for example. This would have some cool benefits such as replacing the `input-altered` pseudo-pseudo-classes with an attribute only query such as `[checked]:not([checkedOG])), [checkedOG]:not([checked]))`. However, this works for binary `<input>` elements only, and if you plan to use such queries, then the attribute only CSS selectors are not really readable. If you feel the historic value can and should be an attribute too, that is possible.

4. The OG pattern gives the UX event sequence, ie. the history of a users session, a declarative face. With it, it is possible for the HTML and CSS developers to relate in a meaningful way with a dynamic DOM+event sequence world.

### old

When we look now at `checked` from the perspective of EventSequences. Which sequence of events is the `checked` attribute and `<input>` elements responding to? Answer: `input` events. What would a cycle for such an `input` EventSequence look like? Answer: `<input>` elements under the same `<form>` would be grouped; it would start with an empty register; every time an `<input>` element first changes, it would be added to the register; every time a `<form>` is `submit`, the `<input>` element under that `<form>` would be reset in the register. 

   Now, which use-cases for pseudo-classes can we imagine for an EventSequence underlying `input` events?
   * If the user alters the value of a checkbox, radiobox, or any other `<input>` element, an `input` event should be dispatched. Consequently, an EventSequence can register *which* elements have been registered as getting new `input` since the page was first loaded. , and for example mark these "`<input>` elements altered during the current session" with an `:altered` pseudo-class.
   * If the value of an `<input>` element has been altered back to its original value (the value it had before the first `input` event), the element could be marked `:reset`.

This setup has many benefits. First, it does *not* provide redundant properties in JS and HTML. Second, it gives *more* information about the state of the users events than the current `:checked` debacle. For example would it be much simpler to give the user feedback about which inputs he has not yet answered, and which inputs he has answered and reset or answered and changed. And finally, such a pseudo-class would *be in line* with other pseudo-classes such as `:hover` and `:visited` that *also* reflect native EventSequences' state.

## Why view pseudo-classes as reflecting EventSequences' state?

It is not common to talk about CSS pseudo-classes as driven by EventSequences' state. Usually, we describe CSS pseudo-classes as associated with an element's state (only). However, I would argue that seeing many CSS pseudo-classes as event-regulated, and not element regulated, is necessary when you make composed events. Here's why.

HTML elements don't suddenly change state on their own. In order for the DOM and its elements to change state, an event must occur. Thus, when an element's state change, we usually think of this change first as an event. And therefore, when an element goes through as series of state changes, these changes can be viewed as driven by a sequence of events.

* One event can cause one state change in an element.
* One event sequence can cause an element to switch between several different states.

But, one event might affect more than one element. Some of the 
This means that the state of an EventSequence is *translated* into a set of states in DOM elements. *And*, some of the nuances and details of the EventSequence's state might be lost in translation. When you look at the translated, still result in the element's state in the DOM, you might not see the entire state of the EventSequence, only the aspect of the EventSequence that was relevant to this one element. On the other hand, if you focus clearly on the sequence of events that has occured to produce a certain state, then you are more likely to see a fuller picture. Thus, parts of the "logic behind" the altered DOM state might elude you if you view pseudo-classes in terms of individual elements. 

For me, the `:checked` pseudo-class is a good example of why and when seeing CSS pseudo-classes from the perspective of EventSequence state. 

> Can we learn from other's mistakes? `:checked`.

## References

 * [MDN: CSS pseudo-classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes)
 * [MDN: CSS pseudo-classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes)