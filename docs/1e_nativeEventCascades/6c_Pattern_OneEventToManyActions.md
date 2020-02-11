# Pattern: OneEventToManyActions

Some events such as `click` and `touchmove` have *many* possible default actions. These events are quite confusing. And full of if-then semantic logic. We can say such events-to-defaultAction pairs conform to a OneEventToManyActions pattern.
 
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