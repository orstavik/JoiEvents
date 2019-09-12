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
  var timer;
  var duration = 300;

  function onDurationComplete(){
    primaryEvent.target.classList.add("long-press-active");
    let longPress = new CustomEvent("long-press-active", {bubbles: true, composed: true, detail: duration});
    dispatchPriorEvent(primaryEvent.target, longPress, primaryEvent);
    timer = undefined;
  }

  function onMousedown(e) {                                 //[1]
    if (e.button !== 0)                                     //[3]
      return;
    primaryEvent = e;                                       //[4]
    window.addEventListener("mouseup", onMouseup);          //[4]
    timer = setTimeout(onDurationComplete, duration);
    primaryEvent.target.classList.add("long-press");
    let longPress = new CustomEvent("long-press-start", {bubbles: true, composed: true, detail: duration});
    dispatchPriorEvent(e.target, longPress, e);
  }

  function onMouseup(e) {                                   //[5]
    if (e.button !== 0)                                     //[3]
      return;
    if (timer) {
      clearTimeout(timer);
      let longPress = new CustomEvent("long-press-cancel", {bubbles: true, composed: true, detail: duration});
      dispatchPriorEvent(e.target, longPress, e);
    } else {
      primaryEvent.target.classList.remove("long-press-active");
      let longPress = new CustomEvent("long-press-end", {bubbles: true, composed: true, detail: duration});
      dispatchPriorEvent(e.target, longPress, e);
    }
    primaryEvent.target.classList.remove("long-press");
    primaryEvent = undefined;                               //[7]
    window.removeEventListener("mouseup", onMouseup);       //[8]
  }

  window.addEventListener("mousedown", onMousedown, true);  //[2]
})();