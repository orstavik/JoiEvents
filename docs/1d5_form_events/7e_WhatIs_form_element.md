# WhatIs: `<form>`?

`<form>` elements are like links. They wrap around a series of input elements and use their content to form contentful HTTPS requests. 

The `<form>` element controls two central functions:
1. The creation of the contentful HTTPS request, which includes:
   1. gathering of all key/value-pairs of the HTTPS requests content,
   2. setting the options of the HTTPS request,
   3. dispatching a `submit` event notifying other scripts that the request is *about to be* sent, and  
   4. submitting the HTTPS request.
   
2. Resetting the value of all the `<form>`'s input elements to their original value, and dispatching a `reset` event notifying other scripts that input elements *has been* reset.    

## The `submit` event

The `submit` event is a future-tense event that notifies other scripts that the browser is about to load a new document. If an event listener calls `.preventDefault()` on the `<form>`, then the browser will cancel the HTTPS request: the `submit` event is `cancelable: true`.

The state change of loading a new page is external, and it is of potential interest to all scripts in the DOM. However, the `submit` event is `composed: false`, so if a `<form>` is added inside a web component's shadowDOM, then the `submit` event will not be visible above that shadowDOM. In my opinion, this is a mistake: the `submit` event should be `composed: true` as scripts in the main document should have both the right to observe and stop any web component's navigation of the main document.

The `submit` event holds no direct information about the ensuing HTTPS request. And neither does the `<form>`. To find out what data will be sent to the server, a script must manually query all input elements within the `<form>`. To get information about particular options for the request, the `.activeElement` might need to be consulted in order to find the settings of the associated submit button.     

## The `reset` event

The `reset` event is a past-tense event that notifies other scripts that the `<form>` has already reset its descendant input elements. Calling `.preventDefault()` on `reset` events has no effect, and the `reset` event is `cancelable: false`.  

Resetting input element values is a state change in a group of DOM elements, and the `reset` event is therefore internal to the DOM context in which these elements belong. As expected, the `reset` event is `composed: false`.

The `reset` event holds no information about exactly which element's state has changed and their previous value. This can be a problem if a developer wishes to revert the changes. However, this would be costly and inefficient, and so a better strategy for use-cases where potential `reset` events are to be avoided or double-checked before enacted, is to:
1. add an event listener on potential reset buttons (`resetButton.addEventListener("click", function(){/*double-check and/or avoid reset*/})`), and/or
2. override and wrap the native `.reset()` function on the `<form>` if scripts might call it:
```javascript
form.reset = function(){
  if(confirm("Are you sure you want to reset the form?"))
    HTMLFormElement.prototype.call(form);
}
```  

## No default actions on the `<form>` itself

The `<form>` element has *no* default actions, meaning that itself directly react to any user-driven events such as `click` or `keypress`. However, the `<input>` and `<button>` elements within a `<form>` link many of their own default actions directly to the `<form>` element's functions.
  
## `requestSubmit()` vs. `submit`

The `submit()` method will take the data of the `<form>` to create an HTTPS request that is sent by the browser.

The `requestSubmit(submitButton)` method mirrors the behavior of the `<form>` when the submit function is triggered by an `<input>` or `<button>` element. The `requestSubmit(submitButton)` behaves as follows:
1. Dispatch a `submit` event.
2. If `.preventDefault()` is called on the `submit` event, then abort.
3. Update the `<form>` element's HTTPS request settings with specific settings from the `submitButton` (if any). If the loading of a new page is canceled during the `beforeunload` event, then these settings will be undone.
4. Calls the `submit()` method on the `<form>`.

## Demo: `<form>`

```html
<script src="../../1d3_defaultAction/demo/addDefaultAction.js"></script>

```

## References

 * 