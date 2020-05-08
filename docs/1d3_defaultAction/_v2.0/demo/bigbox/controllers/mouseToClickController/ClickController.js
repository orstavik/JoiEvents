(function () {
  const nextTick = window["toggleTick"] || setTimeout;

  //todo should this be handled by the controller that generates the click event, or should it be put inside another controller ChangeClickTargetController??
  //todo, it would be most efficient to do it where the click already runs, because that would avoid having the same click function being made twice.
  //todo, if the target could be changed by a script, then this would not be much of a problem, but changing the target means changing the composedPath, which is not simple. So, maybe it is better to have the click controller also alter this behavior. Yes.

  //todo we have an addAdditionalClick(for some elements)  label for=""
  //todo we have a shiftClickTarget(for some other elements) usemap=""

  //touchstart and touchend produce mousedown and mouseup. This is done in another event controller.

  function makeEvent(name, mouseup) {
    //todo copy over all the other mouseevent dictionary properties
    const click = new MouseEvent(name, {bubbles: true, composed: true/*, isTrusted: true*/});
    click.offsetX = mouseup.offsetX;
    click.offsetY = mouseup.offsetY;
    return click;
  }

  const switchTargets = [
    target => {
      //usemap nastiness
      if (!(target instanceof HTMLImageElement))
        return;
      const usemap = target.getAttribute("usemap");
      if (!usemap || usemap[0] !== "#")
        return;
      const mapElement = target.getRootNode().querySelector("map[name=" + usemap.slice(1) + "]");
      return getAreaFromMap(map, x, y);//todo expose this function on the HTMLMapAreaElement? yes..
    }
  ];

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

  function matchTarget(target, matchers) {
    for (let matcher of matchers) {
      const switchTarget = matcher(target);
      if (switchTarget)
        return switchTarget;
    }
  }

  //remember:
  // the target of all composed: true keydown events is the innermost element in focus (the innermost .activeElement).
  let mousedown;
  let lastClick;
  window.addEventListener("mousedown", e => mousedown = e, true);
  //remove mousedown when the focus is lost, from alert or similar
  //are there other events that signify that there will be a loss of
  document.addEventListener("blur", e => document.activeElement === null, true);

  function mouseup(e) {
    if (!mousedown)
      return;
    mousedown = undefined;
    if (!e.isTrusted)
      return;

    if (e.button === 2) { //contextmenu
      //contextmenu runs sync!! it will eat the mouseup if you don't preventDefault on it.
      //this means that the contextmenu should be set up as a separate event controller that has first position on the mouseup event, and that can!! grab it!!

      const cm = new Event("contextmenu", {composed: true, bubbles: true});
      nextTick(() => e.target.dispatchEvent(cm));
      nextTick(() => cm.defaultPrevented || e.target.dispatchEvent(makeEvent("auxclick", e)));
    } else
      if (e.button === 0) {

      //"img usemap"-swap click
      const target = matchTarget(e.target, switchTargets) || e.target;

      //normal click
      const click = makeEvent("click", e);
      nextTick(() => target.dispatchEvent(click, {composed: true, bubbles: true}));

      //"label for"-clone click
      //the duplicate target is based on the switch target. This could be used to make something really complex:
      //You click on one element, and then two other elements receive the click.
      const cloneTarget = matchTarget(target, duplicateTargets);
      if (cloneTarget) {
        const cloneClick = makeEvent("click", e);
        nextTick(() => cloneTarget.dispatchEvent(cloneClick, {composed: true, bubbles: true}));
      }
      
      //dblclick
      const now = performance.now();
      if (lastClick) {
        if (now - lastClick < 300)
          nextTick(() => target.dispatchEvent(makeEvent("dblclick", e), {composed: true, bubbles: true}));
      }
      lastClick = now;
      //todo the problem of the 300ms delay on touch smartphones because double tap was used to zoom
    } else { //the contextmenu event is allowed to run to fruition without blocking the mouseup event.

      nextTick(() => e.target.dispatchEvent(makeEvent("auxclick", e)));
    }
  }

  nextTick(() => window.addEventListener("mouseup", mouseup, true));
})();