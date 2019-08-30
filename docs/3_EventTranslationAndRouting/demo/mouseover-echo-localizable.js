(function(){
  function dispatchPriorEvent(target, composedEvent, trigger) {
    composedEvent.preventDefault = function () {
      trigger.preventDefault();
      trigger.stopImmediatePropagation ? trigger.stopImmediatePropagation() : trigger.stopPropagation();
    };
    composedEvent.trigger = trigger;
    target.dispatchEvent(composedEvent);
  }

  var locations;

  function querySelectorAllDeep(query, doc, res){
    res = res.concat(doc.querySelectorAll(query));
    var all = doc.querySelectorAll(query);
    for (var i = 0; i < all.length; i++)
      all[i].shadowRoot && querySelectorAllDeep(query, all[i].shadowRoot, res);
    return res;
  }

//will localize update and
  window.localizeMouseoverEcho = function(query){
    if (locations) {    //adding more
      var allLocations = querySelectorAllDeep(query, document, []);
      for (var i = 0; i < allLocations.length; i++) {
        var potentiallyNewLocation = allLocations[i];
        if (locations.indexOf(potentiallyNewLocation) < 0)
          potentiallyNewLocation.addEventListener("mouseover", onMouseover, true);
      }
      for (var i = 0; i < locations.length; i++) {
        var oldLocation = locations[i];
        if (allLocations.indexOf(oldLocation) < 0)
          oldLocation.removeEventListener("mouseover", onMouseover, true);
      }
      locations = allLocations;
    } else {            //first time
      locations = querySelectorAllDeep(query, document, []);
      for (var i = 0; i < locations.length; i++)
        locations[i].addEventListener("mouseover", onMouseover, true);
      window.removeEventListener("mouseover", onMouseover, true);
    }
  }

  window.globalizeMouseoverEcho = function(){
    if (!locations)   //already global
      return;
    for (var i = 0; i < locations.length; i++)
      locations[i].removeEventListener("mouseover", onMouseover, true);
    locations = undefined;
    window.addEventListener("mouseover", onMouseover, true);
  }


  function onMouseover(e){
    dispatchPriorEvent(e.target, new CustomEvent("mouseover-echo", {bubbles: true, composed: true}), e);
  }

  window.addEventListener("mouseover", onMouseover, true);
})();