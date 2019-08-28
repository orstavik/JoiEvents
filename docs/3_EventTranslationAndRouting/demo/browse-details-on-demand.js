(function () {
  function dispatchPriorEvent(target, composedEvent, trigger) {
    composedEvent.preventDefault = function () {
      trigger.preventDefault();
      trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
    };
    composedEvent.trigger = trigger;
    return target.dispatchEvent(composedEvent);
  }

  class BrowseEvent extends Event {
    constructor(type, props = {bubbles: true, composed: true}){
      super(type, props);
    }
    getQueryString() {
      const form = this.target;
      if (form.method === "POST")
        return "";
      const url = new URL("https://2js.no");
      for (let el of form.elements) {
        if (el.hasAttribute("name"))
          url.searchParams.append(el.name, el.value);
      }
      debugger;
      return url.searchParams.toString();
    }
  }

  function onSubmit(trigger) {
    var browse = new BrowseEvent("browse", {bubbles: true, composed: true});
    dispatchPriorEvent(trigger.target, browse, trigger);
  }

  window.addEventListener("submit", onSubmit, true);
})();