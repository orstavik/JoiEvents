# Problem: ConflictingActions

ConflictingActions occur in the following situation:
1. Several HTML elements have different default actions associated with the same trigger event. For example, the `<summary>` element `open` the `<detail>` element when `click`ed, while the `<input type="checkbox">` toggles its `checked` property when `click`ed.

2. If such elements are nested, their default actions will overlap and possibly conflict with each other. For example, if you place a checkbox inside the summary element: `<summary><input type="checkbox"></summary>` and then `click` on the checkbox, then the default action of both the `<summary>` and the `<input type="checkbox">` elements could potentially be activated. 

## Solution 1: Default actions exclude each other.

For many default actions, it would be confusing for the user if *one* trigger event caused *two* default actions to occur at the same time. For example, if an `<input type="checkbox">` is placed inside a `<summary>` element, and the user then `click`ed the `<input type="checkbox">`, then the user likely would expect the `click` only to toggle the checkbox, and not to also trigger the `<summary>` element to `open` its parent `<details>` element. 

The solution here is:
1. make the default actions exclude each other and run only *one* conflicting default action per trigger event, and
2. select this action based on proximity to the target of the trigger event. Ie. the element *nearest* the `target` element of the trigger event in the propagation path wins, and the default action associated with this element will override/block any conflicting default actions of any ancestor elements for the same trigger event. In our example, if you `click` on an `<input type="checkbox">` inside a `<summary>` element, then only the default action of toggling the checkbox is run, not the default action of the `<summary>` element that would open/close its parent `<details>` element.

## Demo: ThereCanBeOnlyOne

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

## Bug: DevilAction

Conflicting actions exclude each other sounds nice. And choosing the deepest default action, ie. the action *nearest* the target of the trigger event, sounds even nicer. Wouldn't it be nice if this was always the case? But, of course, it isn't.

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

## Discussion
 
Is there a consistent logic behind this behavior? Can we identify another, generic algorithm for choosing default actions? For example, could/should the algorithm choose as the event's  default action a) the `target` element's action first, and then second b) the action of the element highest up in the propagation path hierarchy? No. No, it would be confusing. No, it doesn't explain the behavior of the wheel `click` on input elements inside links.

Neither the spec nor browser implementations fully explain how to resolve conflicting default actions. This is a problem. Especially for developers of reusable web components. One of the key aspects that make native elements reusable is their behavior of *delaying/queueing their reactions to `UIEvent`s in the event loop*. If the native elements would react to events *as `eventListeners` during the trigger events' propagation*, then developers would have a severely more complicated timeline to attend to, to name one of many ergonomical problems:

**The event loop is the *queue* in which reusable elements, native and custom, should queue their reactions when it either a) alters their DOM or b) dispatches an event.** The output of a generic element's *reaction* to outside events should be mediated by the event loop, to maintain conventional order. Event propagation is for in-lightDOM-use mainly.
 
## Principal solution to conflicting default actions
  
When two or more default actions are added to the same trigger event, then the solution is the following model:

1. **Non-conflicting, non-preventable default actions**. Some default actions should be considered independent. These default actions can run in parallel with other default actions, either consistently before or consistently after them, without causing any problems. These default actions are often non-preventable, ie. they cannot be cancelled by calling `.preventDefault()` on their triggering event. An example of such a default action is the task that creates and dispatches `dblclick` events when two `click` events occur at the same time on an element.

2. **Conflicting, preventable default actions**  Other default actions should be considered conflicting with each other. These default actions should not run as a response to the same trigger event, but instead exclude each other. 
   * **conflict resolution algorithm for default actions**: Any default action must be associated with both a) the trigger event and b) an element in the propagation path. Some default actions are associated with the generic `HTMLElement` type, some with a particular element type such as `HTMLAnchorElement`. If two or more conflicting actions are:
       1. associated with the same trigger event but different elements in the propagation path, then the default action of the event should be the action associated with the lowest most element, ie. the element *nearest* the `target` of the trigger event.
       2. associated with the same trigger event and the same element in the propagation path, then the default action of the event should be the action whose controlling function was last registered by the browser. A hypothetical example of such a conflict occuring would be `<div draggable="true" long-pressable="true">`.

Non-conflicting default actions are usually non-preventable, and vice versa.
       
To create conflicting, but non-preventable default actions is bad practice. The conflicting aspect of the elements behavior would likely encounter situations were the developer would like to be able to prevent them, and therefore they should be set up as preventable too.        

To create non-conflicting, but preventable default actions is less problematic. But, it is mostly unnecessary. If you need to make non-conflicting default actions preventable, you should instead dispatch an event first *before* executing any DOM mutations or other functions *and* use the `preventDefault()` in this precursor event to block the DOM mutation or other function. This pattern follows the pattern of both `mousedown` => `contextmenu` => "show context menu" event cascade and the `click` => `reset` => "reset HTML form data".         

## References