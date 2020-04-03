# Pattern: LoadInQue

We will here look at another technique to put a task in a different position in the event loop: the `load` event.

The `load` event is similar to the `error` event in the UglyDuckling pattern. Both `load` and `error` are element lifecycle events. But, as opposed to the `error` in UglyDuckling, the `load` event does not represent something bad/unexpected.

But. There are different elements we can add the `load` event too, and there are different means to trigger them. Good candidates are `<img>`, `<script>`, `<style>`,  and `<link>`. We will only focus on two candidates here: `<img>` and `<link>`.

## `load` on `<img>` 
 
```javascript
function loadOnImg(cb) {
  const img = document.createElement("img");
  img.onload = function () {
    img.remove();
    cb();
  };
  img.style.display = "none";
  document.body.appendChild(img);
  img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
}
```

We use here a base64 representation of a single pixel gif image which we in turn do not display. But, this `load` event on `<img>` is a bit uncertain. It behaves differently in different browsers. Here is a test comparing the timing in Chrome, Firefox and Safari IOS 

### Test: ImgLoad vs ToggleTickTrick vs setTimeout

```javascript 
function toggleTick(cb) {
  const details = document.createElement("details");
  details.style.display = "none";
  details.ontoggle = function () {
    details.remove();
    cb();
  };
  document.body.appendChild(details);
  details.open = true;
}

function loadOnImg(cb) {
  const img = document.createElement("img");
  img.onload = function () {
    img.remove();
    cb();
  };
  img.style.display = "none";
  document.body.appendChild(img);
  img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
}
    
for (let i = 0; i < 5; i++){ 
  setTimeout(() => console.log("setTimeout 1"));
  loadOnImg(() => console.log("loadOnImg 1"));
  toggleTick(() => console.log("toggleTickTrick 1"));
  setTimeout(() => console.log("setTimeout 2"));
  loadOnImg(() => console.log("loadOnImg 2"));
  toggleTick(() => console.log("toggleTickTrick 2"));
}
```  

A result: 

```
Firefox 71            Chrome 79            Safari IOS 13.3

toggleTickTrick 1     toggleTickTrick 1    loadOnImg 1
toggleTickTrick 2     toggleTickTrick 2    loadOnImg 2
toggleTickTrick 1     toggleTickTrick 1    loadOnImg 1
toggleTickTrick 2     toggleTickTrick 2    loadOnImg 2
toggleTickTrick 1     toggleTickTrick 1    loadOnImg 1
toggleTickTrick 2     toggleTickTrick 2    loadOnImg 2
toggleTickTrick 1     toggleTickTrick 1    loadOnImg 1
toggleTickTrick 2     toggleTickTrick 2    loadOnImg 2
toggleTickTrick 1     toggleTickTrick 1    loadOnImg 1
toggleTickTrick 2     toggleTickTrick 2    loadOnImg 2
loadOnImg 1           loadOnImg 1          toggleTickTrick 1
loadOnImg 2           loadOnImg 2          toggleTickTrick 2
loadOnImg 1           loadOnImg 1          toggleTickTrick 1
loadOnImg 2           loadOnImg 2          toggleTickTrick 2
loadOnImg 1           loadOnImg 1          toggleTickTrick 1
loadOnImg 1  !!       loadOnImg 2          toggleTickTrick 2
loadOnImg 2  !!       loadOnImg 1          toggleTickTrick 1
loadOnImg 2           loadOnImg 2          toggleTickTrick 2
loadOnImg 1           loadOnImg 1          toggleTickTrick 1
loadOnImg 2           loadOnImg 2          toggleTickTrick 2
setTimeout 1          setTimeout 1         setTimeout 1
setTimeout 2          setTimeout 2         setTimeout 2
setTimeout 1          setTimeout 1         setTimeout 1
setTimeout 2          setTimeout 2         setTimeout 2
setTimeout 1          setTimeout 1         setTimeout 1
setTimeout 2          setTimeout 2         setTimeout 2
setTimeout 1          setTimeout 1         setTimeout 1
setTimeout 2          setTimeout 2         setTimeout 2
setTimeout 1          setTimeout 1         setTimeout 1
setTimeout 2          setTimeout 2         setTimeout 2
``` 

The order in Firefox of the `load` events might be scrambled like they were for the `error` event. Thus, you need to implement your own efficient queue and loop for tasks if you need a safer version of this pattern. In our tests, Chrome 79 didn't mess up the sequence of `loadOnImg` as Firefox did, but that may be just a coincidence, and in any case not relevant as will be shown later.  

Safari gives higher and different priority to loadOnImg tasks than it gives to ToggleTickTrick tasks.

## `load` on `<link>` 

What happens if we add the load event on a `<link rel="stylesheet">`? To do so, we a valid, but empty CSS rule "a{}" as base64 (`btoa("a{}") === "YXt9"`). 

