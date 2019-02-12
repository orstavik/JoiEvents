(function () {
  class LinkClickEvent extends Event {                    //[1]
    constructor(trigger) {                                //[2]
      super("link-click", {bubbles: true, composed: true, cancelable: true});
      this.trigger = trigger;                             //[2]
    }

    preventDefault() {
      this.trigger.preventDefault();
      this.trigger.stopImmediatePropagation ?
        this.trigger.stopImmediatePropagation() :
        this.trigger.stopPropagation();
    };

    getHref() {                                           //[3]
      return this.target.href;
    }
  }

  function filterOnType(e, typeName) {
    for (var el = e.target; el; el = el.parentNode) {
      if (el.nodeName === typeName)
        return el;
    }
  }

  function onClick(e) {
    var newTarget = filterOnType(e, "A");
    if (newTarget)
      newTarget.dispatchEvent(new LinkClickEvent(e));     //[2]
  }

  window.addEventListener("click", onClick, true);
})();

//1. Make a class that extends the Event interface
//2. Add the trigger event as a property supplied as an argument to the constructor.
//3. Add your custom DetailOnDemand method.
//   Inside the DetailOnDemand method you have access to this.trigger always,
//   and this.target when the event has been dispatched.