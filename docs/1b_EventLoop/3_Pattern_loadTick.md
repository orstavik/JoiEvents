# Pattern: loadTick

When the `src` of an `<img>` element has completed loading, a `load` event is dispatched on that `<img>` element. By creating an `<img>` element and passing it a minimal `src` element, we can essentially place a callback in the event loop.
 
## Implementation: `imageOnloadTick` 
 
```javascript
var _imageOnloadTick_queue = [];
function imageOnloadTick(cb){
  _imageOnloadTick_queue.push(cb);
  var img = document.createElement("img");
  img.onload = function(){
    _imageOnloadTick_queue.shift()();
  };
  img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
}
``` 

Behind this implementation lies three secrets:
1. The `<img>` element does **not(!)** have to be connected to the DOM to trigger the `load` event. Not having to add the `<img>` element to the DOM greatly improves the performance of this technique.
2. The smallest, fastest image to load is a 1px GIF: `data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7`. The browser will cache and very efficiently handle this reference, and it does not really increase performance to use `URL.createObjectURL` for example.
3. The browser dispatches `load` events in the order the `<img>` element has finished loading its source. This is no secret. But, when many browsers load `<img>` elements, even when they have the exact same source data, *and* that source data is a minimal base64 string, async processing, internal caching in the browser and stuff like that can cause later `<img>` elements to *finish* loading *before* earlier instances of the exact same image. This simply means that when responding to `load` events from the same `<img>`, we need to make an internal queue of the callbacks.     

## `load` on `<link>` and `<script>`

Several other elements in the DOM will also dispatch a `load` event: `<img>`, `<script>`, `<style>`, `<svg>`, `<link>`, `<object>`, `<embed>`, `<iframe>`, etc. Here, we will look at two other such method: `load` on `<link>` and `load` on `<script>` using an empty base64 source (`btoa("") === ""`). 

Trigger `load` via a new `<link rel="stylesheet" href="data:text/css;base64,">`: 

```javascript
var __linkOnloadTick_queue = [];
function linkOnloadTick(cb) {
  __linkOnloadTick_queue.push(cb);
  const link = document.createElement("link");
  link.onload = function () {
    link.remove();
    __linkOnloadTick_queue.shift()();
  };
  link.rel = "stylesheet";
  document.head.appendChild(link);
  link.href = "data:text/css;base64,"; //btoa("") === ""
}
```

Trigger `script` via a new `<script src="data:text/javascript;base64,">`: 

```javascript
var __scriptOnloadTick_queue = [];
function scriptOnloadTick(cb) {
  __scriptOnloadTick_queue.push(cb);
  const script = document.createElement("script");
  script.onload = function () {
    script.remove();
    __scriptOnloadTick_queue.shift()();
  };
  document.head.appendChild(script);
  script.src = "data:text/javascript;base64,"; 
}
```

## References

 * [smallest base64 image](http://proger.i-forge.net/%D0%9A%D0%BE%D0%BC%D0%BF%D1%8C%D1%8E%D1%82%D0%B5%D1%80/[20121112]%20The%20smallest%20transparent%20pixel.html)








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
loadOnImg 1  !!       loadOnImg 1          toggleTickTrick 1
loadOnImg 1  !!       loadOnImg 2          toggleTickTrick 2
loadOnImg 2  !!       loadOnImg 1          toggleTickTrick 1
loadOnImg 2  !!       loadOnImg 2          toggleTickTrick 2
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

The order Firefox (and the other browsers in other tests) call the `load` events might be scrambled like they were for the `error` event. Thus, you need to implement your own efficient queue and loop for tasks if you need a safer version of this pattern. In our tests, Chrome 79 didn't mess up the sequence of `loadOnImg` as Firefox did, but that may be just a coincidence, and in any case not relevant as will be shown later.  

Safari gives higher and different priority to loadOnImg tasks than it gives to ToggleTickTrick tasks.

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

