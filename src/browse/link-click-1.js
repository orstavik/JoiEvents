function filterOnType(e, typeName) {
  for (var el = e.target; el; el = el.parentNode) { //[3] TypeFilteredEvent
    if (el.nodeName === typeName)                   //[3] TypeFilteredEvent
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

function onClick(e){
  var newTarget = filterOnType(e, "A");             //[2] TypeFilteredEvent
  if (newTarget)                                    //[4] PriorEvent
    dispatchPriorEvent(newTarget, new CustomEvent("link-click-1", {bubbles: true, composed: true}), e);
}

window.addEventListener("click", onClick, true);    //[1] EarlyBird

//1. EarlyBird
//2. TypeFilteredEvent - the event is filtered on a certain type
//3. TypeFilteredEvent - the filter checks the entire target chain for an element of the given type
//4. PriorEvent