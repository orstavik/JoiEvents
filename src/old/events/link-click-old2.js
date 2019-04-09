function getLinkHref(link, click) {
  //dirty little secret nr 1: SVG
  if (link.href.animVal)
    return link.href.animVal;
  //dirty little secret nr 2: <img ismap>
  if (click.target.nodeName === "IMG" && click.target.hasAttribute("ismap"))
    return link.href + "?" + click.offsetX + "," + click.offsetY;
  return link.href;
}

function filterOnType(e, typeName) {
  for (var el = e.target; el; el = el.parentNode) {
    if (el.nodeName === typeName)
      return el;
  }
}

function dispatchPriorEvent(target, composedEvent, trigger) {
  composedEvent.preventDefault = function () {
    trigger.preventDefault();
    trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
  };
  composedEvent.trigger = trigger;
  return target.dispatchEvent(composedEvent);
}

function onClick(e) {
  var newTarget = filterOnType(e, "A");
  if (!newTarget)
    return;
  var composedEvent = new CustomEvent("link-click", {bubbles: true, composed: true});
  composedEvent.getHref = function () {
    getLinkHref(newTarget, e);
  };
  dispatchPriorEvent(newTarget, composedEvent, e);
}

window.addEventListener("click", onClick, true);