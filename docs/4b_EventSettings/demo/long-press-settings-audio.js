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
  var audioTimer;

  function onMousedown(e) {
    if (e.button !== 0)
      return;
    primaryEvent = e;
    audioTimer = setTimeout(function() {
      const audioSelector = primaryEvent.target.getAttribute("use-long-press-audio");
      if (!audioSelector)
        return;
      const audioEl = document.querySelector(audioSelector);
      if (!audioEl)
        return;
      audioEl.play();
    }.bind(this), 1000);
    window.addEventListener("mouseup", onMouseup);
  }

  function onMouseup(e) {
    var duration = e.timeStamp - primaryEvent.timeStamp;
    //trigger long-press iff the press duration is more than the long-press-duration EventSetting
    if (duration > 1000){
      let longPress = new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration});
      dispatchPriorEvent(e.target, longPress, e);
    }
    primaryEvent = undefined;
    clearTimeout(audioTimer);
    window.removeEventListener("mouseup", onMouseup);
  }

  window.addEventListener("mousedown", onMousedown, true);
})();