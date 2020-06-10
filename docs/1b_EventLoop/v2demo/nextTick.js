(function () {

  function parseNextTickArg(cbs) {
    if (cbs instanceof Array && cbs.length && cbs.every(fun => fun instanceof Function))
      return cbs;    //avoids external mutations
    throw new Error("only a Function, an array of functions can be passed to nextMesoTicks");
  }

  function runMesoLevelTask(e) {
    this._mesoLevelTasks ? this._mesoLevelTasks.shift()() : e.stopImmediatePropagation();
  }

  function addMesoLevelTasks(tasks, level) {
    var resolve;
    var promise = new Promise(function (resolveImpl) {//no mesotask error causes the rest of the mesotasks to falter, thus no reject should be possible.
      resolve = resolveImpl;
    });
    tasks = parseNextTickArg(tasks);
    level._mesoLevelTasks = tasks.concat(resolve.bind(null, true));
    for (let i = 0; i < level._mesoLevelTasks.length; i++)
      level.addEventListener("ratechange", runMesoLevelTask.bind(level), true);
    return promise;
  }

//levels: starts as [ audio, span ]
//        grows when needed into [ audio, span , span , ... , span ]
  var levels = [document.createElement("audio"), document.createElement("span")];
  levels[1].appendChild(levels[0]);

  function getClone(depth) {
    if (depth < levels.length)
      return levels[depth].cloneNode(true);
    var span;
    for (let i = 0; i < (depth - levels.length + 1); i++) {
      span = document.createElement("span");
      span.appendChild(levels[levels.length - 1]);
      levels.push(span);
    }
    return span.cloneNode(true);
  }

  function getTopAudio(depth) {
    var top = getClone(depth);
    var el = top;
    while (el.children.length)
      el = el.children[0];
    return [top, el];
  }

  function ratechangeTickStart(mesoLevels) {
    var topAudio = getTopAudio(mesoLevels);
    topAudio[1].playbackRate = 2;
    return topAudio[0];
  }

//todo nextTick(cb)
//todo nextMesoTicks([cbs], levels)

//mesotask promises return true when completed, and false when cancelled.
//mesotask promises never fail.
  function nextMesoTicks(tasks, mesoLevels) {
    mesoLevels = Math.max(parseInt(mesoLevels), 0);
    var level = ratechangeTickStart(mesoLevels);
    var macrotaskPromise = addMesoLevelTasks(tasks, level);

    macrotaskPromise.nextMesoTick = function (extraTasks) {
      level = level.children[0];   //todo "level" is a closure variable.. its techincally safe, but likely can cause dev errors.
      if (level)                   //todo should i add "levels" to the macrotaskPromise instead??
        return addMesoLevelTasks(extraTasks, level);
      throw new Error("cannot add any more mesotasks to this macrotask");
    };

    // to flush a macroTask, you call cancel() which returns an array of not yet done methods,
    //                       and then you call these returned functions.
    //returns an array with the functions that were cancelled
    macrotaskPromise.cancel = function () {
      var undone = [];
      var resolves = [];
      //start with level, it is the deepest one that has added mesotasks
      while (level && level._mesoLevelTasks && level._mesoLevelTasks.length) {
        resolves.push(level._mesoLevelTasks.pop());         //take out the listener that will call the resolve on the element.
        undone = level._mesoLevelTasks.concat(undone);      //take the rest of the listeners out into undone
        level._mesoLevelTasks = undefined;                  //set to undefined to communicate the method being removed.
        level = level.parentNode;
      }
      for (let i = 0; i < resolves.length; i++)
        resolves[i]("cancelled");//todo should the resolve return false when cancelled??
      return undone;
    };
    return macrotaskPromise;
  }

  var reusables = [];
  var tasks = [];

  function doTask() {
    var task = tasks.shift();
    reusables.push(task.audio);
    task.resolve(task.cb());
  }

  function cancelTask(promise) {
    var taskIndex = tasks.findIndex(t => t.promise === promise);
    var task = tasks.splice(taskIndex, 1)[0];
    task.resolve(nextTick.cancelledTask);
    task.audio.onratechange = undefined; //note!! drops the event!
    return task.cb;
  }

  function nextTick(cb) {

    var resolve;
    var promise = new Promise(function (resolveImpl) {
      resolve = resolveImpl;
    });

    var audio;
    if (reusables.length)
      audio = reusables.shift();
    else {
      audio = document.createElement("audio");
      audio.onratechange = doTask;
    }
    audio.playbackRate = audio.playbackRate === 2 ? 1 : 2;
    tasks.push({cb, resolve, promise, audio});

    // Object.defineProperty(promise, "cancel", {value: cancelTask});
    promise.cancel = cancelTask.bind(null, promise); //is this safer, and is this faster??
    return promise;
  }
  nextTick.cancelledTask = {};
  Object.freeze(nextTick);
  Object.freeze(nextTick.cancelledTask);

  //alternative, custom export format. use version on the name
  window.nextTick ? window["2jsNextTick_1.0"] = nextTick : window.nextTick = nextTick;
  window.nextMesoTicks ? window["2jsNextMesoTicks_1.0"] = nextMesoTicks : window.nextMesoTicks = nextMesoTicks;
})();