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
  var clicks = [];
  function updateSequence(e) {
    clicks.push(e);
    if (clicks.length < 3)
      return;
    let duration = clicks[2].timeStamp - clicks[0].timeStamp;
    if (duration <= 600) {
      clicks = [];
      return duration;
    }
    clicks.shift();
  }

  function onClick(e) {
    var duration = updateSequence(e);
    if (!duration)
      return;
    var triple = new CustomEvent("triple-click", {bubbles: true, composed: true, detail: duration});
    dispatchPriorEvent(e.target, triple, e);
  }

  window.addEventListener("click", onClick, true);
})();