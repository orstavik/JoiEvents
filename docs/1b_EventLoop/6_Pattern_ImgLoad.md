# Pattern: ImgLoad

Finally, we will add one other technique to put a task in a different position in the event loop: ImgLoad.

## Implementation: ImgLoad

The ImgLoad is similar to the UglyDuckling. It works based on element lifecycle events of an element loading a piece of source, but this time it is the `load` event, not the `error` event. The ImgLoad pattern also uses an `<img>` element, and we trigger the `load` event by providing the `<img>` element with minimal base64 gif data.
 
```javascript
function loadOnImg(cb) {
  const img = document.createElement("img");
  img.onload = function () {
    img.remove();
    cb();
  };
  img.style.display = "none";
  //todo not sure if this influences the browsers loading of the base64 data.
  document.body.appendChild(img);
  img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
}
```

## Test: ImgLoad vs ToggleTickTrick vs setTimeout

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

#### Results: Chrome 79 and Firefox 71

```
   toggleTickTrick 1 
   toggleTickTrick 2 
   toggleTickTrick 1 
   toggleTickTrick 2 
   toggleTickTrick 1 
   toggleTickTrick 2 
   toggleTickTrick 1 
   toggleTickTrick 2 
   toggleTickTrick 1 
   toggleTickTrick 2 
   loadOnImg 1 
   loadOnImg 2 
   loadOnImg 1 
   loadOnImg 2 
2x loadOnImg 1 
2x loadOnImg 2 
   loadOnImg 1 
   loadOnImg 2 
   setTimeout 1 
   setTimeout 2 
   setTimeout 1 
   setTimeout 2 
   setTimeout 1 
   setTimeout 2 
   setTimeout 1 
   setTimeout 2 
   setTimeout 1 
   setTimeout 2
``` 

The order in Firefox of the `load` events might be scrambled like they were for the `error` event. Thus, you need to implement your own efficient queue and loop for tasks if you need a safer version of this pattern.  

#### Results: Safari IOS 13.3

```
   loadOnImg 1 
   loadOnImg 2 
   loadOnImg 1 
   loadOnImg 2 
   loadOnImg 1 
   loadOnImg 2 
   loadOnImg 1 
   loadOnImg 2 
   loadOnImg 1 
   loadOnImg 2 
   toggleTickTrick 1 
   toggleTickTrick 2 
   toggleTickTrick 1 
   toggleTickTrick 2 
   toggleTickTrick 1 
   toggleTickTrick 2 
   toggleTickTrick 1 
   toggleTickTrick 2 
   toggleTickTrick 1 
   toggleTickTrick 2 
   setTimeout 1 
   setTimeout 2 
   setTimeout 1 
   setTimeout 2 
   setTimeout 1 
   setTimeout 2 
   setTimeout 1 
   setTimeout 2 
   setTimeout 1 
   setTimeout 2
``` 

Safari gives higher and different priority to loadOnImg tasks than it gives to ToggleTickTrick tasks. 

## Conclusion: Browser diversity stinks

In Safari, the tasks with the highest priority are `load` events. In Chrome and Firefox the tasks with the highest priority is `toggle` and `message` events.

To check the priority of the current macrotask queue, can be done with the following test:

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

toggleTick(()=> macrotaskPriority.push("toggle"));
loadOnImg(()=> macrotaskPriority.push("load"));
``` 

In Safari IOS 13.3 `macrotaskPriority === ["load", "toggle"]`. 
In Chrome 79 and Firefox 71 `macrotaskPriority === ["toggle", "load"]`. 

## References

  * dunno