(function () {
  const nextTick = window["toggleTick"] || setTimeout;

  function dispatchAndShowContextMenu(e) {
    const cm = new Event("contextmenu", {composed: true, bubbles: true});
    e.target.dispatchEvent(cm);
    if (cm.defaultPrevented)
      return; // there will now be a mouseup event
    alert("poor excuse for a native contextmenu");
    // const {x, y} = e;
    // const menuItems = getMenuItemsForElement(target);
    // paintContextMenu(menuItems, x, y);
    // window.addEventListener("mouseup", function (e) {
    //   e.stopImmediatePropagation();
    //   e.preventDefault()
    // }, {first: true});
    //the browser doesn't need to  is not necessary for the browser, as it will create a different DOM altogether for the native contextmenu, like a devtools environment.
  }

  function onMousedown(e) {
    if (e.isTrusted && e.button === 2)
      nextTick(() => dispatchAndShowContextMenu(e));
  }

  window.addEventListener("mousedown", onMousedown, true);
})();