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
 *
 * Problem2: context menu on long press
 * We do not want to make the initial touchstart event listener passive. That means that it will open the context
 * menu if pressed for a long time and not moving. It is not critical, but it probably would have been removed if we
 * wanted. To fix this bug, the element with the `touch-hover` attribute could be added with style `touch-action: none`
 * for better performance too.
 */
(function () {

  var relatedTarget = undefined;
  var initialUserSelect = undefined;

  function findParentWithAttribute(node, attName) {
    for (var n = node; n; n = (n.parentNode || n.host)) {
      if (n.hasAttribute && n.hasAttribute(attName))
        return n;
    }
    return undefined;
  }

  function dispatchTouchHover(target, name) {
    if (target) {
      setTimeout(function () {
        target.dispatchEvent(new CustomEvent("touch-" + name, {bubbles: true, composed: true}));
      }, 0);
    }
  }

  function getTarget(e) {                                                     //[3a]
    var finger = e.touches[0];
    var target = document.elementFromPoint(finger.clientX, finger.clientY);
    return findParentWithAttribute(target, "touch-hover");                    //[3b]
  }

  function onTouchmove(e) {
    e.preventDefault();                                                        //[3]
    let touchHoverTarget = getTarget(e);
    if (!touchHoverTarget || touchHoverTarget === relatedTarget)               //[3c]
      return;
    dispatchTouchHover(relatedTarget, "leave");                         //[4]
    dispatchTouchHover(touchHoverTarget, "hover");
    relatedTarget = touchHoverTarget;
  }

  function end() {
    setBackEventListeners();
    if (relatedTarget) {
      dispatchTouchHover(relatedTarget, "leave");                      //[5a]
      if (relatedTarget.getAttribute("touch-hover") === "click")
        setTimeout(relatedTarget.click.bind(relatedTarget), 0);               //[5b]
    }
    relatedTarget = undefined;
  }

  function cancel() {                                                          //[6]
    setBackEventListeners();
    if (relatedTarget){
      dispatchTouchHover(relatedTarget, "leave");
      dispatchTouchHover(relatedTarget, "cancel");
    }
    relatedTarget = undefined;
  }

  function setBackEventListeners () {
    document.removeEventListener("touchmove", onTouchmove);
    window.removeEventListener("blur", cancel);
    document.removeEventListener("touchend", end);
    document.removeEventListener("touchstart", cancel);
    document.addEventListener("touchstart", start);
    document.addEventListener("touchend", start);                                 //[1]

    document.children[0].style.userSelect = initialUserSelect;                //[5]
    initialUserSelect = undefined;
  }

  function setupActiveListeners() {
    document.removeEventListener("touchend", start);
    document.removeEventListener("touchstart", start);
    document.addEventListener("touchend", end);
    document.addEventListener("touchstart", cancel);
    window.addEventListener("blur", cancel);
    document.addEventListener("touchmove", onTouchmove, {passive: false});   //[2a]

    initialUserSelect = document.children[0].style.userSelect;               //[2b]
    document.children[0].style.userSelect = "none";                          //[2c]
  }

  function start(e) {                                                           //[1a]
    if (e.touches.length !== 1)
      return;
    let touchHoverTarget = getTarget(e);
    if (!touchHoverTarget)
      return;
    // e.preventDefault();
    // see problem 2:
    // the start listeners are not passive, to prevent them making the scroll behavior laggy?
    setupActiveListeners();                                                     //[2]
    dispatchTouchHover(touchHoverTarget, "hover");
    relatedTarget = touchHoverTarget;
  }

  document.addEventListener("touchstart", start);
  document.addEventListener("touchend", start);                                 //[1]
})();