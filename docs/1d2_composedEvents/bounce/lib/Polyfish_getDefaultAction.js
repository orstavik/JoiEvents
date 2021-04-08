Object.defineProperty(HTMLAnchorElement.prototype, 'getDefaultAction', {
  value: function (event) {
    if (!event.isTrusted)
      return;
    if (event.type === 'click' && this.hasAttribute('href'))
      return () => window.open(this.href);
    if (event.type === 'mousedown' && e.button === 1)
      return () => window.open(this.href, '_blank');
  }
});

Object.defineProperty(HTMLElement.prototype, 'getDefaultAction', {
  value: function (event) {
    if (!event.isTrusted)
      return;
    if (this.tagName === 'summary' && event.type === 'click' && this.parentNode instanceof HTMLDetailsElement && this.parentNode.children[0] === this)
      return () => this.parentNode.open = !this.parentNode.open;
  }
});

Object.defineProperty(HTMLButtonElement.prototype, 'getDefaultAction', {
  value: function (event) {
    if (!event.isTrusted)
      return;
    if (!this.form)
      return;
    if (event.type === 'click' && this.type === 'submit')
      return () => this.form.requestSubmit();
    if (event.type === 'click' && this.type === 'reset')
      return () => this.form.reset();
    // if (event.type === 'mousedown' && e.button === 1)
    //   return () => setTimeout(()=>this.form.requestSubmit()); //todo do I need to do this in a blank window? if so, how?
  }
});

Object.defineProperty(HTMLInputElement.prototype, 'getDefaultAction', {
  value: function (event) {
    if (!event.isTrusted)
      return;
    if (event.type === 'click' && this.type === 'checkbox')
      return () => this.checked = !this.checked;
    if (event.type === 'click' && this.type === 'radio')
      return () => alert('here comes the radiobutton default action');   //todo
    if (event.type === 'click' && this.form && this.type === 'submit')
      return () => this.form.requestSubmit();
    if (event.type === 'click' && this.form && this.type === 'reset')
      return () => this.form.reset();
    if (event.type === "mousedown" && e.button === 1 && this.type === 'text')
      return () => alert("todo make a default action for paste as in copy'paste");  //todo
    if (event.type === "keydown" && this.type === 'text' && this.form && e.key === 'enter')
      return () => this.form.requestSubmit();
  }
});

Object.defineProperty(HTMLTextAreaElement.prototype, 'getDefaultAction', {
  value: function (event) {
    if (!event.isTrusted)
      return;
    if (event.type === "mousedown" && e.button === 1)
      return () => alert("todo make a default action for paste as in copy'paste");
    if (event.type === "keydown")       //todo don't remember where the deadkey conversion happens
      return () => this.dispatchEvent(new KeyboardEvent('beforeinput', event));
    if (event.type === "beforeinput")   //todo don't remember where the deadkey conversion happens
      return () => alert('todo: here comes the default action of adding text to a textarea value.');
  }
});

Object.defineProperty(HTMLOptionElement.prototype, 'getDefaultAction', {
  value: function (event) {
    if (!event.isTrusted)
      return;
    if (event.type === 'mousedown' &&
      this.parentNode instanceof HTMLSelectElement ||
      (this.parentNode instanceof HTMLOptGroupElement && this.parentNode instanceof HTMLSelectElement) ||
      (this.parentNode instanceof HTMLOptGroupElement && this.parentNode instanceof HTMLSelectElement)
    )
      return () => alert('here comes the default action for the option element');
  }
});