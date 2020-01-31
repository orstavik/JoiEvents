# Pattern: OneEventToOneAction

Some events such as `submit` and `contextmenu` only have *one* possible default action. They are simple. Likeable. And we say that these events-to-defaultAction pairs conform to a OneEventToOneAction pattern.

## Demo: naive ContextMenuController

So. What does these events look like inside? How can we make such events in JS? And what does the function that control them look like?

In the demo below a function `ContextMenuController` essentially recreates the logic of the `contextmenu` event cascade. The demo:

1. completely blocks all the native `contextmenu` events. 
2. then it adds a function `ContextMenuController` that listens for `mousedown` events.
3. The `ContextMenuController` filters the `mousedown` events so as to only respond to right-button mouse clicks.
4. Once the `ContextMenuController` receives a right-mouse-button-down, it
   1. creates a new `my-context-menu` event,
   2. queues the first task of dispatching the new event in the event loop,
   3. queues the second task of showing a poor excuse for a context menu in the event loop, and
   4. updates the `.preventDefault()` of the `my-context-menu` event object, so that if someone calls `.preventDefault()` on it, this will cancel the the second task of showing the context menu.    

* If you press on the header "Right click (no context menu)", an event listener will call `.preventDefault()` on the `my-context-menu` event.   
* If you press on the text "Right click here will show context menu", you will see a poor excuse for a context menu.   

```html
<h1>Right click (no context menu)</h1>
Right click here will show context menu 

<script>
  //1. block all contextmenu events and stops their default actions
  window.addEventListener("contextmenu", function(e){
    e.stopImmediatePropagation();
    e.preventDefault();
  }, true);
   
  const h1 = document.querySelector("h1");

  function ContextMenuController(mousedownEvent){
    if (mousedownEvent.button !== 2)
      return;

    const myContextMenuEvent = new CustomEvent("my-context-menu", {composed: true, bubbles: true});
    const task1 = setTimeout(function(){
      mousedownEvent.target.dispatchEvent(myContextMenuEvent);
    });
    const task2 = setTimeout(function(){
      alert("this is a bad excuse for a context menu..");
    });
    Object.defineProperty(myContextMenuEvent, "preventDefault", {value: function(){
      clearTimeout(task2);
    }});
  }
  window.addEventListener("mousedown", ContextMenuController);

  window.addEventListener("mousedown", e => console.log(e.type));
  window.addEventListener("my-context-menu", e => console.log(e.type));

  h1.addEventListener("my-context-menu", e => e.preventDefault());
</script>
```    

## References

 * dunno