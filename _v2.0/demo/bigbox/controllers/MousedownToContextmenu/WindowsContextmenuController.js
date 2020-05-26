(function () {
  const nextTick = window["toggleTick"] || setTimeout;

  function dispatchAndShowContextMenu(e) {
    const cm = new Event("contextmenu", {composed: true, bubbles: true});
    e.target.dispatchEvent(cm);
    if (cm.defaultPrevented)
      return; // there will now be a mouseup event and an auxclick event
    //block the propagation of the mouseup and the defaultAction
    e.stopImmediatePropagation();
    e.preventDefault(); //the browser doesn't have to do this, only needed for the patch
    alert("poor excuse for a native contextmenu");
    // const menuItems = getMenuItemsForElement(target);
    // paintContextMenu(menuItems, e.x, e.y);
  }

  function onMouseup(e) {
    if (e.isTrusted && e.button === 2)
      dispatchAndShowContextMenu(e);
  }

  window.addEventListener("mouseup", onMouseup, true);
})();