# Pattern: `ratechangeTick`

The `<audio>` element is well supported. And the `<audio>` element will dispatch several events, among them `ratechange` when their `.playbackRate` is altered. 

## Implementation: `ratechangeTick`

Fun facts about the `ratechange` event:

1. The `ratechange` event will dispatch ***before* the `src` property is added** to the `<audio>` element. This makes it possible to trigger `ratechange` events at a very low cost.

2. The `<audio>` element **does not have to be connected** to the DOM to dispatch a `ratechange` event. Combined with the point above, this makes it possible to trigger `ratechange` events super fast! 

3. There are two bugs with `ratechange` in Firefox.
   1. `ratechange` event listeners can be triggered an extra time when the `<audio>` element is removed from the DOM.
   2. The `<audio>` element will display an erroneous error message if it is removed using `document.head.removeChild(audio)` instead of `audio.remove()`. 

```javascript
function ratechangeTick(cb){
  var audio = document.createElement("audio");
  audio.onratechange = cb;
  audio.playbackRate = 2;
} 
```          

## Demo: async `ratechange` 

But, funniest of all is the fact that `ratechange` events triggered by script induced changes of the `playbackRate` property on script created `<audio>` elements are dispatched *async* in the browser. 

```html
<script>
  const audio = document.createElement("audio");
  audio.addEventListener("ratechange", function () {
    console.log("a")
    Promise.resolve().then(function(){
      console.log("a prt")});
  });
  audio.addEventListener("ratechange", function () {
    console.log("b")
    Promise.resolve().then(function(){
      console.log("b prt")});
  });
  audio.playbackRate = 2;
</script>
```

Results in:

```
a
a prt
b
b prt
```

This little demo above opens the door for a huuuge op opportunity to not only create a macrotask, but also a macrotask with a partially fixed set of mesotasks.


## Demo: Dynamic, async `ratechange` 
```html
<script>
  var span = document.createElement("span");
  var audio = document.createElement("audio");
  span.appendChild(audio);
  
  span.addEventListener("ratechange", function () {
    console.log("a")
    Promise.resolve().then(function (){
      console.log("a microtask");
    });
  }, true);     //!! note, capture: true, as ratechange is non-bubbling

  span.addEventListener("ratechange", function(){
    audio.addEventListener("ratechange", function () {
      console.log("c")
      Promise.resolve().then(function(){
        console.log("c microtask");
      });
    });
  }, true);   //!! note, capture: true, as ratechange is non-bubbling
  audio.addEventListener("ratechange", function () {
    console.log("b")
    Promise.resolve().then(function (){
      console.log("b microtask");
    });
  });         //!! note, the audio element is the target, so capture: true is irrelevant.
  audio.playbackRate = 2;
  console.log("one");
</script>
```

Results in:

```
one
a
a microtask
b
b microtask
c
c microtask
```

## References

  * dunno
  
### old draft

## Reuse of `<audio>` elements?

The simple `ratechangeTick(cb)` above is super smooth. But. Is there anything to be gained by resuing the `<audio>` elements?

To reuse the `<audio>` elements, we need to cache an array of `<audio>` elements. We also need a wrapper function that adds the `<audio>` element to the cache array when it has been used.

```javascript
var audios = [];
function reuseRatechangeTick(cb) {
  var audio;
  if (audios.length){
    audio = audios.shift();
    audio.cb = cb;
    audio.playbackRate = !audio.playbackRate;
  } else {
    audio = document.createElement("audio");
    audio.cb = cb;
    audio.onratechange = function(){
      audios.push(audio);
      audio.cb();
    }
    audio.playbackRate = 2;
  }
}
```

The performance of `ratechangeTick` depends on the browser:
1. In WebKitGTK 2.26.4 (Linux WebKit June2020) `reuseRatechangeTick(cb)` is twice as fast.
2. In Firefox 76 and Chrome 81 the reusable `reuseRatechangeTick(cb)` is just as faste as the simpler `ratechangeTick(cb)`, or slightly slower.