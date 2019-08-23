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

  function onMousedown(e) {
    if (e.button !== 0)                           //[1]
      return;
    primaryEvent = e;
  }

  function onMouseup(e) {
    if (!primaryEvent || e.button !== 0)          //[2]
      return;
    var duration = e.timeStamp - primaryEvent.timeStamp;

    if (duration > 300) {
      var longPress = new CustomEvent("long-press", {bubbles: true, composed: true, detail: {duration: duration}});
      dispatchPriorEvent(e.target, longPress, e);
    }
    primaryEvent = undefined;
  }

  window.addEventListener("mousedown", onMousedown, true);
  window.addEventListener("mouseup", onMouseup, true);
})();