(function () {

  function filterOnType(e, typeName) {
    for (var el = e.target; el; el = el.parentNode) { //[3] TypedEvent
      if (el.nodeName === typeName)                   //[3] TypedEvent
        return el;
    }
  }

  function dispatchPriorEvent(target, composedEvent, trigger) {
    composedEvent.preventDefault = function () {
      trigger.preventDefault();
      trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
    };
    composedEvent.trigger = trigger;
    return target.dispatchEvent(composedEvent);
  }

  function onClick(e) {
    var newTarget = filterOnType(e, "A");             //[2] TypedEvent
    if (newTarget)                                    //[4] PriorEvent
      dispatchPriorEvent(newTarget, new CustomEvent("link-click", {bubbles: true, composed: true}), e);
  }

  window.addEventListener("click", onClick, true);    //[1] EarlyBird
})();

//1. EarlyBird
//2. TypedEvent - the event is filtered on a certain type
//3. TypedEvent - the filter checks the entire target chain for an element of the given type
//4. PriorEvent