Object.defineProperty(HTMLOptionElement.prototype, "joiGetNativeAction", {
  value: function (e) {
    if (e instanceof MouseEvent && e.isTrusted && e.type === "mousedown" && e.button === 0)
      return () => {
        //replace with this.parent.requestSelect()??
        //should this be placed on the HTMLSelectElement instead?? using e.target instanceof HTMLOptionElement??
        //that way, we would reduce the need for checking if the .parent is alive, and
        //we would only access the host node to do the action, not look upwards in the DOM.
        //This same could be said of the FORM submit and reset actions. It would reduce the need for this kind of action.
        const select = this.parent;
        const beforeInput = new InputEvent("beforeinput", {composed: true, bubbles: true});
        select.dispatchEvent(beforeInput);
        if (beforeInput.defaultPrevented)
          return;
        //set :selected pseudo-classes??
        select.selectedIndex = select.children.indexOf(this);
        select.dispatchEvent(new InputEvent("input", {composed: true, bubbles: true}));
      };
  }
});

Object.defineProperty(HTMLAnchorElement.prototype, "joiGetNativeAction", {
  value: function (e) {
    if (e instanceof MouseEvent && e.isTrusted && e.type === "click" && this.hasAttribute("href")) {
      if (e.button === 0)
        return () => location.href = this.getAttribute("href");
      if (e.button === 1)
        return () => window.open(this.getAttribute("href"), "_blank");
    }
  }
});

Object.defineProperty(HTMLDetailsElement.prototype, "joiGetNativeAction", {
  value: function (e) {
    if (e instanceof MouseEvent && e.isTrusted && e.type === "click" && e.button === 0)
      return () => {
        //replace with this.requestToggle()??
        this.open = !this.open;
        //set pseudo-class??
        this.dispatchEvent(new Event("toggle"));
      };
  }
});