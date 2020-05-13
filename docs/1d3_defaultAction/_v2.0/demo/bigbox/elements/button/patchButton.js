function submitOrReset() {
  if (this.type === "submit")
    return this.form.requestSubmit();
  if (this.type === "reset")
    return this.form.reset();
}

Object.defineProperty(HTMLButtonElement.prototype, "joiGetNativeAction", {
  value: function (e) {
    if (!(e instanceof MouseEvent) || !e.isTrusted)
      return;
    if (e.type === "click")
      return submitOrReset.bind(this);
  }
});