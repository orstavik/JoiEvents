# Why: Only one default action?

Two facts:
1. One event type, such as `click`, can trigger several, different default actions. For example, the `<summary>` element `open` the `<detail>` element when `click`ed, while the `<input type="checkbox">` toggles its `checked` property when `click`ed.

2. Elements with different default actions associated to the same event type can be nested. For example, if you place a checkbox inside the summary element: `<summary><input type="checkbox"></summary>` and then `click` on the checkbox, then the default action of both the `<summary>` and the `<input type="checkbox">` elements could potentially be triggered by the same `click` event. 

## Solution: There can be only one

By convention, only *one* default action can be triggered by *one* event instance. The reason for this is that if one event triggered *two or more* default actions at the same time, then two or more different, non-associated state changes would occur at the same time from both the user and app developer perspective. For example, if the user `click` on an `<input type="checkbox">` inside a `<summary>` element, and then running both of the two possible default actions would cause both the checkbox would be switched on/off and the `<details>` element would open/close at the same time. This would be highly confusing behavior: the user would not "see" that the checkbox flipped because the opening/closing of the `<details>` element distracted him/her, or vice versa.

By decree, default actions should therefore exclude each other. If there are more than *one* default action that *can be* associated with an event instance, then the browser should *choose* and run only one. The question is which one?

When choosing a default action, the browser selects the default action associated with the element *nearest* the original `target` element. The browser looks through the propagation path of the event bottom-up, and tries to match each element in the propagation path with its register of default actions until it finds a match. This default action will then be chosen to run, and all the other default actions will be skipped for this particular event.

## Demo: ThereCanBeOnlyOne

In this example, we nest three different elements who all have a default action associated with the `click` event: `<summary>`, `<a href>`, and `<input type="checkbox">`. 

```html 
<details>
  <summary>
    Open summary
    <br>
    <a href="#sunshine">
      Link inside summary
      <input type="checkbox">
    </a>
  </summary>
  Hello Sunshine!!
</details>

<br><br><br>
<button onclick="reset();">Reset</button>
<script>

  function reset(){
    details.open = false;
    input.checked = false;
    location.hash = "";
  }

  function log(e) {
    console.log(e.target.tagName);
    console.log("--------state before default actions:");
    console.log("location.hash: ", location.hash);
    console.log("checkbox.checked: ", input.checked);
    console.log("details.open: ", details.open);
    e.stopPropagation();
    setTimeout(function(){
      console.log("--------state after default actions:");
      console.log("location.hash: ", location.hash);
      console.log("checkbox.checked: ", input.checked);
      console.log("details.open: ", details.open);
      console.log("--------");
    })
  }

  const details = document.querySelector("details");
  const summary = document.querySelector("summary");
  const link = document.querySelector("a");
  const input = document.querySelector("input");
  input.addEventListener("click", log);
  link.addEventListener("click", log);
  summary.addEventListener("click", log);
</script>
```
 * If you `click` on the checkbox (the innermost element), then the checkbox is toggled, but the link and details elements are not activated.
 * If you `click` on the "Link inside the summary", then the link is activated, but the details element remains inactive.
 * If you `click` on the "Open summary", then the details element opens/closes.
 
This demo illustrate that:
 * only a single default action runs for every single event instance, and that
 * the browser chooses the default action of the element in the propagation path that is closest to the `target` of the event.

## Bug: DevilAction

Conflicting actions exclude each other sounds nice. And choosing the default action of the element nearest the `target` sounds even nicer. Wouldn't it be nice if this was always the case? Yes, it would. But, unfortunately, it isn't.

In the example below, the above logic is broken in two cases:

1. `<summary><a href><span>`: If we wrap the text in the link inside a `<span>` element, then when we `click` on the `<span>` element, the action of the topmost element `<summary>` is chosen as the `click` events default action. 

2. Wheel `click` can trigger different default actions for different elements. Wheel `click` on an `<a href>` element will open the link in a new tab/window, while wheel `click` on an `<input type="text">` or `<textarea>` element will paste text into that element from the clipboard.

   But. If we place an `<input>` or a `<textarea>` element inside a `<a href>` element, and then wheel `click` the input element, then the action of the topmost `<a href>` element is chosen as the wheel `click` event's default action, and *not* the action of the `<input>` or `<textarea>` element which is *nearest* the `click` event's `target`.
     
```html
<details>
  <summary>
    <a href="#devilAction">
      <span>this link does strange things..</span>
    </a>
  </summary>
  Hello Sunshine!!
</details>
<hr>
<a href="#sunshine">
  <input type="text" value="hello sunshine">
  <textarea>hello sunshine</textarea>
</a>
<hr>
<input type="text" value="hello world">
<textarea name="" id="">hello world</textarea>
```

## Discussion of devil action
 
Is there a consistent logic behind this behavior? Can we identify another, generic algorithm for choosing default actions? For example, could/should the algorithm choose as the event's  default action a) the `target` element's action first, and then second b) the action of the element highest up in the propagation path hierarchy? No. No, it would be confusing. No, it doesn't explain the behavior of the wheel `click` on input elements inside links.

Neither the spec nor browser implementations fully explain how to resolve conflicting default actions. This is a problem. Especially for developers of reusable web components. One of the key aspects that make native elements reusable is their behavior of *delaying/queueing their reactions to `UIEvent`s in the event loop*. If the native elements would react to events *as `eventListeners` during the trigger events' propagation*, then developers would have a severely more complicated timeline to attend to, to name one of many ergonomical problems:

**The event loop is the *queue* in which reusable elements, native and custom, should queue their reactions when it either a) alters their DOM or b) dispatches an event.** The output of a generic element's *reaction* to outside events should be mediated by the event loop, to maintain conventional order. Event propagation is for in-lightDOM-use mainly.
 
## References