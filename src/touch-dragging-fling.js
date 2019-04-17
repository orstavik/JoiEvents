(function () {
  //utilities
  let supportsPassive = false;
  try {
    const opts = Object.defineProperty({}, "passive", {
      get: function () {
        supportsPassive = true;
      }
    });
    window.addEventListener("test", null, opts);
    window.removeEventListener("test", null, opts);
  } catch (e) {
  }
  const thirdArg = supportsPassive ? {capture: true, passive: false} : true;

  function captureEvent(e, stopProp) {
    e.preventDefault();
    stopProp && e.stopImmediatePropagation ? e.stopImmediatePropagation() : e.stopPropagation();
  }

  function filterOnAttribute(e, attributeName) {
    for (let el = e.target; el; el = el.parentNode) {
      if (!el.hasAttribute) return null;
      if (el.hasAttribute(attributeName)) return el;
    }
    return null;
  }

  function dispatchPriorEvent(target, composedEvent, trigger) {
    composedEvent.preventDefault = function () {
      trigger.preventDefault();
      trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
    };
    composedEvent.trigger = trigger;
    return target.dispatchEvent(composedEvent);
  }

  //custom make events
  function makeDraggingEvent(name, trigger) {
    const composedEvent = new CustomEvent("dragging-" + name, {
      bubbles: true,
      composed: true
    });
    composedEvent.x = trigger.changedTouches ? parseInt(trigger.changedTouches[0].clientX) : trigger.x;
    composedEvent.y = trigger.changedTouches ? parseInt(trigger.changedTouches[0].clientY) : trigger.y;
    return composedEvent;
  }

  function makeFlingEvent(trigger, sequence) {
    const flingTime = trigger.timeStamp - sequence.flingDuration;
    const flingStart = findLastEventOlderThan(sequence.recorded, flingTime);
    if (!flingStart) return null;
    const detail = flingDetails(trigger, flingStart);
    if (detail.distDiag < sequence.flingDistance) return null;
    detail.angle = flingAngle(detail.distX, detail.distY);
    return new CustomEvent("fling", {bubbles: true, composed: true, detail});
  }

  function findLastEventOlderThan(events, timeTest) {
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].timeStamp < timeTest) return events[i];
    }
    return null;
  }

  function flingDetails(flingEnd, flingStart) {
    const distX = parseInt(flingEnd.changedTouches[0].clientX) - flingStart.x;
    const distY = parseInt(flingEnd.changedTouches[0].clientY) - flingStart.y;
    const distDiag = Math.sqrt(distX * distX + distY * distY);
    const durationMs = flingEnd.timeStamp - flingStart.timeStamp;
    return {distX, distY, distDiag, durationMs};
  }

  function flingAngle(x = 0, y = 0) {
    return (Math.atan2(y, -x) * 180 / Math.PI + 270) % 360;
  }

  //custom sequence
  let globalSequence;

  const touchInitialListener = e => onTouchInitial(e);
  const touchdownSecondaryListener = e => onTouchdownSecondary(e);
  const touchmoveListener = e => onTouchmove(e);
  const touchendListener = e => onTouchend(e);
  const onBlurListener = e => onBlur(e);
  const onSelectstartListener = e => onSelectstart(e);

  function startSequence(target, e) {
    const sequence = {
      target,
      flingDuration: parseInt(target.getAttribute("fling-duration")) || 50,
      flingDistance: parseInt(target.getAttribute("fling-distance")) || 100,
      recorded: [e],
      userSelectStart: document.children[0].style.userSelect,
      touchActionStart: document.children[0].style.touchAction
    };
    document.children[0].style.userSelect = "none";
    document.children[0].style.touchAction = "none";
    window.removeEventListener("touchstart", touchInitialListener, thirdArg);
    window.removeEventListener("touchend", touchInitialListener, thirdArg);
    window.addEventListener("touchstart", touchdownSecondaryListener, thirdArg);
    window.addEventListener("touchmove", touchmoveListener, thirdArg);
    window.addEventListener("touchend", touchendListener, thirdArg);
    window.addEventListener("blur", onBlurListener, thirdArg);
    window.addEventListener("selectstart", onSelectstartListener, thirdArg);
    return sequence;
  }

  function updateSequence(sequence, e) {
    sequence.recorded.push(e);
    return sequence;
  }

  function stopSequence() {
    //release target and event type start
    //always remove all potential listeners, regardless
    document.children[0].style.userSelect = globalSequence.userSelectStart;
    document.children[0].style.touchAction = globalSequence.touchActionStart;
    window.removeEventListener("touchmove", touchmoveListener, thirdArg);
    window.removeEventListener("touchend", touchendListener, thirdArg);
    window.removeEventListener("blur", onBlurListener, thirdArg);
    window.removeEventListener("selectstart", onSelectstartListener, thirdArg);
    window.removeEventListener("touchstart", touchdownSecondaryListener, thirdArg);
    window.addEventListener("touchdown", touchInitialListener, thirdArg);
    window.addEventListener("touchend", touchInitialListener, thirdArg);
    return undefined;
  }

  //custom listeners
  function onTouchInitial(trigger) {
    if(trigger.defaultPrevented)
      return;
    if (trigger.touches.length !== 1)           //support sloppy finger
      return;
    const target = filterOnAttribute(trigger, "draggable");
    if (!target)
      return;
    const composedEvent = makeDraggingEvent("start", trigger);
    captureEvent(trigger, false);
    globalSequence = startSequence(target, composedEvent);
    dispatchPriorEvent(target, composedEvent, trigger);
  }

  function onTouchdownSecondary(trigger) {
    const cancelEvent = makeDraggingEvent("cancel", trigger);
    const target = globalSequence.target;
    globalSequence = stopSequence();
    dispatchPriorEvent(target, cancelEvent, trigger);
  }

  function onTouchmove(trigger) {
    const composedEvent = makeDraggingEvent("move", trigger);
    captureEvent(trigger, false);
    globalSequence = updateSequence(globalSequence, composedEvent);
    dispatchPriorEvent(globalSequence.target, composedEvent, trigger);
  }

  function onTouchend(trigger) {
    trigger.preventDefault();                             //TouchendPreventDefault
    const stopEvent = makeDraggingEvent("stop", trigger);
    const flingEvent = makeFlingEvent(trigger, globalSequence);
    captureEvent(trigger, false);
    const target = globalSequence.target;
    globalSequence = stopSequence();
    dispatchPriorEvent(target, stopEvent, trigger);
    if (flingEvent)
      dispatchPriorEvent(target, flingEvent, trigger);
  }

  function onBlur(trigger) {
    const blurInEvent = makeDraggingEvent("cancel", trigger);
    const target = globalSequence.target;
    globalSequence = stopSequence();
    dispatchPriorEvent(target, blurInEvent, trigger);
  }

  function onSelectstart(trigger) {
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  }

  document.addEventListener("touchstart", touchInitialListener, thirdArg);
})();