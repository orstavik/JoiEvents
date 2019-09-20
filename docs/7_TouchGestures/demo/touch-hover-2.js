(function () {

  let supportsPassive = false;
  try {
    const opts = Object.defineProperty({}, "passive", {
      get: function() {
        supportsPassive = true;
      }
    });
    window.addEventListener("test", null, opts);
    window.removeEventListener("test", null, opts);
  } catch (e) {
  }
  const thirdArg = supportsPassive ? {capture: true, passive: false} : true;

  var relatedTarget = undefined;

  //stopProp is always false, can be replaced with e.preventDefault?
  //todo this method is wrong. the stopProp argument is misleading, it should be stopImmediateOrStopNormal
  function captureEvent(e, stopProp) {
    e.preventDefault();
    stopProp && e.stopImmediatePropagation ? e.stopImmediatePropagation() : e.stopPropagation();
  }

  function findParentWithAttribute(node, attName) {
    for (var n = node; n; n = (n.parentNode || n.host)) {
      if (n.hasAttribute && n.hasAttribute(attName))
        return n;
    }
    return undefined;                           //todo this is unnecessary
  }

  //todo compare with captureEvent
  function replaceDefaultAction(target, composedEvent, trigger) {      //[3] ReplaceDefaultAction
    composedEvent.trigger = trigger;
    trigger.stopTrailingEvent = function () {
      composedEvent.stopImmediatePropagation ? composedEvent.stopImmediatePropagation() : composedEvent.stopPropagation();
    };
    trigger.preventDefault();

    return setTimeout(function () {
      target.dispatchEvent(composedEvent)
    }, 0);
  }

  function getTarget(e) {                                                     //[3a]
    var finger = e.touches[0];
    var target = document.elementFromPoint(finger.clientX, finger.clientY);
    return findParentWithAttribute(target, "touch-hover");                    //[3b]
  }


  function makeTouchEvent(name, trigger) {
    trigger.classList.remove("hover");
    trigger.classList.remove("leave");
    trigger.classList.remove("cancel");
    trigger.classList.add(name);
    return new CustomEvent("touch-" + name, {bubbles: true, composed: true});
  }

  let globalSequence;

  const touchInitialListener = e => onTouchInitial(e);
  const touchdownSecondaryListener = e => onTouchdownSecondary(e);
  const touchmoveListener = e => onTouchmove(e);
  const touchendListener = e => onTouchend(e);
  const onBlurListener = e => onBlur(e);


  function startSequence(target, e) {                                                            //5. Event Sequence
    const body = document.querySelector("body");
    const sequence = {
      //
      target,
      //todo also, the "click" should be a separate attribute, like touch-hover-click or something
      //todo also, here we have a clear need for inheritance. Calling getComputedStyle is bad for touchstart, but we might be better served using css here...
      //todo but how would this be for css pseudo-pseudo-classes? Should we touch-hover on all that has that property, or should we only touch-hover on the leaf node target? And if we touch-hover on several elements, do we not have to do a document.querySelector on the classname, as it might be added all over the place in a DOM mutated by event listeners?
      touchHover: target.getAttribute("touch-hover"),                      //6. EventAttribute
      recorded: [e],
      userSelectStart: body.style.userSelect,                                                    //10. Grabtouch
      touchActionStart: body.style.touchAction,     //todo this is old??
    };

    document.children[0].style.userSelect = "none";     //todo this works. But it breaks with the pattern of touch-action and pointer-events
    document.children[0].style.touchAction = "none";    //todo this is old? We know now that it doesn't help to update touchAction while the touch sequence is active?
    document.removeEventListener("touchend", touchInitialListener, thirdArg);
    document.removeEventListener("touchstart", touchInitialListener, thirdArg);
    document.addEventListener("touchend", touchendListener, thirdArg);
    document.addEventListener("touchstart", touchdownSecondaryListener, thirdArg);
    window.addEventListener("blur", onBlurListener, thirdArg);
    document.addEventListener("touchmove", touchmoveListener, thirdArg);
    return sequence;
  }

  function updateSequence(sequence, e) {                                                         //7. TakeNote
    sequence.recorded.push(e);
    return sequence;
  }

  function stopSequence() {
    document.children[0].style.userSelect = globalSequence.userSelectStart;
    document.children[0].style.touchAction = globalSequence.touchActionStart;
    document.removeEventListener("touchmove", touchmoveListener, thirdArg);
    window.removeEventListener("blur", onBlurListener, thirdArg);
    document.removeEventListener("touchend", touchendListener, thirdArg);
    document.removeEventListener("touchstart", touchdownSecondaryListener, thirdArg);
    document.addEventListener("touchstart", touchInitialListener, thirdArg);
    document.addEventListener("touchend", touchInitialListener, thirdArg);
    return undefined;
  }

  function onTouchInitial(trigger) {

    if (trigger.touches.length !== 1)
      return;

    var touchHoverTarget = getTarget(trigger);

    if (!touchHoverTarget)
      return;
    captureEvent(trigger, false);
    const composedEvent = makeTouchEvent("hover", touchHoverTarget);
    globalSequence = startSequence(touchHoverTarget, composedEvent);
    replaceDefaultAction(touchHoverTarget, composedEvent, trigger);
    relatedTarget = touchHoverTarget;
  }

  function onTouchdownSecondary(trigger) {
    if (!relatedTarget)
      return;
    let composedEvent = makeTouchEvent("leave", relatedTarget);
    globalSequence = stopSequence();
    replaceDefaultAction(relatedTarget, composedEvent, trigger);
    composedEvent = makeTouchEvent("cancel", relatedTarget);
    replaceDefaultAction(relatedTarget, composedEvent, trigger);
  }

  function onTouchmove(trigger) {
    let composedEvent;
    var touchHoverTarget = getTarget(trigger);

    if (touchHoverTarget === relatedTarget)
      return;
    if (relatedTarget)
      composedEvent = makeTouchEvent("leave", relatedTarget);
    relatedTarget = touchHoverTarget;
    if (touchHoverTarget)
      composedEvent = makeTouchEvent("hover", touchHoverTarget);
    captureEvent(trigger, false);
    globalSequence = updateSequence(globalSequence, composedEvent);
    replaceDefaultAction(globalSequence.target, composedEvent, trigger);
  }

  function onTouchend(trigger) {
    trigger.preventDefault();
    if (!relatedTarget)
      return;
    let composedEvent = makeTouchEvent("leave", relatedTarget);                            //[5a]
    if (relatedTarget.getAttribute("touch-hover") === "click")
      setTimeout(relatedTarget.click.bind(relatedTarget), 0);                  //[5b]
    globalSequence = stopSequence();
    replaceDefaultAction(relatedTarget, composedEvent, trigger);
  }

  function onBlur(trigger) {
    let composedEvent = makeTouchEvent("leave", relatedTarget);
    globalSequence = stopSequence();
    replaceDefaultAction(relatedTarget, composedEvent, trigger);
  }

  document.addEventListener("touchstart", touchInitialListener, thirdArg);
  document.addEventListener("touchend", touchInitialListener, thirdArg);
})();