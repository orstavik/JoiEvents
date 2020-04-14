# HowTo: dispatchEvent?

> In this chapter, the term web components refers to the functions that control both native and custom elements.

Events are/should be dispatched from three different types of modules:
 
1. Reusable web components (ie. native and custom elements). 
2. Reusable JS components.
3. Reusable event components.

## 1. Events up, attributes and properties down.

Web developers are familiar with the app context. The "main DOM". The DOM context with the `document` as root. The "normal" DOM.

The main DOM context contains all the components of the application. Both web, JS, and event components are all loaded from the main context, and these components should provide an API of JS properties (including methods and functions), HTML attributes, and CSS properties. 

For example, a JS component could be added under the `window` node in the DOM, and given a set of methods for initial and dynamic settings, callbacks etc. If a state change occurs in the main DOM above this JS module, this method should be used to communicate that state change *into* the JS component. that could     

Another example is the web component.

When a state change occurs in the app context, the developer only has to communicate this state change *down*:  this is a top level state change. The app should know about all the other components in the DOM (both reusable JS, then this state change might cause one of the components to change: you might need to update the  When a state change occurs at this level, ie. an app level state change ithin this DOM context, if you have an state change you will see all the other elements in the 

Some web components know their DOM. They are built with a knowledge of both a) their own location and b) the location of other components. These web components are application specific (or specific subcomponents of a larger component). Their developer is the app developer (or knows the same as the app developer). Their developer can directly reference all the other components (web, JS, and event). These web components can often dispatch events for ease of development, they do not need to dispatch events, however they often do dispatch events as it helps the developer create a clearer interface and helps him/her divide a bigger problem into smaller ones that can more easily be divided up in his/her own mind.

But, when the web component is to be reused across applications and in different DOMs, any prior knowledge about the DOM and other components is lost. The developer of reusable web components do not know which other functions that *might* be triggered when the element changes state. Use of the interface 

And so, the element must communicate its state changes to such *unknown, potential others*, as events. (Philosophically, we could say that the element is addressing both the past, the present, and the future. But we won't go in there just now.) 

When a web component (native or custom element  changes state, it should follow the rule of thumb: **events down, attributes and properties down**. Native and custom elements are standalone  
web components (the native Three types of functions:


****

However. To understand this expression, we need to clarify a bit:

1. Events up **into functions**, attributes and properties down **into pure data**. Events are 


 need some context:
 * **up** means in the direction of both a) an "upper, lightDOM" DOM context and b) other functions.
 * **down** means in the direction of both a) elements in the same DOM context and b) towards actual changes in the state.
  
Up does not mean from one element to an ancestor element within the same DOM context. When you state change needs to direct
 
   not elements higher positioned *within* the DOM context the function you are writing is located. We need an example:

JS modules
2. **Events up and out, settings via methods and properties inside.**

Event controller
3. **Events in, events (and totally controlled DOM properties (css pseudo-classes and write protected properties)) out.**


## Which functions dispatch events

Events are dispatched when it is uncertain which other functions should react to the state change. This uncertainty arises *only* in three types of contexts:
 
1. In the context of a different DOM context, ie. from the code of a web component.
2. An independent event controller, ie. from the code of a generalized event observer that dispatch cascade events.
3. An independent JS module that observe an external state. This could be a database or network module.  

We will look more in detail about this in later chapters, especially There are three places that need to call `dispatchEvent(...)`, either directly or indirectly via `addDefaultAction()`. 

If code is developed within 

