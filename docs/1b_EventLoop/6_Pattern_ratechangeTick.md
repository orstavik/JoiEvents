# Pattern: `ratechangeTick`

The `<audio>` element is well supported. And the `<audio>` element will dispatch several events, among them `ratechange` when their `.playbackRate` is altered. 

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

## References

  * dunno