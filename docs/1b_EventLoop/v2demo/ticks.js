(function () {
  var idCb = {};

  window.setZeroTimeout = function setZeroTimeout(task) {
    const mid = "pm." + Math.random();
    idCb[mid] = task;
    window.postMessage(mid, "*");
    return mid;
  }
  window.clearZeroTimeout = function clearZeroTimeout(mid) {
    delete idCb[mid];
  }

  function onMessage(evt) {
    if (evt.source !== window)
      return;
    const mid = evt.data;
    if (!idCb[mid])
      return;
    evt.stopImmediatePropagation();
    const cb = idCb[mid];
    delete idCb[mid];
    cb();
  }

  window.addEventListener("message", onMessage);
})();

(function () {
  var _imageOnloadTick_queue = [];
  window.imageOnloadTick = function imageOnloadTick(cb) {
    _imageOnloadTick_queue.push(cb);
    var img = document.createElement("img");
    img.onload = function () {
      _imageOnloadTick_queue.shift()();
    };
    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  }
})();

(function () {
  var __linkOnloadTick_queue = [];
  window.linkOnloadTick = function linkOnloadTick(cb) {
    __linkOnloadTick_queue.push(cb);
    const link = document.createElement("link");
    link.onload = function () {
      link.remove();
      __linkOnloadTick_queue.shift()();
    };
    link.rel = "stylesheet";
    document.head.appendChild(link);
    link.href = "data:text/css;base64,";
  }
})();

(function () {
  var __scriptOnloadTick_queue = [];
  window.scriptOnloadTick = function scriptOnloadTick(cb) {
    __scriptOnloadTick_queue.push(cb);
    const script = document.createElement("script");
    script.onload = function () {
      script.remove();
      __scriptOnloadTick_queue.shift()();
    };
    document.head.appendChild(script);
    script.src = "data:text/css;base64,";
  }
})();

(function () {
  function toggleTickOne(cb) {
    var details = document.createElement("details");
    details.ontoggle = function () {
      details.remove();
      cb();
    }
    details.style.display = "none";
    document.body.appendChild(details);
    details.open = true;
  }

  window.toggleTickOne = !HTMLDetailsElement ? setTimeout : toggleTickOne;

  function toggleTickTwo(cb) {
    var details = document.createElement("details");
    details.ontoggle = cb;
    details.style.display = "none";
    document.body.appendChild(details);
    details.open = true;
    Promise.resolve().then(details.remove.bind(details));
  }

  window.toggleTickTwo = !HTMLDetailsElement ? setTimeout : toggleTickTwo;
})();

(function () {
  window.imgOnerrorTick = function imgOnerrorTick(cb) {
    var img = document.createElement("img");
    img.onerror = cb;
    img.src = "img://";
  }

  window.linkOnerrorTick = function linkOnerrorTick(cb) {
    var link = document.createElement("link");
    link.onerror = function () {
      document.head.removeChild(link);
      cb();
    }
    link.href = "link://";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }

  window.scriptOnerrorTick = function scriptOnerrorTick(cb) {
    var script = document.createElement("script");
    script.onerror = function () {
      document.head.removeChild(script);
      cb();
    }
    script.src = "script://";
    document.head.appendChild(script);
  }
})();

(function () {
  window.ratechangeTick = function ratechangeTick(cb){
    var audio = document.createElement("audio");
    audio.onratechange = cb;
    audio.playbackRate = 2;
  };
})();