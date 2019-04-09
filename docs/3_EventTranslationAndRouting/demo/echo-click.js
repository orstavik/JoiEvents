(function () {
  function filterOnAttribute(e, attributeName) {
    var target = e.composedPath ? e.composedPath()[0] : e.target;
    for (var el = target; el; el = el.parentNode) {
      if (el.hasAttribute && el.hasAttribute(attributeName))
        return el;
    }
  }

  function dispatchPriorEvent(target, composedEvent, trigger) {
    composedEvent.preventDefault = function () {
      trigger.preventDefault();
      trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
    };
    composedEvent.trigger = trigger;
    target.dispatchEvent(composedEvent);
  }

  function onClick(e) {
    var newTarget = filterOnAttribute(e, "echo-click");
    if (newTarget)
      dispatchPriorEvent(newTarget, new CustomEvent("echo-click", {bubbles: true, composed: true}), e);
  }

  window.addEventListener("click", onClick, true);
})();