```javascript
function loadOnLink(cb) {
  const link = document.createElement("link");
  link.onload = function () {
    link.remove();
    cb();
  };
  link.rel = "stylesheet";
  document.head.appendChild(link);
  link.href = "data:text/css;base64,YXt9";
}
```

Compared to `load` on `<img>`, there are two benefits: we add the "invisible" `<link>` element to the already invisible `document.head` (instead of the visible `document.body`) and the base64 is much shorter and sweeter. But. There is another big benefit. This `load` on link element is given the same priority or higher priority in our test browsers:

### Test: loadOnLink vs ToggleTickTrick vs setTimeout

```javascript 
function toggleTick(cb) {
  const details = document.createElement("details");
  details.style.display = "none";
  details.ontoggle = function () {
    details.remove();
    cb();
  };
  document.body.appendChild(details);
  details.open = true;
}

function loadOnLink(cb) {
  const link = document.createElement("link");
  link.onload = function () {
    link.remove();
    cb();
  };
  link.rel = "stylesheet";
  document.head.appendChild(link);
  link.href = "data:text/css;base64,YXt9";
}
    
for (let i = 0; i < 5; i++){ 
  setTimeout(() => console.log("setTimeout 1"));
  loadOnLink(() => console.log("loadOnImg 1"));
  toggleTick(() => console.log("toggleTickTrick 1"));
  setTimeout(() => console.log("setTimeout 2"));
  loadOnLink(() => console.log("loadOnImg 2"));
  toggleTick(() => console.log("toggleTickTrick 2"));
}
```  

Results:

```
Firefox 71            Chrome 79             Safari IOS 13.3
                                          
toggleTickTrick 1     toggleTickTrick 1     loadOnLink 1
toggleTickTrick 2     loadOnImg 1           loadOnLink 2
toggleTickTrick 1     toggleTickTrick 2     loadOnLink 1
toggleTickTrick 2     loadOnImg 2           loadOnLink 2
toggleTickTrick 1     toggleTickTrick 1     loadOnLink 1
toggleTickTrick 2     loadOnImg 1           loadOnLink 2
toggleTickTrick 1     toggleTickTrick 2     loadOnLink 1
toggleTickTrick 2     loadOnImg 2           loadOnLink 2
toggleTickTrick 1     toggleTickTrick 1     loadOnLink 1
toggleTickTrick 2     loadOnImg 1           loadOnLink 2
loadOnLink 1          toggleTickTrick 2     toggleTickTrick 1
loadOnLink 2          loadOnImg 2           toggleTickTrick 2
loadOnLink 1          toggleTickTrick 1     toggleTickTrick 1
loadOnLink 2          loadOnImg 1           toggleTickTrick 2
loadOnLink 1          toggleTickTrick 2     toggleTickTrick 1
loadOnLink 2          loadOnImg 2           toggleTickTrick 2
loadOnLink 1          toggleTickTrick 1     toggleTickTrick 1
loadOnLink 2          loadOnImg 1           toggleTickTrick 2
loadOnLink 1          toggleTickTrick 2     toggleTickTrick 1
loadOnLink 2          loadOnImg 2           toggleTickTrick 2
setTimeout 1          setTimeout 1          setTimeout 1
setTimeout 2          setTimeout 2          setTimeout 2
setTimeout 1          setTimeout 1          setTimeout 1
setTimeout 2          setTimeout 2          setTimeout 2
setTimeout 1          setTimeout 1          setTimeout 1
setTimeout 2          setTimeout 2          setTimeout 2
setTimeout 1          setTimeout 1          setTimeout 1
setTimeout 2          setTimeout 2          setTimeout 2
setTimeout 1          setTimeout 1          setTimeout 1
setTimeout 2          setTimeout 2          setTimeout 2
``` 

Here, we get three different priorities:
 * Safari `load` on `<link>` *before* `toggle`.
 * Firefox `load` on `<link>` *after* `toggle`.
 * Chrome `load` on `<link>` *at the same time as* `toggle`.
  
Still, this is better, as there is no sequential problems in Firefox. So. How do we solve the problem of erratic priorities? 

## HowTo: dynamically assert the priority of macrotask queues?

```javascript 
const macrotaskPriority = [];

function toggleTick(cb) {
  const details = document.createElement("details");
  details.style.display = "none";
  details.ontoggle = function () {
    details.remove();
    cb();
  };
  document.body.appendChild(details);
  details.open = true;
}

function loadOnLink(cb) {
  const link = document.createElement("link");
  link.onload = function () {
    link.remove();
    cb();
  };
  link.rel = "stylesheet";
  document.head.appendChild(link);
  link.href = "data:text/css;base64,YXt9";
}

toggleTick(()=> macrotaskPriority.push("toggle"));
loadOnLink(()=> macrotaskPriority.push("load"));
toggleTick(()=> macrotaskPriority.push("toggle"));
loadOnLink(()=> macrotaskPriority.push("load"));
let firstPriority = "load" || "toggle"; //what you prefer
setTimeout(function(){
  if (macrotaskPriority[0] === "load" && macrotaskPriority[1] === "load")
    firstPriority = "load";
  else if (macrotaskPriority[0] === "toggle" && macrotaskPriority[1] === "toggle")
    firstPriority = "toggle";
});
``` 

