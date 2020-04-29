# WhatIs: `<input>` validity?

## WhatIs: `checkValidity()` and `invalid` event?

The `.checkValidity()` can be called on input elements: `<input>`, `<select>` and `<textarea>`.
The `.checkValidity()` method checks whether the input element has any constraints and whether it satisfies them. If the input element's data matches the given constraints, the `.checkValidity()` returns true; if the input element's data doesn't match the given constraints, the `.checkValidity()` dispatches a `invalid` event at the element, and then returns `false`.

> You can call `.checkValidity()` on `<form>` elements too. `.checkValidity()` then returns true iff all the `<form>` element's input elements are valid.

The invalid event is dispatched sync on the input element that fails its validity test. The `invalid` event doesn't bubble, but it is cancellable: calling `.preventDefault()` on an `invalid` event will allow the `<form>` to be submitted even if this `invalid` event was dispatched as part of a `submit` request.

The `invalid` event itself doesn't contain any data about which validity check failed. Instead, the input element (which is also the `target` of the `invalid` event) contains a `.validity` property object that stores the state of the validity check.   

```html
<input type="text" required />

<script>
  const input = document.querySelector("input");
  input.addEventListener("invalid", e => console.log("invalid input: ", e.target.validity));
  console.log("input.checkValidity(): ", input.checkValidity());
</script>
```

Results:

```
invalid input: {..., required: false}
input.checkValidity(): false
```

## WhatIs: `required` and `pattern` and other HTML validation attributes? 

There are several HTML attributes that can be added to an input element to constrain its validity.

#### Validity attributes that apply to:
1. `<input>`, `<textarea>` and `<select>` elements: 
    * `required`: the element must be selected or have text content when the form submitted.

2. `<input type="text">` and `<textarea>` elements: 
    * `pattern`: specifies a regular expression the form control's value should match.
    * `minlength/maxlength`: ensure that the length of the element is greater/less than or equal to the specified value.
 
