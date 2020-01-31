# HowTo: Control events using HTML?

The DOM is a hierarchy:

1. (Many) CSS properties in the DOM cascade. They trickle down from parent to child nodes, and you can both override and stop (`unset`) this cascade along the way.
2. Similarly, the content (HTML elements) are structured in this way: put text inside a `<h1>`, and that text will be the content of the header element. The texts visual position will be inside the `<h1>`'s position.
3. Events trickle down the DOM during the capture phase, hits its target element, and then bubble up again. The structure of the DOM is reflected in the event propagation path.

So, how can we use the DOM hierarchy to control events' behavior? How can we via HTML elements and HTML attributes in the DOM communicate to and control the functions that control the browsers' events' behavior?   

## HTML element type

The most important means we have to control events' behavior are element types:
 * When we use an `<a href>` instead of a `<span>` it is *first and foremost* to make the browser interpret `click` as a call to navigate to a new page, not to underline the text and color it blue.
 * Similarly, when we use a `<details>` element instead of a `<ul>` it is not because we want a triangle instead of a disc before its first item, but it is because we want the `click` to open up or hide extra content depending on the user's actions.
 
> By choosing an HTML element type, we actively select and connect a) an element/branch in the DOM with b) a particular behavior with c) a particular event.

## Problem 1: nested interactive elements 

> Interactive elements are simply elements that reacts when the user clicks on them, ie. will-react-to-click-elements.
 
What happens if there are:
1. *two* HTML elements in the same propagation path that  
2. *both* has a particular behavior attached to the same event?

For `click` the spec says that "interactive cannot be nested inside each other". According to the spec, it is illegal to place a `<a href>` inside a `<summary>` element. Why? Well, the user might be confused about what might happen if he clicks on it: would the `click` be interpreted as "navigate" or "open details"? This is an easy way out for the spec. And it leaves the rest of us with an unresolved issue. (todo find the parts of the spec that says this) 

Because, there are many valid use-cases for nesting interactive elements. And people do it. And the browsers support it. If there are nested interactive elements, the browser (her Chrome) will first look at the target to see if the target itself has a `click` reaction, and then turn to the rest of the propagation path to find the interactive target for the `click`.

## Demo: HowTo select native `click` actions?

```html
<details>
  <summary>
    <i>Hello</i>
    <a href="#darkness"><b>darkness</b></a>
    <a href="#sunshine">sunshine</a>
  </summary>
  Hello Hello.
</details>

<script>
  const b = document.querySelector("b");
  const i = document.querySelector("i");
  const u = document.querySelector("u");

  window.addEventListener("mousedown", e => console.log(e.type));
  window.addEventListener("mouseup", e => console.log(e.type));
  window.addEventListener("click", e => console.log(e.type));
</script>
```

When you click on:
 * "*Hello*" you get the `<details>` default action of opening up and showing "Hello Hello.".
 * **sunshine** you get the `<a href>` default action adding `#sunshine` to the address bar.
 * **darkness** you *SHOULD HAVE* gotten the `<a href>` default action adding `#darkness` to the address bar. The `<a href>` element is *lower* and *nearer* the target of the `click` than the `<summary>` element. We see the style of the link too. But, Chrome does something else. The browser's native click controller somehow finds the `<summary>` as the most relevant interactive target.

## Demo: naive ClickController

The `ClickController` demo below illustrate the *simplest and most intuitive* means to find the appropriate action for the `click` event. The `ClickController` is very naive: it covers only two of many more click actions and its logic for identifying targets and handling special cases are easily broken. However, as a teaching tool, the naive `ClickController` works wonderfully. 

The demo:
1. completely blocks all the native `click` events, and 
2. creates a `ClickController` object with two functions that listens for both `mousedown` and `mouseup` events.
3. The `ClickController` matches the targets of the previous `mousedown` event with the target of the `mouseup` event to find the `target` for the new event to be dispatched. 
4. The dispatch of the new event on the target is queued i the event loop.
4. But, in addition, when a click is registered, the `ClickController`
   1. finds the *nearest* interactive element from the target upwards,
   2. queues the second task of executing the contextually relevant action for that interactive element in the event loop, and
   3. updates the `.preventDefault()` of the `my-click` event object to be dispatched and already queued, so that if someone calls `.preventDefault()` on it, it can cancel the the second task.    

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

## Principled conclusion

When an event occurs in the DOM, it is natural to assume that the user intends to invoke
> the behavior of the `target` of that event, or the nearest parent of that element.

The spec and browser are vague on this point. But, in this rare instance, you and I shouldn't.
 
If:
 * one event trigger
 * *two* different actions
 * for *two* different elements in the propagation path, and
 * these two actions are mutually exclusive, 
 * and therefore only one should run, then
 * the browser should choose the action of the element in the propagation path *nearest* the target of the event.

Similarly, if an action is associated with an element, and that element is not in the propagation path, then that action should not be run.
 
Several of the native event controller functions evaluate the elements in the propagation path in a similar way as depicted in the ClickController demo. Event controllers are sensitive to the context of the DOM, and often evaluate the propagation path, and sometimes even the surrounding context in the DOM, when their trigger events occur.

## References

 * 
