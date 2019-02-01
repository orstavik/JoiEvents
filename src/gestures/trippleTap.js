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
  var tripleClickSequence;

  function startSequence(e) {
    window.addEventListener("touchend", onTouchend, true);
    return [];
  }

  function updateSequence(e) {
    tripleClickSequence.push(e.timeStamp);
    if (tripleClickSequence.length < 3)
      return;
    if (tripleClickSequence[2] - tripleClickSequence[0] <= 600) {
      window.removeEventListener("touchend", onTouchend, true);
      return tripleClickSequence;
    }
    tripleClickSequence.shift();
  }

  function onTouchend(e) {
    var tripple = updateSequence(e);
    if (!tripple)
      return;
    tripleClickSequence = undefined;
    dispatchPriorEvent(e.target, new CustomEvent("tripple-tap", {bubbles: true, composed: true, detail: tripple}), e);
  }

  function onTouchstart(e) {
    e.preventDefault();      //[1] block default touch actions such as scroll (for all touchstarts)
    if (!tripleClickSequence)
      tripleClickSequence = startSequence(e);
  }

  window.addEventListener("touchstart", onTouchstart, true);
})();

//1. GrabTouch pattern.
//   The best way to stop touch default actions is .preventDefault() on touchstart.