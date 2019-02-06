//CustomEvent polyfill
(function () {

  if (typeof window.CustomEvent === "function")
    return false;

  function CustomEvent(event, params) {
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})();

//link-click-2-es5 prototype
var params = {bubbles: true, composed: true, cancelable: true, detail: null};
var eventPrototype = new CustomEvent("link-click-2-es5", params);
eventPrototype.getHref = function () {
  return this.target.href;
};
eventPrototype.preventDefault = function () {
  this.trigger.preventDefault();
  this.trigger.stopImmediatePropagation ?
    this.trigger.stopImmediatePropagation() :
    this.trigger.stopPropagation();
};

//make link-click-2-es5 instance
function makeLinkClickEvent(trigger) {
  var linkClick = Object.create(eventPrototype);
  linkClick.trigger = trigger;
  return linkClick;
}

function filterOnType(e, typeName) {
  for (var el = e.target; el; el = el.parentNode) {
    if (el.nodeName === typeName)
      return el;
  }
}

function onClick(e) {
  var newTarget = filterOnType(e, "A");
  if (newTarget)
    newTarget.dispatchEvent(makeLinkClickEvent(e));
}

window.addEventListener("click", onClick, true);