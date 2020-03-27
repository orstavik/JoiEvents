## Problem: `submit` is `composed: false`

The `submit` event is `composed: false`. This is a problem. The `submit` event should be `composed: true`. But why?

## The `submit` is future-tense event about a browser state change 

`submit` is a future-tense event. `submit` notifies any event listener that the browser is about to load a new page. 

In future-tense events the default action is a task that will change a state somewhere. `submit`'s default action is to load a new page in the browser `window`. So, `submitEvent.preventDefault()` will stop this navigation task. `submitEvent.preventDefault()` alters no other state properties of DOM elements.

Loading a new page in the browser is definitively a browser state change and a state that occurs at a level above the DOM, and thus is DOM external. This event could be of relevance to all DOM contexts above any web component that encapsulates the `<form>`. Furthermore, the `submit` event needs to `target` its `<form>` element, ao. to be able to separate which `<form>` is submitted if a document has more than one `<form>` element. And this all leads to the conclusion that `submit` should be `composed: true`.
 
But. The `submit` is `composed: false`. This means that if a `<form>` is placed inside a web component's shadowDOM, and then submitted, then scripts in above lightDOMs, such as the main document, will not be notified about this event. Scripts in the main document would for example not be able to call `preventDefault()` on the `submit` event, for example.

This is not good. The act loading a new page is definitively relevant for top-level scripts. Restricting access to `submit` events for upper, "owner" top-level scripts makes no sense.

## Demo: `<wrapped-form>`

```html
<script >
  class WrappedForm extends HTMLElement {
    constructor(){
      super();
      const shadow = this.attachShadow({mode: "closed"});
      shadow.innerHTML = `
        <form action="get">
          <input type="text" name="hello" value="sunshine">
          <button type="submit">
        </form>
      `;
      shadow.addEventListener("submit", e => console.log(e.type, e.composed));
    }
  }
  customElements.define("wrapped-form", WrappedForm);
</script>

<wrapped-form></wrapped-form>
<script >
  window.addEventListener("submit", e=> console.log(e));     //no,
  window.addEventListener("submit", e=> e.preventDefault()); //no, no, no..
</script>
```

You do not want to make a reusable web component with a `<form>` inside and *not* have the ability for the user for this web component to block the submission of the form in other means that some convoluted event listener

The reason the spec/browsers have chosen to flag `submit` as `composed: true` *might* be that the `submit` event is dependent on the `<form>` element and its children input elements for the contextual data concerning its task. To access the `action` and `method` properties of the HTTPS request and the query `?prop=value` pairs, a `submit` event listener must manually search the `target` of the `submit` event, ie. the `<form>` element's attributes and children input elements, to access it. It also might be that havn't thought too much about this question just yet.

## HowTo: bounce the `submit` event?
 
There are other means to ensure that event listener's of `submit` events can access the browser navigation data without restricting the `event` using `composed: false`. In the next demo, we bounce the `submit` event as `composed: true`, and append to the bounce event a couple of methods that give lightDOM event listeners access to the data for the ensuing navigaton task.

```html
<script >
  class HiddenSubmit extends HTMLElement {
    constructor(){
      super();
      const shadow = this.attachShadow({mode: "closed"});
      shadow.innerHTML = `
        <form action="get" method="get">
          <input type="text" name="hello" value="sunshine">
          <button type="submit">
        </form>
      `;
      shadow.addEventListener("submit", this.bounceSubmit.bind(this));
    }
 
    bounceSubmit(e){
      const bounceEvent = new Event("submit", {composed: true, bubbles: true});
      const form = e.target;
      Object.defineProperties(bounceEvent, {
        preventDefault: {
          value: function(){e.preventDefault();},
          writable: false
        },
        method: {
          get: function(){return form.getAttribute("method") || "get"},
          set: function(){}
        },
        enctype: {
          get: function(){return form.getAttribute("enctype") || "get"},
          set: function(){}
        },
      })
      //2. copy props from e to bounceEvent
      //change has no valuable properties outside of its `target'
      //3. add the task of dispatch the bounceEvent on the host node to run first in the event loop. Set raceEvents to the e.type.
      toggleTick(()=>this.dispatchEvent(bounceEvent), e.type);
    }
  }
  customElements.define("hidden-submit", HiddenSubmit);
</script>

<hidden-submit></hidden-submit>
<script >
  window.addEventListener("submit", e=> console.log(e));     //no,
  window.addEventListener("submit", e=> e.preventDefault()); //no..
</script>
```
 
 to the  access the contextual location and data being navigated to, the lightDOM context would need to access the `<form>` and its input elements anyway, which should not be possible if element was hidden This however could be simply replicated via an getter/setter methods on the `submit` event such as `getDataTable()`. This could be an alternative mean to overcome the shadowDOM boundaries. 


## Problem 1: `submit` event must be bounced with a proper `preventDefault()`

 

## References

 * 