// import {toggleTick} from "./toggleTick.js";

export function findLowerNativeAction(path, start, end, event) {
  start = /*!start ? 0 : */path.indexOf(start);
  path = path.slice(start + 1, path.indexOf(end));
  path = path.filter(n => n.joiGetNativeAction).map(n => n.joiGetNativeAction(event)).filter(fun => fun);
  return path.length && path[0];
}

Object.defineProperties(HTMLSelectElement.prototype, {
  requestSelect: function (option) {
    const beforeInput = new InputEvent("beforeinput", {composed: true, bubbles: true});
    //todo beforeInput.optionElement = option;
    // i don't know the properties on the beforeinput or input events that says something about which option is selected
    this.dispatchEvent(beforeInput);
    if (beforeInput.defaultPrevented)
      return;
    //set :selected pseudo-classes??
    this.selectedIndex = this.children.indexOf(this);
    const inputEvent = new InputEvent("input", {composed: true, bubbles: true});
    //todo inputEvent.data = previousOption;
    this.dispatchEvent(inputEvent);
  },
  joiGetNativeAction: {
    value: function (e) {
      if (e instanceof MouseEvent && e.isTrusted && e.type === "mousedown" && e.button === 0 && e.target instanceof HTMLOptionElement)
        return () => this.requestSelect(e.target);
      //that way, we would reduce the need for checking if the .parent is alive, and
      //we would only access the host node to do the action, not look upwards in the DOM.
      //This same could be said of the FORM submit and reset actions. It would reduce the need for this kind of action.
    }
  }
});

Object.defineProperties(HTMLFormElement.prototype, {
  requestReset: function () {
    //reset all the input elements inside this devil
    const reset = new Event("reset");
    this.dispatchEvent(reset);
  },
  //requestSubmit already exists
  joiGetNativeAction: {
    value: function (e) {
      if (!e.isTrusted)
        return;
      if (e instanceof MouseEvent && e.type === "click") {
        if (!(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLButtonElement))
          return;
        if (e.target.type === "reset")
          return () => this.requestReset();
        if (e.target.type === "submit")
          return () => this.requestSubmit();
      }
      if (e instanceof KeyboardEvent && e.type === "keypress") {
        if (e.key !== "Enter")
          return;
        if (e.target instanceof HTMLInputElement && e.target.type === "text") {
          const defaultSubmitter = getDefaultSubmitter(this);
          return () => this.requestSubmit(defaultSubmitter);
        }
        if (e.target.type === "submit" && (e.target instanceof HTMLButtonElement || e.target instanceof HTMLInputElement ))
          return () => this.requestSubmit(e.target);
        if (e.target.type === "reset" && (e.target instanceof HTMLButtonElement || e.target instanceof HTMLInputElement ))
          return () => this.requestReset();
      }
    }
  }
});

Object.defineProperties(HTMLTextAreaElement.prototype, {
  requestInput: function (value) {
    const beforeInput = new InputEvent("beforeinput", {composed: true, bubbles: true});
    //todo beforeInput.optionElement = value;
    // i don't know the properties on the beforeinput or input events that says something about which option is selected
    this.dispatchEvent(beforeInput);
    if (beforeInput.defaultPrevented)
      return;
    //set :selected pseudo-classes??
    this.innerText += value;//todo this lacks support for deleting text inside the element
    const inputEvent = new InputEvent("input", {composed: true, bubbles: true});
    //todo inputEvent.data = value;
    this.dispatchEvent(inputEvent);

  },
  joiGetNativeAction: {
    value: function (e) {
      if (e instanceof KeyboardEvent && e.isTrusted && e.type === "keypress" && e.key !== "Tab" && e.target === this)
        return () => this.requestInput(e.key);
    }
  }
});
//add test for all the files like restRequestSelect

//same for input for Input type text and type checkbox and type radiobutton elements


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

//dependency toggleTick todo rename toggleTick nextTick
Object.defineProperties(HTMLDetailsElement.prototype, {
  requestToggle: {
    value: function () {
      this.open = !this.open;
      //set pseudo-class??
      (toggleTick || setTimeout)(() => this.dispatchEvent(new Event("toggle")));
      //todo here is the use of (tick||setTimeout) import...
    }
  },
  joiGetNativeAction: {
    value: function (e) {
      if (e instanceof MouseEvent && e.isTrusted && e.type === "click" && e.button === 0)
        return () => this.requestToggle();
    }
  },
});
