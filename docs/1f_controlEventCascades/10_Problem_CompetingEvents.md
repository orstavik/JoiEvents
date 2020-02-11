# Problem: CompetingEvents

Events compete with each other over preference, control and dispatch to the DOM. We have seen such  conflicts already. The first conflict was which element's default action to choice for the `click` event. The second conflict was how the `drag` events took control and hid the `mouse...` events. And there are more examples, such as wait 300ms before dispatching `click` to see if double tap was meant to be a zoom.  But, what are these conflicts about? How can we understand these conflicts better? How can we break them down?

## Demo: native `mouseup` event cascade

```html
<textarea>
1. dblclick me!
2. Wheel-click me!
</textarea>

<script>
  function log(e){
    console.log(e.type);
  }
  const textarea = document.querySelector("textarea");

  textarea.addEventListener("mouseup", log);
  textarea.addEventListener("click", log);
  textarea.addEventListener("dblclick", log);
  textarea.addEventListener("select", log);
  textarea.addEventListener("auxclick", log);
  textarea.addEventListener("focus", log);
</script>
```

In Chrome, the following actions produce the following events:
 * A single click => `focus`, `mouseup`, `click`.
 * A double click => `focus`, `mouseup`, `click`, `mouseup`, `click`, `dblclick`, `select`.
 
## 

Basically, there's one reason for such conflicts. 
1. One event can have *several* different meanings depending on the situation.
2. These possible interpretations/consequences of an event are often mutually exclusive: you don't want the same `click` to perform *both* navigation on a link *and* opening up a `<details>` element. That would confuse.
3. Some event interpretations *choose one browser actions*. The browser usually chooses only one such action, but in principle, the browser could queue a whole host of different types of actions in the event loop in response to a single event.
4. Some event interpretations *choose one or more subsequent event (series)*. A `mouseup` can spawn a `click`, which in turn triggers a `dblclick`, and a `select`, or just an `auxclick`, or no other event at all.
4. Other 
3. But. Sometimes the semantic rules for an event are ambiguous in a certain contexts. For example, the spec says that `<a>` cannot be placed inside another interactive element such as `<summary>`. But the browsers still allows this, (which is good, since the spec is weak at this point), but the browsers then do not specify how its `click` target is selected. 
4. This ambiguity, ie. DOM situations that an event's semantic rules can interpret in several directions,  conflicts that result in either the 
 
 thankfully,  matches that regulate *what* a particular  to a new page  Thus, an event may trigger one or more of other events/actions, and these other events/actions form a set of possibilities. Sometimes, these sets can be fitted together. We can add  these sets of possibilities overlap.  events/actions when more events   Event A might potentially trigger one or more other events or actions from a set of several potential candidates.  We can say that event A can trigger other events and actions A1, A2, A3.  there are two reasons for these conflicts:
 * UniversalEvent has several interpretations depending on the DOM.
 * UniversalEvent has several interpretations depending on the event sequence.
   
## UniversalEvent has several interpretations depending on the DOM.

1. Some events can mean many different things, *viewed against a universal DOM context*. A `click` can for example mean to toggle an `<input type="checkbox">`, `<a href>` navigation, or to close a `<details>` element. 
2. It is only when we place the `click` event on a particular target element in a particular DOM that we can say what that event means. The DOM provides a context that *selects* a potential meaning from the `click` event.

So how does the browser *choose* which meaning an event should have from the DOM context?

1. Nearest parent to the target. If the nearest ancestor is a `<a href>`, then the `click` means link navigation. If the nearest ancestor is a `<summary>`, then the `click` means toggle a `<details>` element.   
2. HTML attributes such as `draggable="true"`. If a target ancestor for the `mousedown` event has this attribute, then the browser will interpret and cast the `mouse` events as `drag` events (if other contextual criteria match as well).
3. CSS properties such as `user-select` and `touch-action`. If a target ancestor defines such properties, these properties control how the browser will interpret an event.
4. Event listener properties. And there is only one: `passive`. If `passive: false` for all event listener in the propagation path *before event propagation begins*, then scrolling will commence before and continue on regardlessly `touchmove` event propagation (it doesn't help to add one dynamically) (and this is theoretical, in practice the browser's treat active (ie. `passive: false`) event listeners on the `window` element differently).

