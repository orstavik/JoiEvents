# Pattern: OneToMany

Some events such as `click` and `touchmove` have *many* possible default actions. These events are quite confusing. And full of if-then semantic logic. We can say such events-to-defaultAction pairs conform to a OneToMany pattern.

## Demo: native `click` actions

```html
<details>
  <summary>
    <i>Hello</i>
    <a href="#darkness"><b>darkness</b></a>
    <a href="#sunshine">sunshine</a>
    <u>(.preventDefault())</u>
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

  u.addEventListener("click", e => e.preventDefault());
</script>
```

When you click on:
 * "*Hello*" you get the `<details>` default action of opening up and showing "Hello Hello.".
 * **sunshine** you get the `<a href>` default action adding `#sunshine` to the address bar.
 * **darkness** you *SHOULD HAVE* gotten the `<a href>` default action adding `#darkness` to the address bar. The `<a href>` element is *lower* and *nearer* the target of the `click` than the `<summary>` element. We see the style of the link too. But, this doesn't happen. Instead, the browser's native click controller somehow finds the `<summary>` as the most relevant interactive target.
 * "(.preventDefault())" you get no default action.

## Demo: naive ClickController

In the demo below a `ClickController` object essentially recreates parts of the logic of the `click` event cascade. The `ClickController` is very naive: it covers only two of many more click actions and its logic for identifying targets and handling special cases are easily broken. However, as a teaching tool, the naive `ClickController` works wonderfully. 

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

## References

 * dunno