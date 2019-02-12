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
    if (tripleClickSequence[2].timeStamp - tripleClickSequence[0].timeStamp <= 600) {
      var result = tripleClickSequence.map(function (e) {
        return e.timeStamp;
      });
      tripleClickSequence = [];
      return result;
    }
    tripleClickSequence.shift();
  }

  function onClick(e) {
    var tripple = updateSequence(e);
    if (tripple)
      return;
    var click3 = new CustomEvent("tripple-click", {bubbles: true, composed: true, detail: tripple});
    dispatchPriorEvent(e.target, click3, e);
  }

  window.addEventListener("click", onClick, true);
})();