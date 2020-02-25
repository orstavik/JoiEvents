# WhatIs: `drag`?


## Demo: native `drag` actions

```html
<div draggable="true">Hello sunshine</div>

<script>
  window.addEventListener("mousedown", e => console.log(e.type));
  window.addEventListener("mouseup", e => console.log(e.type));
  window.addEventListener("mousemove", e => console.log(e.type));
  window.addEventListener("click", e => console.log(e.type));

  window.addEventListener("dragstart", e => console.log(e.type));
  window.addEventListener("drag", e => console.log(e.type));
  window.addEventListener("dragend", e => console.log(e.type));
</script>
```

If you press down the left mouse button and moves the mouse ~3-5 pixels in any direction, the native `dragstart` event kicks in. The `drag` events will essentially capture and prevent any ensuing mouse events from being dispatched and instead *rename* then as `mouseup` => `dragend` and `mousemove` => `drag`. (There are more events being renamed and dispatched, but for the purposes of this chapter, we only focus on these two events).  

## Demo: naive DragController

The `dragstart` event does something new! Once triggered, it will grab future `mousemove` and `mouseup` events and replace them with its own `drag` and `dragend` mirror events. Similarly, the `dragend` event releases this grip. To achieve this effect, the DragController must add an event listener that is triggered *before* any other event listener for those mouse events are called. The DragController thus shifts states, and changes *which* events it will listen for in different states.

```html
<div my-draggable>Hello sunshine</div>

<script>
  const DragController = {
    mousedown: undefined,
    myDraggable: undefined,
    onMousedown: function (e) {
      if (e.buttons !== 1)
        return;
      DragController.myDraggable = e.composedPath().find(n => n.hasAttribute && n.hasAttribute("my-draggable"));
      if (!DragController.myDraggable)
        return;
      DragController.mousedown = e;
      window.removeEventListener("mousedown", DragController.onMousedown, true);
      window.addEventListener("mousemove", DragController.onMousemoveTesting, true);
    },
    onMousemoveTesting: function (e) {
      const diagX = Math.abs(DragController.mousedown.clientX - e.clientX);
      const diagY = Math.abs(DragController.mousedown.clientY - e.clientY);
      if (diagX + diagY <= 5)
        return;
      window.removeEventListener("mousemove", DragController.onMousemoveTesting, true);
      window.addEventListener("mousemove", DragController.onMousemoveTranslating, true);
      window.addEventListener("mouseup", DragController.onMouseup, true);
      window.addEventListener("click", DragController.onClick, true);
      const myDragStart = new CustomEvent("my-dragstart", {composed: true, bubbles: true});
      setTimeout(function(){
        DragController.myDraggable.dispatchEvent(myDragStart);
      });
    },
    onClick: function (e) {
      e.stopImmediatePropagation();
      e.preventDefault();
      window.removeEventListener("click", DragController.onClick, true);
    },
    onMousemoveTranslating: function (e) {
      e.stopImmediatePropagation();
      e.preventDefault();
      const myDrag = new CustomEvent("my-drag", {composed: true, bubbles: true});
      setTimeout(function(){
        DragController.myDraggable.dispatchEvent(myDrag);
      });
    },
    onMouseup: function (e) {
      e.stopImmediatePropagation();
      e.preventDefault();
      window.removeEventListener("mousemove", DragController.onMousemoveTranslating, true);
      window.removeEventListener("mouseup", DragController.onMouseup, true);
      window.addEventListener("mousedown", DragController.onMousedown, true);
      const myDragEnd = new CustomEvent("my-dragend", {composed: true, bubbles: true});
      setTimeout(function(){
        DragController.myDraggable.dispatchEvent(myDragEnd);
      });
    },
  };
  window.addEventListener("mousedown", DragController.onMousedown, true);

  window.addEventListener("mousedown", e => console.log(e.type));
  window.addEventListener("mouseup", e => console.log(e.type));
  window.addEventListener("mousemove", e => console.log(e.type));
  window.addEventListener("click", e => console.log(e.type));

  window.addEventListener("my-dragstart", e => console.log(e.type));
  window.addEventListener("my-drag", e => console.log(e.type));
  window.addEventListener("my-dragend", e => console.log(e.type));
</script>
```    

## References

 * dunno