3. `<input>` 
    * `type`: specifying the type of control to render. All available values presented [here](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#%3Cinput%3E_types).
 
4. `<input type="number"> <input type="range">`
    * `min`: number value must be greater or equal the value.
    * `max`: number value must be less or equal the value.
    * `step`: number value must be a multiple of this number.
  
```html
<form>
    <label for="login">Nickname (4 to 10 characters):</label>
    <input id="login" type="text" minlength="3" maxlength="10" required>
    <label for="phone">Phone number:</label>
    <input id="phone" type="tel" required>
    <input type="submit">
</form>

<script>
  window.addEventListener("invalid", e => {
    const validity = e.target.validity;
    for (let key in validity) {
      if (validity[key])
        console.log("Wrong #" + e.target.id, key);
    }
  }, true);
</script>
```
one big demo



## WhatIs: `:invalid` and `:valid`?
 
Writing an effective form validation is not only about the errors themselves; it is equally important to show the errors to the user in a user-friendly way, and supporting browsers give you CSS pseudo-classes to do so.
  
CSS form validation relies on the `:invalid` and `:valid` pseudo-classes. (There are other pseudo-classes, such as `:out-of-range`, but we’re going to ignore them because they work the same, and are more specific instances of `:invalid`).
   
```html
<style>
    input:valid {
        background-color: green;
    }

    input:invalid {
        background-color: red;
    }
</style>
<form>
    <input type="text" id="name" placeholder="use lowercase letters only" pattern="[a-z]+">
</form>
```
   
## Problem: `:invalid` drawback
 
The style defined inside `:invalid` pseudo-class will be applied until the entered value meets the conditions. But, this can be intrusive and disturb the user's interaction with the page: the user does not need to know about the state of their input *all the time*. So, from a CSS perspective, one likely want to limit the styles for `:invalid` and/or `:valid` selectors to more specific circumstances:
 
1. Only show the `:invalid` style when the user is not actively working with it (ie. not currently focusing on that element)
    
```css
input:invalid:not(:focus){
  background-color: red;
}
 ```
   
2. Another problem is to separate between "edited-by-the-user-and-invalid" and "not-yet-edited-by-the-user-and-invalid". For input elements that has a `placeholder` attribute, we can do so by combining the `:placeholder-shown` and the `:invalid` CSS pseudo-classes:
 
```html
<input type="text" placeholder="You should write only 'aaa' here..." pattern="a+">

<style>
  /*input element has not yet been edited and is invalid*/ 
  input:invalid:not(:focus):not(:placeholder-shown){
    background-color: orange;
  }
  /*input element has been edited, but is given an invalid value*/ 
  input:invalid:not(:focus):placeholder-shown{
    background-color: red;
  }
</style>
```

## `.setCustomValidity()`

If an `invalid` event activated, the browser will display an error message stored in the `validationMessage` property of the target. The _only way_ to change its value is to call `setCustomValidity()` with the message text as an argument value. 

To make sure that it is impossible use other methods to determine the new value of error message, consider a demo. In the first case we try to use `.defineProperty()` method to change the `validationMessage` value, but the browser will ignore it and display the default message. The second method uses `setCustomValidity()` and changes the text of the message causing the browser to display the new value correctly.

```html 
<form>
    <label for="login">Nickname (4 to 10 characters):</label>
    <input id="login" type="text" minlength="3" maxlength="10" required>
    <label for="password">Password:</label>
    <input id="password" type="password" required>


    <input type="submit">
</form>

<script>
  let login = document.querySelector("#login");
  let password = document.querySelector("#password");

  login.addEventListener("invalid", e => {
    const validity = e.target.validity;
    for (let key in validity) {
      if (validity[key]) {
        Object.defineProperty(e.target, "validationMessage", {
          value: "Error: " + key,
          writable: true
        });
      }
    }
    console.log(e.target.validationMessage); // Error: valueMissing

  }, true);


  password.addEventListener("invalid", e => {

    const validity = e.target.validity;

    for (let key in validity) {
      if (validity[key]) {
        e.target.setCustomValidity("Error: " + key);
        return
      }
    }
    console.log(e.target.validationMessage); // Error: valueMissing

  }, true)

</script>
``` 
``` 

### References

* [WHATWG: check validity steps](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#check-validity-steps)
* [MDN: Regular expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions) 
* [MDN: `invalid` event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/invalid_event) 
* [MDN: `:invalid` pseudo-class](https://developer.mozilla.org/ru/docs/Web/CSS/:invalid) 


The simplest way to enable validation is simply marking a field using the `required` attribute. It specifies that an input field must be filled out before submitting the form.

```html
<input type="text" required>
```

For constraint validation there are also two additional relevant attributes - `novalidate` and `formnovalidate`. 
  
  The boolean `novalidate` attribute can be applied _only to form nodes_. When present this attribute indicates that the form's data should _not_ be validated when it is submitted.
  
  ```html
  <form novalidate>
      <input type="text" required />
      <input type="submit" value="Submit" />
  </form>
 ```
 
Form above will submit even though it contains an empty `<input required/>`.
  
The `formnovalidate` boolean attribute can be applied to both `<button>` and `<input>` elements to prevent form validation. For example:
   
  ```html
  <form>
      <input type="text" required />
      <input type="submit" value="validate" />
      <input type="submit" value="do NOT validate" formnovalidate />
  </form>
 ```
 
If the user presses the "validate" button - sending the form will be forbidden because of the empty input. However, if you press the "do NOT validate" button, the form will be sent despite the invalid data because of the `formnovalidate` attribute.

The HTML5 specification allows for easier verification due to the introduction possible _types_ such as `email`, `url`, or `tel`, (You can check full list of possible values [here](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#%3Cinput%3E_types)).
 
 `email` and `url` will only accept correctly formatted email addresses and URLs, respectively, while `number` and `range` can have maximum and minimum numeric values applied. If the entered value does not match the expected format, these types will generate an error, resulting in an error message, and this prevents substitution of incorrect data.
 
 Also, we can define form validity using `minlength`, `maxlength`, `min`, `max`, `step`, `pattern` attributes that we can use together with particular value of `type` attribute. They make it possible to determine more customized validation.

```html
<form>
  <input required type="range" min="100" max="300" step="50">
</form>
``` 
 
At the same time it is impractical to expect full processing of all possible scenarios with the `<input>` element. What if we have input for a username, zip code or other specialized data types that do not belong to the specification types? Then how do you validate these fields? This is where we can use the `pattern` attribute.
 
 `Pattern` applies to all text fields except numeric and date fields. It is the most well-supported attribute in forms, which also allows us to write a fallback for browsers that for one reason or another do not understand the purpose of a particular type of field. This allows us to define our own validation rules using Regular Expressions (RegEx).  
 
 For example, let's say we have a form for entering a user name. There is no standardized type for the username field, so we will use the usual `text` type. Let's define a rule that will be used in the pattern attribute.
 
  In this case, we will specify that the username should:
   1. consist of lowercase letters;
   2. no capital letters, numbers or other characters;
   3. the username should not exceed 15 characters.  
   
 According to the rules of regular expressions, this can be written in the following way `[a-z]{1,15}`.

 ```html
  <form >
    <input type="text" name="username" placeholder="lowercase only" pattern="[a-z]{1,15}">
  </form>
```
 Now, since only lowercase letters allowed, substitution of any other characters causes an error message.





### `invalid` event
 
When a submittable element has been checked for validity and doesn't satisfy its constraints `invalid` events fired at each form control that is invalid.
 
The validity of submittable elements checked _before_ submitting their `<form>`. It means that it will fire when either user clicks on "submit" button or call `.requestSubmit()` on `<form>` element node. 

> It does not work with a `.submit()` because when call `.submit()` method neither `submit` nor `invalid` events raised.

  ```html
<form>
    <label for="name">Name (lowercase) </label>
    <input required type="text" id="name" placeholder="use lowercase letters only" pattern="[a-z]+">
    <input type="submit">
</form>

<script>

let inputElement = document.querySelector("input[type=text]");

inputElement.addEventListener("focusout", e => {  // call .requestSubmit() when input loses focus
    e.target.form.requestSubmit();
  },true);

  window.addEventListener("invalid", e => {  // will trigger if the entered value was irrelevant 
    console.log("invalid input: ", e.target);
  }, true);

  window.addEventListener("submit", e => {  // will be triggered only if the invalid event does not occur
    e.preventDefault();
    console.log("submitted");
  });
</script>
```