> It is worth noting that *most* of the most difficult and semantically based logic in the browser is covered by the four means the DOM can control event interpretation. Thus, if we can provide a clear conceptual model for how events should be controlled, we might be able to make the web platform a little clearer. 

## UniversalEvent has several interpretations depending on event sequence.

1. Some events can mean many different things, *viewed against a universal context of event sequences*. For example, a primary button `mouseup` can mean either a `drangend`, a `click`, or neither. A `mousemove` can initiate a `dragstart` event, or do nothing special. And if you simply *not* remove your `touch` finger for a longer period, a `touchstart` becomes a `long-press`.  
2. The browser interprets the meaning of many such events not only from itself and the event's propagation path/DOM context, but also from what the browser knows about previous events such as `mousedown`.
3. The browser therefore keeps a register of previous, relevant events, and it uses this register to identify and interpret the meaning of current events.

## Interpretation as conflict resolution
 
Thus, there are *two* main sources the browser uses to interpret the meaning of an event:
1. the DOM and its elements' types, HTML attributes, CSS properties, and event listener properties, and
2. the event session (previous events and the passing of time).

When the browser selects a meaning, the browser often deselect and turn off others. When `drag` is selected, `mouse` is turned off. When scrolling is disabled, then scroll can be used for other purposes.

## 
 

## References

 * dunno
 
 
## OLD














```html
<h1>Hello sunshine!</h1>

<script>
  function log(e){
    console.log(e.type);
  }

  const h1 = document.querySelector("h1");

  h1.addEventListener("mousedown", log);
  h1.addEventListener("focus", log);
  h1.addEventListener("contextmenu", log);
</script>
```

In Chrome, the following actions produce the following events:
 * Mousedown with primary button when the `<input>` doesn't have focus: `mousedown`, `focus`.
 * Mousedown with primary button when the `<input>` has focus: `mousedown`.
 * Mousedown with right button when the `<input>` doesn't have focus: `mousedown`, `focus`, `contextmenu`.
 * Mousedown with right button when the `<input>` has focus => `mousedown`, `contextmenu`.


`mousedown`-`.focus()`-`focus`/`blur` event cascade


## Parallel EventControllers

We can conceptually view this process as being driven by *two, parallel* EventControllers:
1. FocusController 
1. ContextmenuController
 
The FocusController listens for all `mousedown` events. If a `mousedown` is done on an `<input>` or `<textarea>` element that does not have focus, then the FocusController will call `.focus()` on the mousedown target.

Immediately after the 
 
 and dispatches a `focus` event *synchronously* and *before* the `mousedown` event is dispatched. 
2. ClickController that listens for ``

## Demo: four naive EventControllers

In the demo below we will implement *two* naive a `ClickController` object essentially recreates parts of the logic of the `click` event cascade. The `ClickController` is very naive: it covers only two of many more click actions and its logic for identifying targets and handling special cases are easily broken. However, as a teaching tool, the naive `ClickController` works wonderfully. 

The demo:
1. completely blocks all the native `click` events, and 
2. creates a `ClickController` object with two functions that listens for both `mousedown` and `mouseup` events.
3. The `ClickController` matches the targets of the previous `mousedown` event with the target of the `mouseup` event to find its click target.
4. Once the `ClickController` perceives a click, it
   1. creates a new `my-click` event,
   2. queues the first task of dispatching the new event in the event loop,
   3. finds the appropriate interactive target,
   4. queues the second task of executing the contextually relevant action in the event loop, and
   5. updates the `.preventDefault()` of the `my-click` event object, so that if someone calls `.preventDefault()` on it, this will cancel the the second task.    

The ClickController is sensitive to the context of the DOM at the time when the click event occurs 

