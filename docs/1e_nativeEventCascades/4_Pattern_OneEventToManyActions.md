# Pattern: OneEventToManyActions

Some events such as `click` and `touchmove` have *many* possible default actions. These events are quite confusing. And full of if-then semantic logic. We can say such events-to-defaultAction pairs conform to a OneEventToManyActions pattern.

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
 
## Demo: `wheel` to `.scrollTo()`

Some fun facts about wheel based scrolling:
1. ONE `wheel` event often produce around TEN `.scrollTo()` actions!
2. Each `.scrollTo()` action is are divided across eleven `requestAnimationFrame()`.
3. The total distance travelled varies from browser to browser.
4. The scroll is animated by dividing up the distance in the eleven scrolls.

```html
<div style="height: 200vh;">Hello sunshine</div>

<script>
  const raf = function () {
    requestAnimationFrame(function () {
      console.log("raf");
      raf();
    });
  };
  raf();

  let counter = 0;

  function log(e) {
    console.log(e.type, counter++, document.body.scrollTop);
  }

  window.addEventListener("wheel", log, true);
  window.addEventListener("scroll", log, true);

  //call to `.scrollTo()` only produce one scroll action and one scroll event.
  // setTimeout(() => document.body.scrollTo(0, document.body.scrollTop + 50), 1000);
</script>
```
As we can see in the example results below, the first `.scrollTo()` only moves `0.800000011920929`px down. Then it gradually increases until the scroll moves 6.4px from action 5 to 6 and 6 to 7. It then gradually decreases again until the tenth and last scroll action moves 2.4px down. 
```
wheel 0 0
1 0.800000011920929
raf
2 2.4000000953674316
raf
3 5.599999904632568
raf
4 10.399999618530273
raf
5 15.199999809265137
raf
6 21.600000381469727
raf
7 28
raf
8 32.79999923706055
raf
9 37.599998474121094
raf
10 40
raf
11 42.400001525878906
raf
```

## Demo: WheelController

In our demo, we use a simple ease-in-out formula to generate ten scroll steps for each wheel function. The scroll will move a maximum 25% of the page height up or down per wheel event. The wheel animation is naive, it doesn't handle multiple wheel events done in quick succession any different than wheel events done with long pauses in between.

It is also worth to note that the event listener that calls `.preventDefault()` and prevents the native `wheel` event from initiating its own calls to `.scrollTo()` has the event listener property `passive: false` set. The `passive` event listener property is necessary to a) call `.preventDefault()` from `wheel` and `touchstart`/`touchmove` events, which in turn can b) block default `.scrollTo()` actions. More on this later.   

```html
<div style="height: 500vh; background: linear-gradient(white, yellow)">Hello sunshine</div>

<script>
  //turn off the native wheel to scroll action. "wheel" require passive: false for preventDefault() to work.
  window.addEventListener("wheel", e => e.preventDefault(), {capture: true, passive: false});

  //animation t varies from 0 to 1, for example: t=0, then t=0.1, t=0.2, t=0.3, ..., t=1.
  function easeInOutQuint(t) {
    return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
  }

  const WheelController = {
    onWheel: function (e) {
      const target = document.body;
      const down = target.scrollTop;
      const onePageHeight = target.clientHeight * 0.25;
      const maxDistanceDown = Math.min(onePageHeight, target.scrollHeight - (down+target.clientHeight));
      const maxDistanceUp = Math.min(onePageHeight, down);
      const distance = e.deltaY > 0 ? maxDistanceDown : -maxDistanceUp;
      requestAnimationFrame(WheelController.doScroll.bind(null, target, distance/5, 0));
    },
    doScroll: function (target, goal, step) {
      const next = goal * easeInOutQuint(step += 0.091);
      target.scrollTo(0, target.scrollTop + next);
      if (step < 1)
        requestAnimationFrame(WheelController.doScroll.bind(null, target, goal, step));
    }
  };
  window.addEventListener("wheel", WheelController.onWheel, true);

  function logWheel(e) {
    console.log("---- " + e.type);
  }
  function logScroll(e) {
    console.log(e.type, document.body.scrollTop);
  }

  window.addEventListener("wheel", logWheel, true);
  window.addEventListener("scroll", logScroll, true);
</script>
```

## References

 * dunno