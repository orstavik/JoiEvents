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
      let link = this.target;
      if (link.href.animVal)
        return link.href.animVal;
      let click = this.trigger;
      if (click.target.nodeName === "IMG" && click.target.hasAttribute("ismap"))
        return link.href + "?" + click.offsetX + "," + click.offsetY;
      return link.href;
    }
  }

  function filterNavigationTargets(e) {
    if (e.metaKey)
      return;
    for (let el = e.target; el; el = el.parentNode) {
      if (el.nodeName === "A" || el.nodeName === "AREA" || el.nodeName === "a")
        return el;
    }
  }

  function onClick(e) {
    const newTarget = filterNavigationTargets(e);
    if (newTarget)
      newTarget.dispatchEvent(new LinkClickEvent(e));
  }

  window.addEventListener("click", onClick, true);
})();
