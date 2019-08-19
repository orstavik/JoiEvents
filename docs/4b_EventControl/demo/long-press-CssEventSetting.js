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
  var setDuration;

  function onMousedown(e) {
    if (e.button !== 0)
      return;
    primaryEvent = e;
    const durationText = getComputedStyle(e.target)["--long-press-duration"];
    if (durationText)
      setDuration = parseInt(durationText);
    window.addEventListener("mouseup", onMouseup);
  }

  function onMouseup(e) {
    var duration = e.timeStamp - primaryEvent.timeStamp;
    //trigger long-press iff the press duration is more than the --long-press-duration EventSetting
    if (duration > (setDuration || 300)){
      let longPress = new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration});
      dispatchPriorEvent(e.target, longPress, e);
    }
    primaryEvent = undefined;
    window.removeEventListener("mouseup", onMouseup);
  }

  window.addEventListener("mousedown", onMousedown, true);
})();