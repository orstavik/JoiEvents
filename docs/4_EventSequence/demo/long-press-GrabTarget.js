(function () {
  function dispatchPriorEvent(target, composedEvent, trigger) {
    composedEvent.preventDefault = function () {
      trigger.preventDefault();
      trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
    };
    composedEvent.trigger = trigger;
    return target.dispatchEvent(composedEvent);
  }

  function firstCommonAncestor(composedPath1, composedPath2){
    for (let i = 0; i < composedPath2.length; i++) {
      let endEl = composedPath2[i];
      for (let i = 0; i < composedPath1.length; i++) {
        let startEl = composedPath1[i];
        if (endEl === startEl)
          return endEl;
      }
    }
    return null;
  }

  function getComposedPath(e){
    var path = (e.composedPath && e.composedPath()) || e.path;
    if (path)
      return path;
    var path = [];
    for(var el = e.target; el; el = (el.parentNode || el.host))
      path.push(el);
    return path;
  }

  var primaryEvent;
  var primaryPath;                                          //[1]

  function onMousedown(e) {
    if (e.button !== 0)
      return;
    primaryEvent = e;
    primaryPath = getComposedPath(e);                       //[1]
    window.addEventListener("mouseup", onMouseup, true);
  }

  function onMouseup(e) {
    var duration = e.timeStamp - primaryEvent.timeStamp;
    //trigger long-press iff the press duration is more than 300ms ON the exact same mouse event target.
    if (duration > 300){
      var longPress = new CustomEvent("long-press", {bubbles: true, composed: true, detail: duration});
      var target = firstCommonAncestor(primaryPath, getComposedPath(e));  //[2]
      dispatchPriorEvent(target, longPress, e);
    }
    primaryEvent = undefined;
    primaryPath = undefined;                                //[3]
    window.removeEventListener("mouseup", onMouseup, true);
  }

  window.addEventListener("mousedown", onMousedown, true);
})();
//1. The primaryPath is taken note of in the initial trigger event.
//2. The firstCommonAncestor(one, two) is run against the primary path and the secondary path to produce
//   the element lowest in the DOM that received both the initial and final trigger event.
//3. The primaryPath is reset when the gesture is inactive.