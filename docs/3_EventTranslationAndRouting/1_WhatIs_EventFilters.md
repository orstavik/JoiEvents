# HowTo: DirectEvents

## DOM-universal events

Custom, composed events constructed using the PriorEvent, AfterthoughtEvent or ReplaceDefaultAction patterns are **global by default**. The event trigger function is added to the global object, `window`, and the trigger function can dispatch a custom, composed event for any DOM element.

The DOM-universal aspect of these patterns has several benefits:

1. You do not need to register and run more than a single event trigger listener function even though you might want to apply your custom, composed event to many different elements. This can have adverse effects if you add event trigger functions on high frequency events such as `mousemove` or `wheel`. You do not wan't to do that. But, if you initially only add event trigger functions on low-frequency events such as `mousedown` or `click`, then having a single global event listener will give you a performance boost if you intend to apply it to many elements in the DOM, potentially at the same time.
                                                                                   
   The performance benefits will be described more in detail under the EventSequence pattern.

//todo this DOM universal chapter must be merged into GlobalVsLocal
   
2. The event is always available, on any DOM element that you wish to use it on. This makes it **composeable from the lightDOM**. This has two huuuuge implications:
   
   1. The custom events can be applied to native elements as well as custom elements 
      (or other specialized modules). As the event is always available, and propagates similar to 
      native events, you do not have to make a custom element or module to make a `<div>` draggable
      or capture a custom `swipe` event on an image.
      
   2. The creation, management, control, and maintenance of the code making the custom event thus has no coupling to the creation, management, control, and maintenance of custom elements. I cannot overstate how important this is. Custom event creation, management, control, and maintenance very quickly grow in complexity: for any event of some magnitude, there are likely tens of edge-cases, valuable tricks, associated conventions and best practices. The complexity of custom element creation, management, control, and maintenance is equally demanding. To be able to separate these two beasts and tackle them one by one is extremely beneficial. When the complexity of both custom  events and custom elements must be managed as one, the complexity of one such web component can easily sink a project before it gets of the ground.

3. Many native events are also DOM-universal. If you wish to use `long-press` or `tap` in your app, such an event clearly echoes `click` and you would likely desire to have this available as a global feature, as you would `click`. Having your custom, composed events global therefore gives you the ability to parrot the platforms conventions when this is appropriate.

## Element-specific events

However, sometimes events are not global. The `submit` event for example is only ever dispatched by/on `<form>` elements; and the `change` event always target `<input>` and `<textarea>` (and `<select>`??) elements. Many events are thus not universal to all elements in the DOM (DOM-universal), but specific to a select group of DOM elements (element-specific).

There are three ways methods to activate/deactivate custom, composed events:
1. element type (TypedEvents).
2. element attribute (AttributableEvents).
3. CSS property applied to an element (CssControlEvents).
 
## References

 * 
                                                                            