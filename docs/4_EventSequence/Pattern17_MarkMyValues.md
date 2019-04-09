# Pattern: MarkMyValues

## Fact 1: Event data gets Garbage collected early

Some browsers, such as Chrome, delete (garbage collect) underlying data of native event objects
*before* they delete the Event object itself.
This means that some properties on an Event object might no longer be available 
if you try to read it asynchronously, such as from a `setTimeout` or rAF callback.
For example, even thought the DOM Event object of a mouse event still exists, 
its `x` and `y` properties can become undefined at a later point.
Once the setTimeout is invoked, the DOM Event object that represent the trigger event *only*
safely contains the `timeStamp` and `type`, plus the `target` if it has not been removed. 

```html
<div width="100%" height="100%">move the mouse to remove me</div>

<script>
var first = true;

window.addEventListener("mousemove", function(e){
  console.log(e.type);                 //mousemove
  console.log(e.timeStamp);            //23:59:59.31.12.1999
  console.log(e.target);               //div
  console.log(e.x);                    //42
  if (!first)                          
    e.target.remove();                 //e.target is kept the first time the mousemove event listener
  else                                 //is called, but then deleted
    first = false;                     
  setTimeout(function(){               
    console.log(e.type);               //mousemove
    console.log(e.timeStamp);          //23:59:59 31.12.1999
    console.log(e.target.typeName);    //first DIV, then undefined
    console.log(e.x);                  //undefined
  });
});
</script>
```

## HowTo: avoid loosing event data

Both the ReplaceDefaultAction and AfterthoughtEvent patterns delay
the dispatch of the composed event asynchronously using `setTimeout(...)`. 
This means that if your composed event needs to use values from the trigger event object such as
such as the `x` and `y` properties of mouse events, then these values must be stored *specifically, 
up front*.

Doing so is called **MarkMyValues**. **MarkMyValues** is the pattern of storing relevant trigger 
event values up-front. It is often not enough to simply store the DOM Event object. 
Exceptions are the `timeStamp`, `type`, and most often the `target` property.

The MarkMyValues pattern is most often used in combination with the DetailOnDemand pattern.
When used with DetailOnDemand, the values should be copied from the trigger event the composed
event in the construction of the DetailOnDemand object.

## Example: `long-press` with 30px wiggle room

<pretty-printer href="./demo/long-press-MarkMyValues.js"></pretty-printer>

## Demo: add a demo for long-press with 30px wiggle room

## Example: `triple-click` with little wiggle room

<pretty-printer href="./demo/triple-click-MarkMyValues.js"></pretty-printer>

## Demo: `triple-click` with little wiggle room

<code-demo src="./demo/triple-click-MarkMyValues.html"></code-demo>

## References

 * dunno
