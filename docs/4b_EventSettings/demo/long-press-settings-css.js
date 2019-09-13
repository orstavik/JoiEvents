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
  var duration;

  function onMousedown(e) {
    if (e.button !== 0)
      return;
    primaryEvent = e;
    let durationText = getComputedStyle(e.target).getPropertyValue("--long-press-duration");
    if (!durationText)
      duration = 300;
    else {
      durationText = durationText.trim();
      const num = parseInt(durationText);
      if (num < 0)
        return;
      if (durationText === (num + "ms")){
        duration = num;
      }else if (durationText === (duration  + "s")){
        duration *= 1000;
      } else { //illegal value
        return;
      }
    }
    window.addEventListener("mouseup", onMouseup, true);
  }

  function onMouseup(e) {
    const timePressed = e.timeStamp - primaryEvent.timeStamp;
    //trigger long-press iff the press duration is more than the --long-press-duration EventSetting
    if (timePressed > duration){
      let longPress = new CustomEvent("long-press", {bubbles: true, composed: true, detail: {duration: timePressed}});
      dispatchPriorEvent(e.target, longPress, e);
    }
    primaryEvent = undefined;
    window.removeEventListener("mouseup", onMouseup, true);
  }

  window.addEventListener("mousedown", onMousedown, true);
})();