# HowTo: BounceEvent?

Imagine the following use-case:
1. A web component has one or two inner elements with special prominence. For example, a web component is mostly wrapping an `<input type="text">`.
2. When the prominent inner element changes state, the web component needs to alert its outer surroundings about this state change. 
3. The inner element already dispatches an event for this state change. For example, the inner `<input type="text">` dispatch a `change` event that the web component needs to echo out. 
4. There is no real need to rename the inner event or change any properties on it. The original event is fine.
5. But, the inner event only signals a simple state change of a DOM element. It is therefore marked `composed: false`. As it should be.

In this use-case, the web component would likely desire to re-dispatch the inner event to its host node. When the element is re-dispatched on the host node, that would make it propagate in the outer lightDOM too.

But, there are a couple of problems:
1. Event objects cannot be re-dispatched to new `target`s. Instead the original, inner event object must be cloned.
2. The cloned event should not be re-dispatched in the middle of the propagation of the original event. **No nested event propagations!**. Thus, the task of re-dispatching the event must be scheduled/queued in such a way that it ensures that it is run immediately after all the other event listeners for the original events are completed.
 
To "bounce an event" is to re-dispatch a non-composed event on the host node so that it solves these problems. 

## HowTo: bounce an event?

To "bounce" an event require 4 steps:
1. Make a new "bounce event" object of the same `type` and `class` as the original, inner event.
2. Copy all relevant properties from the original event to the bounce event. As `composed: false` events often have no specific properties other than `target` and `type`, this step can often be skipped.
3. Queue the task of dispatching the bounced event on the host node to run post propagation. There are two ways to accomplish this:
   1. Queue the task in the event loop using `toggleTick(.., originalEvent.type)`. We want the `toggleTick` task to run before any `raceEvent`s to ensure the bounced event runs before any other events are dispatched.  
   2. Add an event listener on the `shadowRoot` node that you are sure will run last.
      * No event listeners should be placed after it in the propagation path.
      * No event listeners before it in the propagation path should call `stopPropagation()` if you do not explicitly wish to also block the dispatch of the bounce event.
      
      This strategy is problematic if the `target` of the `composed: false` event (or one of its ancestors) are slotted into another web component and this web component calls `stopPropagation()` on that event type somewhere general (cf. the problem of `composed: false` events propagating into slotted hosts. 
      This can be a workable strategy inside a web component as non-composed events often propagate only within on DOM layer, however this strategy *can be problematic* if some element in the ancestor chain is slotted inside another web component and the event therefore also propagates through another element whom might also call `stopPropagation()` on it.  
      
4. Mirror the properties of the inner element whose mutation change is notified in either past or future tense. If not, the bounced event will make little sense in the upper lightDOM context.

   Mirroring the properties is especially important when the web components' `shadowRoot` is `closed`. For example, a `change` event could be bounced up to the host node's lightDOM context. The `target` of the bounced would now be the web component host node, not the input element being changed. Now, if a) the web component's `shadowRoot` is `closed` and b) the web component did not mirror the relevant properties of the inner input element, then c) there would be no way to read the value behind the `change` event in the upper lightDOM context, which would d) make the bounced `change` event pointless.

> The need to mirror event properties whose mutations trigger `composed: false` events is a sign that the event needs to be `composed: false`, as is the case with the `beforeinput` and the `input` events. The lack of data properties on the event object whose `target` is not the `window` node is also a sign that the event should be `composed: false`.

## Demo: `<check-box>`

In this demo, we wrap an `<input type="checkbox">` inside a web component. We then bounce the `change` event. We then use this bounce event outside to give the `<check-box>` web component a green border when it is `checked`. 

