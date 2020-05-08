(function () {
  //most of the time, the input target is the same as the output target, but there are times when it is not:
  //enter on input text element
  //the same click translation happens to click on label becomes click on input element
  //and img usemap click becomes click on area.

  const nextTick = window["toggleTick"] || setTimeout;

  function dispatchClick(target, e) {
    const task = nextTick(function () {
      const click = new MouseEvent("click", {bubbles: true, composed: true/*, isTrusted: true*/});
      click.offsetX = target.offsetLeft;
      click.offsetY = target.offsetTop;
      target.dispatchEvent(click)
    });
    const preventDefaultOG = e.preventDefault;
    e.preventDefault = function () {
      preventDefaultOG.call(e);
      //todo add the setTimeout as an alternative object task for the nextTick()
      typeof (task) === "number" ? clearTimeout(task) : task.cancel();
    }
  }

  const keyToFunctions = {
    "Space": [
      target => target.tagName === "SUMMARY" && target.parentNode instanceof HTMLDetailsElement && target,
      target => target instanceof HTMLInputElement && target.type === "checkbox" && target,
      target => target instanceof HTMLButtonElement && target,
      target => target instanceof HTMLInputElement && (target.type === "submit" || target.type === "reset") && target,
    ],
    "Enter": [
      target => target.tagName === "SUMMARY" && target.parentNode instanceof HTMLDetailsElement && target,
      target => target instanceof HTMLButtonElement && target,
      target => target instanceof HTMLAnchorElement && target,
      target => target instanceof HTMLInputElement && (target.type === "submit" || target.type === "reset") && target,
      function (target) {
        if (!(target instanceof HTMLInputElement && target.type === "text" && target.form))
          return;
        const submits = target.form.querySelectorAll("input[type=submit], button[type=submit]");
        return submits.length === 1 ? submits[0] : undefined;
      },
    ]
  }
  function keydownToClick(e) {
    if (!e.isTrusted)
      return;
    if (!keyToFunctions[e.code])
      return;
    const inputTarget = e.composedPath()[0];
    for (let matcher of keyToFunctions[e.code]) {
      const target = matcher(inputTarget);
      if (target)
        return dispatchClick(target, e);
    }
  }


  //remember:
  // the target of all composed: true keydown events is the innermost element in focus (the innermost .activeElement).

  //problem: this event controller is not implemented as an event controller in the browser, but instead as a sideeffect in a series of different default actions associated with many different element types. This also means that calling .preventDefault() on the keydown event will cancel the dispatch of the click.
  //
  // This is not pretty, nor necessary. In fact, it would be much simpler to simply have the key event be transformed into a click event, and then have the different default actions only listen for the click, and not the keypress event too. The change of implementing this as an event controller would only be that calling .preventDefault() on the event would also cancel the click, not only the default action. Ie. that the click event would run regardless. However, there is not really a use case for this, as calling preventDefault() only on a keydown event and not a click event for the same element is... non-existing.
  //
  // There are two ways to patch/simulate this behavior.
  // 1. split the implementation of this event controller across all the different native default actions. Horrible. We don't do that.
  // 2. wrap the .preventDefault() to also cancel the dispatch of the click event when called. Simple. We do that.

  //todo export these functions to enable developers of other elements to register their signature to keydownToClick
  function addElementToMap(code, matcher) {
    keyToFunctions[code] && keyToFunctions[code].push(matcher);
  }

  function removeElementToMap(code, matcher) {
    const map = keyToFunctions[code];
    if(!map)
      return false;
    const index = map.indexOf(matcher);
    if (index === -1)
      return false;
    map.splice(index, 1);
    return true;
  }

  window.addEventListener("keydown", keydownToClick, true);
})();