function inputClickAction() {
  if (this.type === "submit")
    return this.form.requestSubmit();
  if (this.type === "reset")
    return this.form.reset();
  //here, there would be other actions for other types of the input elements.
}

Object.defineProperty(HTMLInputElement.prototype, "joiGetNativeAction", {
  value: function (e) {
    if (!(e instanceof MouseEvent) || !e.isTrusted)
      return;
    if (e.type === "click")
      return inputClickAction.bind(this);
  }
});