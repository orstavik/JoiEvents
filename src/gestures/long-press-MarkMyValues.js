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
  var markMyValues;

  function onMousedown(e) {
    if (e.button !== 0)
      return;
    primaryEvent = e;
    markMyValues = {x: e.pageX, y: e.pageY};               //[1]
    window.addEventListener("mouseup", onMouseup);
  }

  function onMouseup(e) {
    var duration = e.timeStamp - primaryEvent.timeStamp;
    var xDist = Math.abs(markMyValues.x - e.pageX);        //[2]
    var yDist = Math.abs(markMyValues.y - e.pageY);        //[2]
    var dist = Math.sqrt((xDist * xDist) + (yDist * yDist));//[2]
    //trigger long-press iff the press duration is more than 300ms ON the exact same mouse event target.
    //&& the finger motion from start to end of the press is less than 30px
    if (duration > 300 && dist < 30) {
      var detail = {duration: duration, dist: dist};
      var longPress = new CustomEvent("long-press", {bubbles: true, composed: true, detail: detail});
      dispatchPriorEvent(e.target, longPress, e);
    }
    primaryEvent = undefined;
    markMyValues = undefined;                              //[3]
    window.removeEventListener("mouseup", onMouseup);
  }

  window.addEventListener("mousedown", onMousedown, true);
})();
//1. Save the markMyValues that will get garbage collected before the secondary trigger function gets read.
//2. Use the marked values during the secondary event trigger function.
//3. Reset the markedValues when the EventSequence is complete.