In Safari 13.3 `firstPriority` would be `"load"`. In and Firefox 71 it would be `"toggle"`. And in Chrome 79 it would be whatever you choose as default.

## `load` or `<script>`

`<link>`, `<img>` and `<script>` are all special elements. One would expect the browsers to give their `load` events special treatment in the event loop. We therefore need to check `load` on `<script>` too. Maybe the `load` event on `<script>` is more consistent across browsers than the others? Maybe it is given higher priority than the others? Lets find out.

```javascript
function loadOnScript(cb) {
  const script = document.createElement("script");
  script.onload = function () {
    script.remove();
    cb();
  };
  document.head.appendChild(script);
  script.src = "data:text/javascript;base64,MSsx"; //btoa("1+1") === "MSsx"
}
```

### Test: loadOnLink vs ToggleTickTrick vs setTimeout

```javascript 
function toggleTick(cb) {
  const details = document.createElement("details");
  details.style.display = "none";
  details.ontoggle = function () {
    details.remove();
    cb();
  };
  document.body.appendChild(details);
  details.open = true;
}

function loadOnScript(cb) {
  const script = document.createElement("script");
  script.onload = function () {
    script.remove();
    cb();
  };
  document.head.appendChild(script);
  script.src = "data:text/javascript;base64,MSsx"; //btoa("1+1") === "MSsx"
}

for (let i = 0; i < 5; i++){ 
  setTimeout(() => console.log("setTimeout 1"));
  loadOnScript(() => console.log("loadOnScript 1"));
  toggleTick(() => console.log("toggleTickTrick 1"));
  setTimeout(() => console.log("setTimeout 2"));
  loadOnScript(() => console.log("loadOnScript 2"));
  toggleTick(() => console.log("toggleTickTrick 2"));
}
```  

Results:

```
Firefox 71            Safari IOS 13.3      Chrome 79

loadOnScript 1        toggleTickTrick 1    toggleTickTrick 1
toggleTickTrick 1     toggleTickTrick 2    toggleTickTrick 2
loadOnScript 2        toggleTickTrick 1    toggleTickTrick 1
toggleTickTrick 2     toggleTickTrick 2    toggleTickTrick 2
loadOnScript 1        toggleTickTrick 1    toggleTickTrick 1
toggleTickTrick 1     toggleTickTrick 2    toggleTickTrick 2
loadOnScript 2        toggleTickTrick 1    toggleTickTrick 1
toggleTickTrick 2     toggleTickTrick 2    toggleTickTrick 2
loadOnScript 1        toggleTickTrick 1    toggleTickTrick 1
toggleTickTrick 1     toggleTickTrick 2    toggleTickTrick 2
loadOnScript 2        setTimeout 1         setTimeout 1
toggleTickTrick 2     setTimeout 2         setTimeout 2
loadOnScript 1        setTimeout 1         setTimeout 1
toggleTickTrick 1     setTimeout 2         setTimeout 2
loadOnScript 2        setTimeout 1         setTimeout 1
toggleTickTrick 2     loadOnLink 1         setTimeout 2
loadOnScript 1        loadOnLink 2         loadOnScript 1 !!
toggleTickTrick 1     loadOnLink 1         setTimeout 1   !!
loadOnScript 2        loadOnLink 2         setTimeout 2   !!
toggleTickTrick 2     loadOnLink 1         setTimeout 1   !!
setTimeout 1          loadOnLink 2         loadOnScript 1 !!
setTimeout 2          loadOnLink 1         setTimeout 2   !!
setTimeout 1          loadOnLink 2         loadOnScript 1 !!
setTimeout 2          loadOnLink 1         loadOnScript 1 !!
setTimeout 1          loadOnLink 2         loadOnScript 2 !!
setTimeout 2          setTimeout 2         loadOnScript 2 !!
setTimeout 1          setTimeout 1         loadOnScript 2 !!
setTimeout 2          setTimeout 2         loadOnScript 2 !!
setTimeout 1          setTimeout 1         loadOnScript 1 
setTimeout 2          setTimeout 2         loadOnScript 2
``` 

The `load` on `<script>` is queued very erratic, both across browsers, and within the macrotask queues of both Chrome and Safari. If regularity and priority is needed, the `load` on `<script>` elements do not provide a good basis.  

## References

  * dunno