```html
<script>
  const EventRoadMap = {
    UNPREVENTABLES: {
      mousedown: ["contextmenu", "focusin", "focus", "focusout", "blur"],
      mouseup: ["click", "auxclick", "dblclick"],
      click: ["dblclick"],
      keydown: ["keypress"]
    }
  };

  function parseRaceEvents(raceEvents) {
    if (raceEvents instanceof Array)
      return raceEvents;
    if (raceEvents === undefined)
      return [];
    if (raceEvents instanceof String || typeof (raceEvents) === "string")
      return EventRoadMap.UNPREVENTABLES[raceEvents] || [];
    throw new Error(
      "The raceEvent argument in toggleTick(cb, raceEvents) must be undefined, " +
      "an array of event names, empty array, or a string with an event name " +
      "for the trigger event in the event cascade.");
  }

  function toggleTick(cb, raceEvents) {
    raceEvents = parseRaceEvents(raceEvents);
    const details = document.createElement("details");
    details.style.display = "none";
    const internals = {
      events: raceEvents,
      cb: cb
    };

    function wrapper() {
      task.cancel();
      internals.cb();
    }

    const task = {
      cancel: function () {
        for (let raceEvent of internals.events)
          window.removeEventListener(raceEvent, wrapper, true);
        details.ontoggle = undefined;
      },
      reuse: function (newCb, raceEvents) {
        raceEvents = parseRaceEvents(raceEvents);
        internals.cb = newCb;
        for (let raceEvent of internals.events)
          window.removeEventListener(raceEvent, wrapper, true);
        internals.events = raceEvents;
        for (let raceEvent of internals.events)
          window.addEventListener(raceEvent, wrapper, {capture: true});
      },
      isActive: function () {
        return !!details.ontoggle;
      }
    };
    details.ontoggle = wrapper;
    document.body.appendChild(details);
    details.open = true;
    Promise.resolve().then(details.remove.bind(details));
    for (let raceEvent of internals.events)
      window.addEventListener(raceEvent, wrapper, {capture: true});
    return task;
  }
</script>

<script>
  class CheckBox extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({mode: "closed"});
      shadow.innerHTML = `<input type="checkbox">`;
      this._check = shadow.children[0];
      shadow.addEventListener("change", this.bounceEvent.bind(this));

      shadow.addEventListener("change", e=>console.log("1. cap"  + e.timeStamp), true);
      this._check.addEventListener("change",e=> console.log("2. tar" + e.timeStamp));
      shadow.addEventListener("change",e=> console.log("3. bub" + e.timeStamp));
    }

    bounceEvent(e){
      //1. make the bounceEvent clone
      const bounceEvent = new Event(e.type, {composed: false, bubbles: true});
      //2. copy props from e to bounceEvent
      //change has no valuable properties outside of its `target'
      //3. add the task of dispatch the bounceEvent on the host node to run first in the event loop. Set raceEvents to the e.type.
      toggleTick(()=>this.dispatchEvent(bounceEvent), e.type);
    }

    //4. mirroring the properties that the composed event notifies has changed.
    get checked(){
      return this._check.checked;
    }
    set checked(value){
      this._check.checked = value;
    }
  }
  customElements.define("check-box", CheckBox);
</script>

<check-box></check-box>
<script >

  window.addEventListener("change", e=>console.log("4. cap" + e.timeStamp), true);
  document.querySelector("check-box").addEventListener("change",e=> console.log("5. tar" + e.timeStamp));
  window.addEventListener("change", e=>console.log("6. bub" + e.timeStamp));

  window.addEventListener("change", e=> e.target.style.border = e.target.checked ? "2px solid green" : "none");
</script>
```

When we bounce events from an inner element, we also need to mirror the properties of the inner element that those events alert has been changed. In the case of the checkbox above, this means that we need to mirror the `.checked` property of the inner `<input type="checkbox">` on the host node. We accomplish this by adding a setter and a getter for `checked()` on the host node, and then use these two methods as simple mediators to the inner element. The bouncing of the event highlight the need to also mirror essential inner element properties on the host node, a job we otherwise likely would forget about. Not a bad thing.
 
 the developer might wish to "bounce" the event one level in the DOM, ie. wishes to , as it often might not be relevant for the  

Sometimes, you wish a web component to simply mirror/transpose the state change of an internal element. For example, your web component might simply wrap around an existing `<details>` element, and then you wish for the `<details>`'s `toggle` event to echo out of the web component.

## References

 * 