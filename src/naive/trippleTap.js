(function () {
  function dispatchPriorEvent(target, composedEvent, trigger) {
    composedEvent.preventDefault = function () {
      trigger.preventDefault();
      trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
    };
    composedEvent.trigger = trigger;
    target.dispatchEvent(composedEvent);
  }

  //event state
  var tripleClickSequence = [];

  function updateSequence(e) {
    tripleClickSequence.push(e);
    if (tripleClickSequence.length < 3)
      return;
    if (tripleClickSequence[2].timeStamp - tripleClickSequence[0].timeStamp <= 600){
      var result = tripleClickSequence.map(function(e){return e.timeStamp});
      tripleClickSequence = undefined;
      window.addEventListener("touchend", onTouchend, true);
      return result;
    }
    tripleClickSequence.shift();
  }

  function onTouchend(e) {
    var tripple = updateSequence(e);
    if (!tripple)
      return;
    dispatchPriorEvent(e.target, new CustomEvent("tripple-tap", {bubbles: true, composed: true, detail: tripple}), e);
  }

  function onTouchstart(e) {
    // e.preventDefault();                                   //missing block of double-tap-to-zoom and swipe-to-scroll
    window.addEventListener("touchend", onTouchend, true);
  }

  window.addEventListener("touchstart", onTouchstart, true);
})();