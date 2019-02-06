(function () {
  class LinkClickEvent extends Event {
    constructor(trigger) {
      super("link-click", {bubbles: true, composed: true, cancelable: true});
      this.trigger = trigger;
    }

    preventDefault() {
      this.trigger.preventDefault();
      this.trigger.stopImmediatePropagation ?
        this.trigger.stopImmediatePropagation() :
        this.trigger.stopPropagation();
    };

    getHref() {
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
      newTarget.dispatchEvent(new LinkClickEvent(e));
  }

  window.addEventListener("click", onClick, true);
})();
