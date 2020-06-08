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
  var _imageOnerrorTick_queue = [];
  window.imgOnerrorTick = function imgOnerrorTick(cb) {
    _imageOnerrorTick_queue.push(cb);
    var img = document.createElement("img");
    img.onerror = function () {
      _imageOnerrorTick_queue.shift()();
    };
    img.src = "img://";
  }

  var _linkOnerrorTick_queue = [];
  window.linkOnerrorTick = function linkOnerrorTick(cb) {
    _linkOnerrorTick_queue.push(cb);
    var link = document.createElement("link");
    link.onerror = function () {
      document.head.removeChild(link);
      _linkOnerrorTick_queue.shift()();
    }
    link.href = "link://";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }

  var _scriptOnerrorTick_queue = [];
  window.scriptOnerrorTick = function scriptOnerrorTick(cb) {
    _scriptOnerrorTick_queue.push(cb);
    var script = document.createElement("script");
    script.onerror = function () {
      document.head.removeChild(script);
      _scriptOnerrorTick_queue.shift()();
    }
    script.src = "script://";
    document.head.appendChild(script);
  }
})();

(function () {
  //todo #1 here is considerate of other macrotasks.
  window.ratechangeTick = function ratechangeTick(cb) {
    var audio = document.createElement("audio");
    audio.onratechange = cb;
    audio.playbackRate = 2;
  };

  var audio = document.createElement("audio");
  var cbs = [];
  var eventLoopDiLoop = function () {
    var cb = cbs.shift();
    if (!cbs.length) {
      audio = document.createElement("audio");
      cbs = [];
    }
    cb();
  };

  //#2 here is remaing focused on its own tasks. It gives priority to the main tasks as its own task queue.
  //todo you have a queue 1 task. the task you have, first opens a details and triggers a toggle. second, it calls nextTick.
  //todo now #1 will add the toggle to the queue first, and then the nextTick.
  //todo now #2 will add the toggle to the main event loop, but then the nextTick to the same queue position in the main event loop, thus
  //todo making the nextTick run before the queued toggle. These are two different queue positions.
  //todo the #1 is the queue position of the ratechange/toggle, which in Chrome would run in the time they are added.
  //todo the #2 is the queue position of immediate, except for the first nextTick, which will be delayed until needed.
  window.reuseRatechangeTick2 = function reuseRatechangeTick2(cb) {
    cbs.push(cb);
    //todo if we want, we can add priority as a second argument option here..
    //todo then, when we push to the loop, the loop array could be sorted in terms of priority.
    audio.addEventListener("ratechange", eventLoopDiLoop.bind({}));
    if (cbs.length === 1)
      audio.playbackRate = 2;
  }

  var audios = [];
  window.reuseRatechangeTick = function reuseRatechangeTick(cb) {
    var audio;
    if (audios.length) {
      audio = audios.shift();
      audio.cb = cb;
      audio.playbackRate = !audio.playbackRate;
    } else {
      audio = document.createElement("audio");
      audio.cb = cb;
      audio.onratechange = function () {
        audios.push(audio);
        audio.cb();
      }
      audio.playbackRate = 2;
    }
  }
})();