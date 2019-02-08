(function () {

  function getLinkHref(link){                                    //[3]
    return link.href;
  }

  function filterOnType(e, typeName) {                           //[2]
    for (var el = e.target; el; el = el.parentNode) {
      if (el.nodeName === typeName)
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
    var newTarget = filterOnType(e, "A");                        //[2]
    if (!newTarget)
      return;
    var composedEvent = new CustomEvent("link-click-2", {bubbles: true, composed: true});
    composedEvent.getHref = function(){getLinkHref(newTarget);}; //[4]
    dispatchPriorEvent(newTarget, composedEvent, e);
  }

  window.addEventListener("click", onClick, true);               //[1]
})();

//1. EarlyBird
//2. TypeFilteredEvent
//3. DetailsOnDemand - a simple function is defined for getting the href from a supposed <a> element
//4. DetailsOnDemand - the function is added to the composedEvent as a closure