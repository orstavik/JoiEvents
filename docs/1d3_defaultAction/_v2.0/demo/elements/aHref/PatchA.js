function linkClickNavigationAction() {
  const link = this.getAttribute("href");
  link && (location.href = link);
}

function linkWheelClickNavigationAction() {
  const link = this.getAttribute("href");
  link && window.open(link, "_blank");
}

Object.defineProperty(HTMLAnchorElement.prototype, "joiGetNativeAction", {
  value: function (e) {
    if (!(e instanceof MouseEvent) || !e.isTrusted)
      return;
    if (e.type === "click")
      return linkClickNavigationAction.bind(this);
    if (e.type === "auxclick" && e.button === 1)
      return linkWheelClickNavigationAction.bind(this);
  }
});