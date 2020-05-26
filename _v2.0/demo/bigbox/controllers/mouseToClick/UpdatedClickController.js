(function () {
  const nextTick = window["toggleTick"] || setTimeout;

  //todo we have an addAdditionalClick(for some elements)  label for=""
  //todo we have a shiftClickTarget(for some other elements) usemap=""

  function matchTarget(e, matchers) {
    for (let matcher of matchers) {
      const switchTarget = matcher(e.target, e);
      if (switchTarget)
        return switchTarget;
    }
  }

  function getAreaFromMap(map, x, y) {
    const areas = map.children.filter(el => el instanceof HTMLAreaElement);
    for (let area of areas) {
      const coordinates = area.coords;
      if (x > coordinates[0][0] && x < coordinates[1][0]
        && y > coordinates[0][1] && y < coordinates[1][1])
        return area;
    }
  }

  const switchTargets = [
    (target, e) => {
      //usemap nastiness
      if (!(target instanceof HTMLImageElement))
        return;
      const usemap = target.getAttribute("usemap");
      if (!usemap || usemap[0] !== "#")
        return;
      const map = target.getRootNode().querySelector("map[name=" + usemap.slice(1) + "]");
      return getAreaFromMap(map, e.offsetLeft, e.offsetTop);
    }
  ];

  //remember:
  // the target of all composed: true keydown events is the innermost element in focus (the innermost .activeElement).
  let buttons = [, , , , , , , , ,];
  window.addEventListener("mousedown", e => buttons[e.button] = true, true);
  //remove mousedown when the focus is lost, from alert or similar
  //are there other events that signify that there will be a loss of
  document.addEventListener("blur", e => document.activeElement === null && (buttons = [, , , , , , , , ,]), true);

  function clickController(e) {
    if (!e.isTrusted)
      return;
    //ensure that the button is not pressed down outside the window viewport
    if (!buttons[e.button])
      return;
    buttons[e.button] = false;

    //the auxclick event
    // (the contextmenu event controller will abort the mouseup event
    // if preventDefault() is not called on the contextmenu event.
    if (e.button !== 0)
      return nextTick(() => e.target.dispatchEvent(new MouseEvent("auxclick", e)));

    //swapping targets like this can be seen as an immediate bounce.
    //"img usemap"-swap click
    const target = matchTarget(e, switchTargets) || e.target;
    nextTick(() => target.dispatchEvent(new MouseEvent("click", e)));
  }

  //todo the problem of the 300ms delay on touch smartphones because double tap was used to zoom
  let lastClick;

  function dblclickController(e) {
    if (!e.isTrusted)
      return;
    const now = performance.now();
    if (lastClick && now - lastClick < 300) {
      nextTick(() => e.target.dispatchEvent(new MouseEvent("dblclick", e)));
      lastClick = undefined;
    } else {
      lastClick = now;
    }
  }

  const duplicateTargets = [
    target => {
      if (!(target instanceof HTMLLabelElement))
        return;
      //todo check which elements the label for can be applied to
      const forAttrib = target.getAttribute("for");
      if (forAttrib)
        return target.getRootNode().querySelector("input#" + forAttrib);
    }
  ];

  //"label for"-clone click
  //the duplicate target is based on the switch target. This could be used to make something really complex:
  //You click on one element, and then two other elements receive the click.
  //secondary bounce. The effect is that when one event has bounced, a new event will bounce as well
  //the bounced event has mousepointer coordinates x,y = 0,0
  function duplicateBounceClickController(e) {
    const cloneTarget = matchTarget(e.target, duplicateTargets);
    if (!cloneTarget)
      return;
    nextTick(function () {
      if (e.defaultPrevented)
        return;
      cloneTarget.dispatchEvent(new MouseEvent("click", {bubbles: true, composed: true, screenX: 0, screenY: 0}));
    });
  }

  window.addEventListener("mouseup", clickController, true);
  window.addEventListener("click", dblclickController, true);
  window.addEventListener("click", duplicateBounceClickController, true);
})();