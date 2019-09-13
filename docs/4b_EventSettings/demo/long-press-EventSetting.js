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
    if (e.button !== 0)
      return;
    primaryEvent = e;
    window.addEventListener("mouseup", onMouseup, true);
  }

  function onMouseup(e) {
    var duration = e.timeStamp - primaryEvent.timeStamp;
    var longPressDurationSetting =                          //[1]
      e.target.getAttribute("long-press-duration") ||
      document.children[0].getAttribute("long-press-duration") ||
      300;
    //trigger long-press iff the press duration is more than the long-press-duration EventSetting
    if (duration > longPressDurationSetting){
      let longPress = new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration});
      dispatchPriorEvent(e.target, longPress, e);
    }
    primaryEvent = undefined;
    window.removeEventListener("mouseup", onMouseup, true);
  }

  window.addEventListener("mousedown", onMousedown, true);
})();
//1. The `long-press-duration` EventSetting is grabbed once,
//   when first needed, and then reused.