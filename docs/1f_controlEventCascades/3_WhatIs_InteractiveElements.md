# WhatIs: InteractiveElements

Some elements have builtin reactions to certain events. These elements are often referred to as ["interactive elements"](todo mdn or spec). Most commonly, interactive elements react when the user `click`s on them. Naively, we could think of them as "clickable elements". But, the event doesn't have to be a `click`; it could react to other event's such as `wheel` or `mousedown` instead of/in addition to `click`. 

(todo check the list of interactive elements, find out if they all react to click and if some of them react to other events too.)

Interactive elements is the primary mean to control events' behavior in HTML. By wrapping our content inside interactive elements, we give the content a behavior (and often a little style to facilitate the new behavior:
 * When we use an `<a href>` instead of a `<span>` it is *first and foremost* to make the browser interpret `click` as a call to navigate to a new page, not to underline the text and color it blue.
 * Similarly, when we use a `<details>` element instead of a `<ul>`, it is not because we want a triangle instead of a disc before its first item, but it is because we want the user to open up or hide extra content via `click`.
 
> By choosing an HTML element type, we actively select and connect a) an element/branch in the DOM with b) a particular event with c) a particular set of actions.

## Problem: nested interactive elements 

But. HTML elements can be nested. What if we nest interactive elements?

The spec essentially says that "interactive elements cannot be nested inside each other" (todo). According to the spec, it is illegal to place an `<a href>` inside a `<summary>` element for example. According to the spec, this never happens, the problem doesn't exist, the browser shouldn't support it, and implicitly that the use-case doesn't exist. But. This is all wrong. Nested interactive elements happen, the problem is real, the browser partially supports it, and there are real use-cases for it.
  
 > If I were to speculate about why nested interactive elements are illegal in the spec I would guess that the early browsers had no good idea about how to resolve the conflict of element actions. For example, if you nest a link inside a details summary, then should a click on the link "navigate" or open the details body? The spec then chose an easy way out: no such conflicts allowed, and left the rest of us to figure out this dilemma on our own.

So, how does the browsers' handle nested interactive elements when they actually render and run them?

## Demo: link in details, details in link

In the demo below, you will see the following results:

1. Some interactive elements *can be* nested inside each other. Others can't. The `<summary>` accepts the `<a href>` as a child, but the browser doesn't accept the `<summary>` as a child of `<a href>`. 
2. `click` only creates *one* reaction from *one* of the elements. If an `<a href>` is nested inside a `<summary>` element, then they wont both react to the `click`.
3. But, there is a problem. There is no clear concise logic that regulate which interactive element is selected. Chrome, for example, seems to select the target first, and then bottom-down the propagation path. This is strange.

```html
<details>
  <summary>
    <i>Hello</i>
    <a href="#darkness"><b>darkness</b></a>
    <a href="#sunshine">sunshine</a>
  </summary>
  Hello Hello.
</details>

<!--
  This piece of template is rendered very strangely.
<a href="#iRenderVeryStrangely">
  <details>
    <summary>Hello</summary>
    Hello Hello.
  </details>
</a>
-->

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

The `ClickController` demo below illustrate the *simplest and most intuitive* means to find the appropriate interactive element for the `click` event. The `ClickController` is very naive: it covers only two of many more click actions and its logic for identifying targets and handling special cases are easily broken. However, as a teaching tool, the naive `ClickController` works wonderfully. 

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

## Discussion

`click` is not the only event that will cause such conflicts between targets. As we will see in the next chapters, there is an abundance of conflicts between both targets within one event controller as depicted above and between targets and potential event controllers triggered by the same trigger events (yes, touch and mouse and drag, I am thinking of you..).


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
