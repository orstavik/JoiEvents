# Pattern: `await nextTick(cb)`

In es6, we have the beautiful syntax of `async` and `await`. This syntax is primarily associated with microtask Promises, but there is not problem making functions that return a `Promises` that wait for a macrotask to complete.

## `await setTimeout()`

```javascript
class FlushablePromise extends Promise {
  constructor(promiseFunction, audio) {
    super(promiseFunction);
    this.audio = audio;
  }
  flush() {
    if (!this.audio.promiseResult)
      this.audio.onratechange();
    return this.audio.promiseResult;
  }
  isResolved() {
    return !!this.audio.promiseResult;
  }
}
function nextTick(fun) {
  const audio = document.createElement("audio");
  document.head.appendChild(audio);
  audio.playbackRate = 2;
  //Promise.resolve().then(audio.remove.bind(audio));
  return new FlushablePromise(function (resolve, reject) {
    audio.onratechange = function () {
      audio.onratechange = undefined;
      audio.remove();
      resolve(audio.promiseResult = fun());
    };
  }, audio);
}


``` 

## Implementation: `ratechangeTick`

A fun fact about the `ratechange` event is that it will dispatch *before* the `<audio>` element has been given a `src` property. And this means that there is a possibility it might be an efficient means to queue a high or low priority task in the event loop.

Another fun fact about the `ratechange` event is that there are two bugs associated with it in Firefox.
1. The `onratechange` can be triggered an extra time when the element is removed from the DOM.
2. The `<audio>` element will display an erroneous error message if it is removed using `document.head.removeChild(audio)` instead of `audio.remove()`. 
 
And, for the all time funniest fact, the `<audio>` element does not have to be connected to the DOM to dispatch a `ratechange` event(!!). And. That makes queuing the `ratechange` event super light and super fast! 

```javascript
function ratechangeTick(cb){
  var audio = document.createElement("audio");
  audio.onratechange = cb;
  audio.playbackRate = 2;
} 
```

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

## References

  * dunno