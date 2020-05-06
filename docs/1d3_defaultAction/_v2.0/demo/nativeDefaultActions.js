Object.defineProperty(HTMLOptionElement.prototype, "joiGetNativeAction", {
  value: function (e) {
    if (e instanceof MouseEvent && e.isTrusted && e.type === "mousedown" && e.button === 0)
      return () => {
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
        details.open = !details.open;
        //set pseudo-class??
        details.dispatchEvent(new Event("toggle"));
      };
  }
});