```html
<details>
  <summary>
    <i>Hello</i>
    <a href="#sunshine"><b>sunshine</b></a>
    <u>(.preventDefault())</u>
  </summary>
</details>

<script>
  //block all native click events and stops their default actions
  window.addEventListener("click", function (e) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }, true);

  function naiveClickTarget(as, bs) {
    let sharedTarget;
    for (let i = 0; i < as.length && i < bs.length; i++) {
      if (as[i] !== bs[i])
        return sharedTarget;
      sharedTarget = as[i];
    }
    return sharedTarget;
  }

  function findClickable(target) {
    if (["A", "SUMMARY"].indexOf(target.tagName) >= 0)
      return target;
    const parentNode = target.parentNode || target.host || target.defaultView;
    if (parentNode)
      return findClickable(parentNode);
    return target;
  }

  const ClickController = {
    downPath: undefined,
    upPath: undefined,
    onMousedown: function (mousedownEvent) {
      if (mousedownEvent.button !== 0)
        return;
      ClickController.downPath = mousedownEvent.composedPath().reverse();
    },
    onMouseup: function (mouseupEvent) {
      if (mouseupEvent.button !== 0)
        return;
      ClickController.upPath = mouseupEvent.composedPath().reverse();
      const sharedTarget = naiveClickTarget(ClickController.upPath, ClickController.downPath);
      const myClickEvent = new CustomEvent("my-click", {composed: true, bubbles: true});
      const task1 = setTimeout(function () {
        sharedTarget.dispatchEvent(myClickEvent);
      });
      const interactive = findClickable(sharedTarget, ClickController.upPath);
      const task2 = setTimeout(function () {
        if (interactive.tagName === "A")
          location.href = new URL(interactive.href, location.href).href;
        else if (interactive.tagName === "SUMMARY")
          interactive.parentNode.open = !interactive.parentNode.open;
      });
      Object.defineProperty(myClickEvent, "preventDefault", {
        value: function () {
          clearTimeout(task2);
        }
      });
    }
  };

  window.addEventListener("mousedown", ClickController.onMousedown, true);
  window.addEventListener("mouseup", ClickController.onMouseup, true);

  const b = document.querySelector("b");
  const i = document.querySelector("i");
  const u = document.querySelector("u");

  window.addEventListener("mousedown", e => console.log(e.type));
  window.addEventListener("mouseup", e => console.log(e.type));
  window.addEventListener("click", e => console.log(e.type));
  window.addEventListener("my-click", e => console.log(e.type));

  u.addEventListener("my-click", e => e.preventDefault());
</script>
```    

When you click on:
 * "*Hello*" you get the `<details>` default action of opening up and showing "Hello Hello.".
 * **sunshine** you get the `<a href>` default action adding `#sunshine` to the address bar. This demo doesn't include any darkness, as this part of the algorithm is... a little better than the one in Chrome. 
 * "(.preventDefault())" you get no default action.


Most event cascades are event-action-event cascades.
1. First, an event triggers a browser action that changes the state of the DOM or the browser.
2. Then, the state change triggers a second event.


 
 
## OLD Native conceptual model

The browser and spec is a little bit all over the place with this one:

1. The spec simply disallows "interactive elements" such as `<a href>` and `<summary>` to be nested inside each other. `click`-conflicts between elements are simply *not allowed*. This doesn't solve anything as the conflict between the default actions of `click` are not the only conflicting choices for choosing which mouse and touch event should be chosen (wait 300ms for click to allow for doubletap to zoom? how many pixels can a user move a mouse to avoid triggering a drag event?).

   The browsers take a more pragmatic approach to click conflict resolution, and will handle conflicts between clickable elements as described in chapter OneToMany. However, they can fudge the "closest to target" principle, and their logic for handling such "illegal conflicts" is not well documented.
   
2. When it comes to the `draggable="true"` attribute, there are two problems. What if there are *more* than one type of events that could be attached to the same element? What if there existed a `pressable="true"` attribute and it was added to the same element? If the user pressed for 600ms or the given requirement for a `long-press` event, but at the same time moved the mouse enough to trigger the `dragstart` sequence to begin? Should we get *both* a `long-press` and `drag` events? Or should one trump the other? And what if we wanted to keep the `click` event during dragging, or remove `click` events if a `long-press` was triggered?

   This might seem like a highly theoretical discussion as no `long-press` event exists. But it is not. This discussion is actually the *reason* why a proper set of reusable `long-press`, `swipe`, `fling` and other touch and mouse based events do not exist. We need to have a better, more principled framework to solve such conflicts that scale. The current model on the web does not scale, and therefore we are for now stuck with the limited set of events the browser gives us, and the limited sets of events the frameworks manage to squeeze into the same, semantic based conflict resolution scheme.
   
3. The CSS properties has been added one by one as the browser       
   
