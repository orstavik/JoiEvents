(function () {
  const nextTick = window["toggleTick"] || setTimeout;

  //todo should this be handled by the controller that generates the click event, or should it be put inside another controller ChangeClickTargetController??
  //todo, it would be most efficient to do it where the click already runs, because that would avoid having the same click function being made twice.
  //todo, if the target could be changed by a script, then this would not be much of a problem, but changing the target means changing the composedPath, which is not simple. So, maybe it is better to have the click controller also alter this behavior. Yes.

  //todo we have an addAdditionalClick(for some elements)  label for=""
  //todo we have a shiftClickTarget(for some other elements) usemap=""

  //touchstart and touchend produce mousedown and mouseup. This is done in another event controller.

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

    //the auxclick event (the contextmenu event controller will abort the mouseup event if preventDefault() is not called on the contextmenu event.
    if (e.button !== 0)
      return nextTick(() => e.target.dispatchEvent(new MouseEvent("auxclick", e)));

    //immediate bounce: The effect is that the target simply switches, but it is like the first event is blocked, before a second bounces
    //"img usemap"-swap click
    const immediateBounceTarget = matchTarget(e.target, switchTargets);
    // if (immediateBounceTarget)
    const target = immediateBounceTarget || e.target;

    //normal click
    const click = new MouseEvent("click", e);
    nextTick(() => target.dispatchEvent(click));

    //"label for"-clone click
    //the duplicate target is based on the switch target. This could be used to make something really complex:
    //You click on one element, and then two other elements receive the click.
    const cloneTarget = matchTarget(target, duplicateTargets);
    if (cloneTarget) {  //secondary bounce. The effect is that when one event has bounced, a new event will bounce as well
      nextTick(function () {
        //the clone event has x,y equal 0,0
        !click.defaultPrevented && cloneTarget.dispatchEvent(new MouseEvent("click", {bubbles: true, composed: true}));
      });
    }

    //todo you don't get a dblclick for a bounced click event.. That is bad. That is likely confusing. If you doubleclick on the label of a checkbox, or once on the label and then second on the checkbox, you would like that to register as a dblclick on the checkbox. Now, you only get dblclick on the label if you dblclick that one, and the checkbox if you dblclick that one. The two don't intermix, as they should.

    //dblclick
    const now = performance.now();
    if (lastClick && now - lastClick < 300)
      nextTick(() => target.dispatchEvent(new MouseEvent("dblclick", e)));
    lastClick = now;
    //todo the problem of the 300ms delay on touch smartphones because double tap was used to zoom
  }

  window.addEventListener("mouseup", mouseup, true);
})();