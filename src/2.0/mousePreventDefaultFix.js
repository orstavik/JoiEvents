(function () {
  const stop = {
    click: false,
    auxclick: false,
    contextmenu: false,
    dblclick: false
  };
                                           //click is generated when more than one button are pushed at the same time.
  let resetTimer = 0;                      //But not when the contextmenu passes unhindered, because it interrupts the
                                           //window's focus.
  function extraMouseEventPrevention(event) {
    if (event.type === "mouseup")
      stop.click = true, stop.auxclick = true;
    else if (event.type === "mousedown" && event.button === 2)
      stop.contextmenu = true;
    else if (event.type === "click")
      stop.dblclick = true;
    else
      return;

    if (resetTimer)
      return;
    resetTimer = setTimeout(function () {
      stop.click = stop.auxclick = stop.contextmenu = stop.dblclick = false;
      resetTimer = 0;
    }, 0);
  }

  function cancel(e) {
    if (!stop[e.type])
      return;
    stop[e.type] = false;
    e.stopImmediatePropagation ? e.stopImmediatePropagation() : e.stopPropagation();
    e.preventDefault();
  }

  window.addEventListener("click", cancel, true);
  window.addEventListener("auxclick", cancel, true);
  window.addEventListener("contextmenu", cancel, true);
  window.addEventListener("dblclick", cancel, true);

  const ogPreventDefault = MouseEvent.prototype.preventDefault;
  MouseEvent.prototype.preventDefault = function () {
    if (this.defaultPrevented)
      return;                              
    ogPreventDefault.call(this);
    extraMouseEventPrevention(this);
  };
})();

//todo use grabEvent instead to prevent click and dblclick and contextmenu and auxclick

//1. If more than one button is pressed, a click and auxclick can still be generated.
//   This is annoying. But it makes it so that auxclick and click should be prevented together.
//2. dblclick is prevented for all clicks. Even the first. The reason for this is that it is unknown
//   how long this particular user's settings allows for dblclick to be. 300ms is not fixed.
//3. Thus, the above blockers might seem a bit coarse, but they should be this coarse.

(function () {
  MouseEvent.prototype.setMouseCapture = function (cb, options) {
    window.suspendEventListeners("mousedown", true, cb, options);
    window.suspendEventListeners("mousemove", true, cb, options);
    window.suspendEventListeners("mouseup", true, cb, options);
  };
  MouseEvent.prototype.releaseMouseCapture = function () {
    window.resumeEventListeners("mousedown", true);
    window.resumeEventListeners("mousemove", true);
    window.resumeEventListeners("mouseup", true);
  };
})();