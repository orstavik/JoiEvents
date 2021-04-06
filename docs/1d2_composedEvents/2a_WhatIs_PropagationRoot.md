# WhatIs: propagation root?

The "propagation root" is the root node of the DOM context in which an event propagates, ie. the `window` or a `shadowRoot`. The general algorithm the browser uses for finding the propagation root is simple enough:

* `composed: true` events: `window`.
* `composed: false` events: `shadowRoot` of the `target` element, or the `window` if the `target` element is in the main DOM.

But, as always, there is an exception: the focus events (`focus`, `focusin`, `focusout`, and `blur`). The focus events are only half `composed: true`. They are `composed: true` in the sense that they can cross shadowDOM borders; but they are `composed: false` in the sense that their propagation root can be a `shadowRoot`.

## WhatIs: global events?

Global events are event types whose propagation root is *always* the `window`, ie.:

1. all `composed: true` events (except `focus`, `focusin`, `focusout`, and `blur`).
2. all events whose `target` is always the `window`, such as `resize`, `online`, `offline`, `message`, +++.

To query if an event is global, the following static function can be used:

```javascript
const composedEvents = [
  //these events should be composed
  "click", "auxclick", "contextmenu", "dblclick",
  "mousedown", "mouseenter", "mouseleave", "mousemove", "mouseout", "mouseover", "mouseup",
  "wheel",
  "keydown", "keyup",
  "touchstart", "touchend", "touchmove", "touchcancel",
  "pointerover", "pointerenter", "pointerdown", "pointermove", "pointerup", "pointercancel", "pointerout", "pointerleave",
  "gotpointercapture", "lostpointercapture",
  "dragstart", "dragend", "dragenter", "dragexit", "dragleave", "drag", "dragover", "drop",
  "compositionstart", "compositionupdate", "compositionend",
  "cut", "copy", "paste",
  //focus events are composed, but often behave as non-composed
  "blur", "focus", "focusin", "focusout",
  //these two events should not be composed, in my opinion
  "beforeinput", "input",
  //this is a global event that alert about a coming change of the browser state that should be composed. It doesn't matter where the submit occurs, you want the DOM above to be able to intercept it.
  //"submit"
];
const focusEvents = ["blur", "focus", "focusin", "focusout"];
const windowTargetEvents = ["resize", "online", "offline", "message"];

function isGlobalEvent(eventType) {
  return focusEvents.indexOf(eventType) === -1 && (
    composedEvents.indexOf(eventType) !== -1 ||
    windowTargetEvents.indexOf(eventType) !== -1);
}
```

## WhatIs: local events?

Local events are events that are not global, ie.

* the focus events,
* `composed: false` events that do not `target` the `window`.

But. Local events *can* still have the `window` as their propagation root. All local events that propagate through the main DOM will have the `window` as their propagation root; local events that are restricted to a shadowRoot will have that shadowRoot as their propagation root.

## Problem: can `document` ever be the propagation root?

Tldr: no.

Long answer rests on three premises:

1. The `document` is *always* connected to the `window`.
2. Natively dispatched events such as `focus` or `click` never ever propagate to the `document`, but *not* the `window`.
3. If you call `eventTarget.dispatchEvent(new Event('some-thing', {composed: false}))` on either an element in the main DOM *or* the `document`, they will always propagate past `window`.

* "Propagation" is not the same as "bubbling". Non-bubbling events that target the `document` or a main DOM element can *always* be *captured* on the `window`, while they will *never bubble* past `window`.

If someone can produce a JS event that *do* stop their propagation at `document`, and not `window`, then **please let me know!!** But, until that point, I assume that no such event exists and therefore that the propagation root in the main DOM is always `window`, and never `document`.

It is a principally interesting discussion *why* the `window` could be considered a separate propagation root than `document`. For example, if the two propagation roots are different, then the main DOM could more easily be converted into a web component. Which could be very good in the long run. Doing so might also better capture freak events such as the separate `focus` event dispatched on the `window` only when the tab receives focus. For me, it feels like `window` and `document` *should* be separated.

## Demo: `propagationRoot(node, documentBecomesWindow)`

```javascript
function getPropagationRoot(target, composedPath) {
  if (target === window) return target;
  const root = target.getRootNode();
  return root === document ? composedPath[composedPath.length - 1] : root;
}
```

The function above will use an existing `composedPath` to verify if the path has `window` as its last propagation target.  

## References

* [discussion about closed shadowDOM intention](https://github.com/w3c/webcomponents/issues/378#issuecomment-179596975)