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
    var myValues = {click: e, x: e.x, y: e.y};
    clicks.push(myValues);
    if (clicks.length < 3)
      return;
    var duration = clicks[2].click.timeStamp - clicks[0].click.timeStamp;
    var wiggle = Math.abs(clicks[2].x-clicks[0].x) + Math.abs(clicks[2].y-clicks[0].y);
    if (duration <= 600 && wiggle < 20) {
      clicks = [];
      return {duration: duration, wiggle: wiggle};
    }
    clicks.shift();
  }

  function onClick(e) {
    var detail = updateSequence(e);
    if (!detail)
      return;
    var triple = new CustomEvent("triple-click", {bubbles: true, composed: true, detail: detail});
    dispatchPriorEvent(e.target, triple, e);
  }

  window.addEventListener("click", onClick, true);
})();