(function () {
  //polyfill the baseURI property if needed
  if (!('baseURI' in Node.prototype)) {
    Object.defineProperty(Node.prototype, 'baseURI', {
      get: function () {
        var base = (this.ownerDocument || this).querySelector('base[href]');
        return (base || window.location).href;
      },
      configurable: true,   //todo verify this polyfill and the configuration.
      enumerable: true
    });
  }

  function getFormHref() {
    var form = this.target;
    var href = form.getAttribute("action");
    if (form.method === "POST")
      return href;
    //2. Test show that: if you have a <form action="index.html?query=already#hash" method="get">,
    //the query, but not the hash, will be overwritten by the values in the form when Chrome interprets the link.
    var url = new URL(href);
    url.search = "";
    for (let el of form.elements) {
      if (el.hasAttribute("name"))
        url.searchParams.append(el.name, el.value);
    }
    return url.href;
  }

  function resolvedURL() {
    return new URL(this.getHref(), this.target.baseURI);
  }

  function isExternal() {
    var href = this.getHref();
    var target = this.target;
    if (!(new URL(href, target.baseURI).href.startsWith(href)))
      return false;
    if (target.hasAttribute("download"))
      return false;                                                  //todo polyfill relList too??
    if ((target.nodeName === "A" || target.nodeName === "AREA") && target.relList.contains("external"))
      return false;
    var targetTarget = target.getAttribute("target");
    if (targetTarget && targetTarget !== "_self")
      return false;
    return true;
  }

  function dispatchPriorEvent(target, composedEvent, trigger) {
    composedEvent.preventDefault = function () {
      trigger.preventDefault();
      trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
    };
    composedEvent.trigger = trigger;
    return target.dispatchEvent(composedEvent);
  }

  function mergeEvents(trigger) {
    var browse = new CustomEvent("browse", {bubbles: true, composed: true});
    if (trigger.type === "link-click")
      browse.getHref = trigger.getHref;
    else
      browse.getHref = getFormHref;
    browse.resolvedURL = resolvedURL;
    browse.isExternal = isExternal;
    dispatchPriorEvent(trigger.target, browse, trigger);
  }

  window.addEventListener("submit", mergeEvents, true);
  window.addEventListener("link-click", mergeEvents, true);
})();