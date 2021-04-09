import {SlottableCallbackElementMixin} from "./SlottablesCallbackElement.js";
import {StyleCallbackElementMixin} from "./StyleCallbackElement.js";


function inject(original, mixin, requiredProperty) {
  //first, find the highestmost prototype needing the mixin
  let last;
  for (let next = original; next && next !== HTMLElement; next = Object.getPrototypeOf(next)){
    if (requiredProperty in next.prototype)
      last = next;
  }
  //if none of the prototypes need the mixin, just return
  if (!last)
    return;

  //second, check if the mixin is already added, if it is, then just return
  for (let next = last; next && next !== HTMLElement; next = Object.getPrototypeOf(next))
    if (next.constructor.name === mixin.name)
      return;

  //third, inject the mixin just above the last prototype that needs it
  Object.setPrototypeOf(last, mixin(Object.getPrototypeOf(last)));
}

const defineOG = CustomElementRegistry.prototype.define;


CustomElementRegistry.prototype.define = function (name, original, options) {
  inject(original, SlottableCallbackElementMixin, "slottableCallback");
  inject(original, StyleCallbackElementMixin, "styleCallback");
  defineOG.call(this, name, original, options);
}