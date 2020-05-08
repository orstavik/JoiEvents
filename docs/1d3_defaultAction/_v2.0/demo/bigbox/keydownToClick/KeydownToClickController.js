(function () {
  const nextTick = window["toggleTick"] || setTimeout;

  function dispatchClick(target) {
    const click = new MouseEvent("click", {bubbles: true, composed: true/*, isTrusted: true*/});
    click.offsetX = target.offsetTop;
    click.offsetY = target.offsetLeft;
    target.dispatchEvent(click);
  }

  //remember:
  // the target of all composed: true keydown events is the innermost element in focus (the innermost .activeElement).
  function keydownToClick(e) {
    if (!e.isTrusted)
      return;
    if (e.key === "Space") {
      const target = e.composedPath()[0];
      if (target instanceof HTMLInputElement && target.type === "checkbox")
        nextTick(() => dispatchClick(target));
      // todo if (focusTarget instanceof HTMLInputElement && focusTarget.type === "radio")
      //   nextTick(() => dispatchClick(focusTarget));
    }
    if (e.key === "Enter") {
      const target = e.composedPath()[0];
      if (target instanceof HTMLAnchorElement /*&& target.hasAttribute("href")*/) //only <a> elements with href can be in focus and get keydown events
        nextTick(() => dispatchClick(target));
      if (target instanceof HTMLButtonElement)
        nextTick(() => dispatchClick(target));
      if (target instanceof HTMLInputElement && (target.type === "submit" || target.type === "reset"))
        nextTick(() => dispatchClick(target));
      if (target.tagName === "SUMMARY" && target.parentNode instanceof HTMLDetailsElement)
        nextTick(() => dispatchClick(target));
      // todo if (focusTarget instanceof HTMLInputElement && focusTarget.type === "radio")
      //   nextTick(() => dispatchClick(focusTarget));
    }
  }

  window.addEventListener("keydown", keydownToClick, true);
})();