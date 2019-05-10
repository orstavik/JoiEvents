/**
 * Touch-hover, mimics ':hover' which bubbles.
 *
 * Elements with 'touch-hover' attribute will receive a "touch-hover" event when
 * a single touch pointer pressed to the element with 'touch-hover="click"' attribute
 * or leaves the boundaries of an element.
 * The "touch-hover" event has two boolean details with a text string:
 *  detail.enter: true when the touch enters the element
 *  detail.leave: true when the touch leaves the element
 *
 * If the "touch-hover" attribute has the value "click", then the touch-hover event will
 * dispatch a "click" event on the element if the user lifts his touch finger on that element.
 *
 * Att!!
 * The "touch-hover" event listens for touchmove with "passive: false" globally. This is very heavy, use with caution.
 *
 * Problem: TouchTarget
 * https://stackoverflow.com/questions/3918842/how-to-find-out-the-actual-event-target-of-touchmove-javascript-event
 */
(function () {

  var prevTarget = undefined;
  var relatedTarget = undefined;

  function findParentWithAttribute(node, attName) {
    for (var n = node; n; n = (n.parentNode || n.host)) {
      if (n.hasAttribute && n.hasAttribute(attName))
        return n;
    }
    return undefined;
  }

  function dispatchTouchHover(target, enter, name) {
    if (target) {
      setTimeout(function () {
        var detail = {enter: enter, leave: !enter};
        target.dispatchEvent(new CustomEvent("touch-" + name, {bubbles: true, composed: true, detail}));
      }, 0);
    }
  }

  function getTarget(e) {
    var pos = (e.touches && e.touches.length) ? e.touches[0] : e;
    var target = document.elementFromPoint(pos.clientX, pos.clientY);
    return findParentWithAttribute(target, "touch-hover");
  }

  function onTouchmove(e) {
    e.preventDefault();
    e.stopPropagation();
    let touchHoverTarget = getTarget(e);
    if (!touchHoverTarget || touchHoverTarget === relatedTarget)
      return;
    dispatchTouchHover(relatedTarget, false, "hover");
    dispatchTouchHover(touchHoverTarget, true, "hover");
    relatedTarget = touchHoverTarget;
  }

  function init(e) {
    e.touches.length === 1 ? start(e) : end(e);
  }

  function start(e) {                                               //[2]
    /*Check if the event starts with a target with an attribute?
    To avoid scrolling prevention, if the event starts from another node.*/
    if (getTarget(e)){                                               //[2a]
      document.addEventListener("touchmove", onTouchmove, {passive: false});
      document.children[0].style.userSelect = "none";
    }
  }

  function end(e) {
    document.children[0].style.userSelect = "";
    document.removeEventListener("touchmove", onTouchmove);
    prevTarget = undefined;
    if (relatedTarget) {
      dispatchTouchHover(relatedTarget, false, "cancel");
      var clickMe = relatedTarget;
      if (relatedTarget.getAttribute("touch-hover") === "click") {
        setTimeout(function () {
          clickMe.click();
        }, 0);
      }
      relatedTarget = undefined;
    }
  }

  function cancel() {
    /*Remove "touchmove" event listener*/
    end();
    if (relatedTarget)
      dispatchTouchHover(relatedTarget, true, "cancel");
  }

  document.addEventListener("touchend", init);
  document.addEventListener("touchstart", init);
  window.addEventListener("blur", cancel);
})();