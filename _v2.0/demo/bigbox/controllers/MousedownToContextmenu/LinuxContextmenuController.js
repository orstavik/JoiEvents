(function () {
  const nextTick = window["toggleTick"] || setTimeout;

  function dispatchAndShowContextMenu(e) {
    const cm = new Event("contextmenu", {composed: true, bubbles: true});
    e.target.dispatchEvent(cm);
    if (cm.defaultPrevented)
      return; // there will now be a mouseup event
    alert("poor excuse for a native contextmenu");
    // const menuItems = getMenuItemsForElement(target);
    // paintContextMenu(menuItems, e.x, e.y);
    //block mouseup. This is not necessary for the browser which dispatch the mouseup in the "native contextmenu DOM context", which is not linked with the rest of the DOM. its separate, like the devtools environment.
    // window.addEventListener("mouseup", function (e) {
    //   e.stopImmediatePropagation();
    //   e.preventDefault()
    // }, {first: true});
  }

  function onMousedown(e) {
    if (e.isTrusted && e.button === 2)
      nextTick(() => dispatchAndShowContextMenu(e));
  }

  window.addEventListener("mousedown", onMousedown, true);
})();