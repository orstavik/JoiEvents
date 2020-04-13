# Problem: NoSyncMacroTask

Macrotasks and microtasks are async, they delay the calling of their function. For microtasks, this is always unproblematic: it would serve no purpose if microtasks were not delayed. *But*. The same is not true for macrotasks. Macrotasks serve two purposes: a) they skew functions in time, and b) they ensure that a group of microtasks run together.
 
But, what if we only wanted (b)? What if we wanted to run a group of tasks immediately, but at the same time ensure that any microtasks spawned from our group of functions would be completed before the control of flow returned? What if we wanted to create a **sync** macrotask scope?
 
## Demo: Theoretical sync macrotask  

Theoretically, the construct looks like this:

```javascript
console.log("a");
queueMicrotaskAsync(function(){console.log("e");});
runMacrotaskSync(function(){
  queueMicrotaskAsync(function(){ console.log("c");});
  console.log("b");
});
console.log("d");
```
The aim is to produce `a b c d e`. We want to achieve in time a frame that would create its own scope for the microtask queue.

## The limitations of macrotask scoping

Using `Promise.resolve().then(...)` and `setTimeout(...)` achieves this effect. The `setTimeout(...)` achieves the effect of creating a scope for the microtask, but at the expense of delaying the macrotask execution:

```javascript
console.log("a");
Promise.resolve().then(function(){
  console.log("e");
});
setTimeout(function(){
  console.log("b");
  Promise.resolve().then(function(){
    console.log("c");
  });
});
console.log("d");
``` 
The output is `a d e b c`.

## Discussion

We can't scope a group of function calls as a macrotask and have it run immediately. The only means we have to generate macrotask scope, such as `setTimeout(...)` or `toggleTick(...)` will inevitably *also delay* the macrotask in time by queueing it in the event loop.

## References

 * dunno