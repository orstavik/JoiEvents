//TEST1 of defaultPrevented
var defaultPrevented = true;
function testDefaultPrevented(e) {
  if (e.trigger.defaultPrevented)
    return true;
  console.error(e.trigger.type + " not defaultPrevented");
  defaultPrevented = false;
  return false;
}
window.addEventListener("dragging-start", testDefaultPrevented);
window.addEventListener("dragging-move", testDefaultPrevented);
window.addEventListener("dragging-stop", testDefaultPrevented);
window.addEventListener("fling", testDefaultPrevented);

//TEST2a
var userSelectWorking = true;
function userSelectShouldBe(e) {
  let value = (e.type === "dragging-start" || e.type === "dragging-move") ? "none" : "";
  if (document.children[0].style.userSelect === value)
    return;
  console.warn("html.style.userSelect not set to: " + value);
  userSelectWorking = false;
}
window.addEventListener("dragging-start", userSelectShouldBe);
window.addEventListener("dragging-move", userSelectShouldBe);
window.addEventListener("dragging-stop", userSelectShouldBe);
window.addEventListener("dragging-cancel", userSelectShouldBe);
window.addEventListener("fling", userSelectShouldBe);

//TEST2b
var dragActive = false;
window.addEventListener("dragging-start", function(){dragActive = true});
window.addEventListener("dragging-stop", function(){dragActive = false});
window.addEventListener("dragging-cancel", function(){dragActive = false});
window.addEventListener("dragging-cancel", function(){dragActive = false});
window.addEventListener("selectstart", function() {
  dragActive ?
    console.error("UserSelectWorks should never fire during dragging."):
    console.log("UserSelectWorks in other situations.");
});

//TEST3
var targetHasAttribute = true;
function testDraggableAttribute(e) {
  if (e.target.hasAttribute("draggable"))
    return true;
  console.error(e.target, "Wrong target, lacking attribute draggable");
  return false;
}
window.addEventListener("dragging-start", testDraggableAttribute);

//TEST4
var sequenceWorking = true;
var sequences = [
  ["dragging-start", "dragging-move", "dragging-move", "dragging-stop", "fling"],
  ["dragging-start", "dragging-move", "dragging-move", "dragging-cancel"],
  ["dragging-start", "dragging-cancel"],
  ["dragging-start", "dragging-stop"]
];
var prevEvent = undefined;

function checkSequence(e) {
  let prevType = prevEvent? prevEvent.type : undefined;
  for (let sequence of sequences) {
    let prevPosition = sequence.indexOf(
      prevType);
    let position = sequence.lastIndexOf(e.type);
    if (prevPosition < position)
      return prevEvent = e; //true
  }
  console.warn(e.type + " is following " + prevType);
  sequenceWorking = false;
}

window.addEventListener("dragging-start", checkSequence);
window.addEventListener("dragging-move", checkSequence);
window.addEventListener("dragging-stop", checkSequence);
window.addEventListener("dragging-cancel", checkSequence);
window.addEventListener("fling", checkSequence);

//TEST5
var beforeCancelEvent = undefined;
window.addEventListener("dragging-start", function(e){beforeCancelEvent = e;});
window.addEventListener("dragging-move", function(e){beforeCancelEvent = e;});
window.addEventListener("dragging-cancel", function(e){
  debugger;
});


//Report tests
function reportTests() {
  sequenceWorking ? console.log("OK sequence") : console.warn("ERROR sequence");
  targetHasAttribute ? console.log("OK draggable") : console.warn("ERROR missing draggable attribute");
  defaultPrevented ? console.log("OK defaultPrevented") : console.warn("ERROR defaultPrevented");
  userSelectWorking ? console.log("OK userSelect") : console.warn("ERROR userSelect");
}

window.addEventListener("dragging-stop", reportTests);
window.addEventListener("dragging-cancel", reportTests);
window.addEventListener("dragging-fling", reportTests);