(function () {
  function dispatchPriorEvent(target, composedEvent, trigger) {
    composedEvent.preventDefault = function () {
      trigger.preventDefault();
      trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
    };
    composedEvent.trigger = trigger;
    return target.dispatchEvent(composedEvent);
  }

  var primaryEvent;

  function resetSequenceState() {
    primaryEvent = undefined;
    window.removeEventListener("mouseup", onMouseup);
  }

  function onMousedown(e) {
    if (e.button !== 0)
      return;
    primaryEvent = e;
    window.addEventListener("mouseup", onMouseup);
  }

  function onMouseup(e) {
    var duration = e.timeStamp - primaryEvent.timeStamp;
    //trigger long-press iff the press duration is more than 300ms ON the exact same mouse event target.
    if (duration > 300 && e.target === primaryEvent.target)
      dispatchPriorEvent(
        e.target,
        new CustomEvent("naive-long-press", {bubbles: true, composed: true, detail: duration}),
        e
      );
    resetSequenceState();
  }

  window.addEventListener("mousedown", onMousedown);
})();