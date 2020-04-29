# WhatIs: web components?

## Why: web components?

The dimensions of structure, style, behavior, and event flow in big DOM structures quickly become unmanageable. The reason for this is that they all relate to each other. If one dimension changes state, say a new external event occurs, then this event may change the state of the structure, style and behavior of the app, which all in turn may trigger yet other state changes in various domains. State changes in all four domains cascade and cross into each other.
 
These intertwined "state changing relationships" very rapidly become very complex. Complex here means technical complexity such as race conditions and the need to coordinate changes in one domain when it is influenced by two or more simultaneous state changes. But complex here also means "ergonomic" complexity: the number and nuance of the intertwined relationships quickly become so many that the developer will struggle *both* to find them all *and* to keep them in mind all at once.
 
To combat this complexity, developers follow best practices about how to sort and divide one large problem into many smaller problems. They chisel away at the big problem until all the pieces are small enough for them to carry safely in their mind.

The smaller pieces that developers break a big DOM app into are web components. Web components cluster a smaller set of HTML, CSS, JS, and events into a module. These modules should be small enough so that the developer can manage the intervowen relationships in them safely, while at the same time include so many of them that they function as a useful level of abstraction in the context in which they are used. To strike this balance is not easy: it is an art, it is about making the code itself beautiful and harmonic. For more, see this chapter about why making web components. [todo internal ref to chapter about why web comps](todo).

## WhatIs: a shadowDOM?

Web components are HTML elements with a **shadowDOM**. The shadowDOM is made up a group of HTML elements, CSS rules, JS functions and with an inner event flow. Web components are essentially mini-apps within the app. 

> If you analyze an HTML element, both native and custom, it recursively breaks down into layers of gradually simpler HTML elements and JS and CSS code (shadowDOMs). When the process is complete, all you are left with is a bunch of `<span>` elements, JS functions, CSS rules, and events. More or less.

The shadowDOM is the "inner DOM context" of an HTML element. The lightDOM is the name for the "outer DOM context" of an element. The lightDOM can be the topmost, root, main DOM of the app itself, and it can be another shadowDOM; elements can be nested inside each other's shadowDOM.  

In an app, the main DOM and all the nested shadowDOMs of its elements form an **acyclical graph** of DOM nodes. This is called the "flattened DOM". In an actual running app, the flattened DOM is the final truth for the browser. However, the main DOM and all its nested shadowDOMs also form an **acyclical graph of DOM *contexts***. Due to reasons of complexity, each individual **DOM context** becomes the source of truth. Put simply: 
1. The app developer doesn't manage to envisage the whole flattened DOM and all its interwoven dependencies between structure, style, behavior, and events *all at once*: the flattened DOM is simply too big and too complex to be the developers mental model of the app. Thus, the app developers takes on the perspective of the topmost lightDOM, and take the inner workings of each element (and their shadowDOM) for granted.
2. Often, web components are developed for use in many different web apps. Here, the web component cannot know all the lightDOM contexts (ie. use cases) the component and the shadowDOM will exist. Instead, he must assume that the outside DOM context will interact with his web component using a fixed, idealized API. Thus, for the web developer the perspective is the shadowDOM and an idealized lightDOM.

## How: does the shadowDOM work?

Web components encapsulate a DOM unit from the rest of the DOM context in which it is used. The DOM unit is the shadowDOM, and the context of use is the lightDOM.

The shadowDOM:
 * **isolates HTML, CSS, JS, and event flows**
 * in the shadowDOM from the lightDOM, and
 * in the lightDOM from the lightDOM.

However, if web components completely isolated the shadowDOM from the lightDOM, and vice versa, then they would not be able to interact. And would make them useless. Web components therefore also:
 * **connects HTML, CSS, JS, and event flows**
 * in the shadowDOM from the lightDOM, and
 * in the lightDOM from the lightDOM.

Web components *isolates* and *connects* DOM contexts from each other differently from domain to domain:

* For HTML, CSS, and Events, shadowDOMs: 
   1. **completely isolate** HTML elements, CSS rules, and event flow in different DOM contexts from each other, and then
   2. **connects a handful** of points of intersection between different DOM contexts.
   
   This makes the HTML, CSS, and event flow in different DOM contexts independent enough to be managed safely, while at the same time connected and dependent enough to be useful.

* In JS, shadowDOMs:
   1. runs as part of the same context, ie. **completely connects** JS code in the lightDOM and the shadowDOM contexts, and then
   2. **softly restricts (isolate)** the interaction between different DOM contexts in a couple of ways.
   
## Web component encapsulation 1: HTML

* HTML contexts are isolated, with two connections.

At the outset, HTML elements in different DOM contexts are completely isolated from each other. Each DOM context have their own `root`: the `document` (main DOM) or a `shadowRoot` (the `DocumentFragment` root for HTML elements inside a shadowDOM. Functions such as `querySelector(...)` only work within one DOM context, and `id` attributes are interpreted per context.

HTML elements in DOM contexts are then connected to each other in 2 ways:

1. **host-node-to-shadow-root**: every HTML element with a `shadowRoot` (ie. a shadowDOM with HTML elements) has a separate instance of this shadowDOM attached under the element in the lightDOM (called "host node"). 

   In JS, the "host-node-to-shadow-root" connection is a one-way relationship by default: the HTML elements of the lightDOM are considered accessible from the shadowDOM, but not vice versa. The host node of each DOM context is listed as the `.host` property in JS. However, due to the lack of hard restrictions in JS, the elements in the shadowDOM can be seen from the elements in the lightDOM, either by using browser supported methods such `.attachShadow({mode: "open"})` or by using techniques such as overriding the `HTMLElement.attachShadow` method or by fishing for callbacks overriding the properties such as `target` of `composed: true` events in capture phase listeners. More on this later.
  
2. **`<slot>`**. HTML elements in different DOM contexts can also be woven into each other using `<slot>` elements. `<slot>` elements enable developers in the lightDOM to transpose small clusters of HTML elements into the shadowDOM of another element. `<slot>` elements essentially merge two or more DOM contexts together in various ways. This will be discussed more in depth in the Slotted Events chapter.
 
## CSS encapsulation in web components

 * CSS contexts are isolated, with five connections.
 
At the outset, CSS stylesheets and rules apply only to HTML elements within a single DOM context, under a single document root. In principle, CSS do not "bleed" up or down between DOM contexts.

To enable styles to be coordinated across several DOM contexts, web components provide the following means of control across shadowDOM borders:

1. **Properties down**: CSS properties inherit from the host node to the shadowRoot node. This means that **all inheritable CSS properties**, including **CSS custom properties**, will trickle down from the above DOM context down into the lower DOM context.
2. **Rules down**: CSS Shadow Parts allows the developer of the upper lightDOM context to transpose CSS *rules* down into the lower shadowDOM context.
3. **Rules up**: `:host` query selector allows the lower shadowDOM context to add CSS rules up, but *only* to the **host node** in the upper DOM context.
4. **Rules up**: `::slotted()` selector allows the developer of a shadowDOM with a `<slot>` to apply CSS rules to the elements *directly* slotted into it. Using `::slotted()` the shadowDOM context can transpose CSS rules *up* to the **host node children** (the rules apply only to some of the direct children, not the descendants (but inheritable CSS properties set in these rules can of course inherit down to host node descendants)). So, while slotted elements are transposed *down* from the lightDOM into the shadowDOM, the `::slotted()` style *rules* are transposed *up* from the shadowDOM context to the lightDOM.
5. **Properties up**: Inheritable CSS properties on the `<slot>` element will inherit to the slotted elements. These inheritable CSS properties may not be assigned directly to the `<slot>` element in the shadowDOM context, but can indirectly be assigned to the `<slot>` element on any of its parent elements in the shadowDOM. This intermingling of CSS properties from `<slot>` elements should likely be considered a bug and avoided when possible.
 
The concept of slotting elements and style is super confusing and will not be described in full here. Buckle up in your office chair, drink a gallon of coffee, shut your nose with a clothes pin, slap yourself hard in the face, and google "SlotMatroschka". 

## JS encapsulation in web components

* JS contexts are *unified*, with a few soft restrictions.

Scripts and event listeners added to elements in the main DOM run from within the main DOM context. Event listeners added to elements in a shadowDOM or web component life-cycle callbacks such as `connectedCallback()` and `attributeChangedCallback()` run in the shadowDOM context. 

However, the JS context for all these functions are the same. As long as there is no `<iframe>` within the web app, all JS functions in all DOM contexts in the app has full access rights to each others objects, properties and functions. ShadowDOM and web components implement "zero security", no hard JS isolation.

This makes objects and properties in one DOM context are in principle fully accessible from another DOM context. 

### Convention: Host node only!

With this in mind, web components do advocate a convention (set of *softer* restrictions) that strongly encourages the isolation of functions, objects, and other code that run in different DOM contexts:

 * **Host node only!** The host node should be the sole point of interaction.

1. ShadowDOM functions (ie. functions called from within a shadowDOM context) should only read and alter the state of their host node; shadowDOM functions should *never read nor alter* the state of any lightDOM objects outside its host node.
2. LightDOM functions should only read and alter the state of the element objects in its DOM (ie. the host node of any of its element that contain a shadowDOM); lightDOM functions should *never read nor alter* the state of any objects inside the shadowDOM of one of its elements.

### `attachShadow({mode: "closed"})` and varying `event.target`

There are only a few hard JS boundaries enforced by shadowDOM. When a shadow root is created, the `.shadowRoot` reference on the host node is by default hidden from JS view on the host node. The idea is that element objects inside the web component should not be accessible to be read nor written to by lightDOM functions. As `composed: true` events can propagate in multiple DOM contexts, the `.target` and `.composedPath()` properties for event listeners in different DOM contexts are updated to comply to these boundaries.

This means that from within a shadowDOM, you can search, read, and write to all ancestor element objects in parent DOM contexts, all the way up to and including the main `document` and `window`. 

 
### `attachShadow({mode: "open"})` and varying `event.composedPath()`

However, there are a couple of ways this restriction can be bypassed:
1. by instantiating the shadowRoot using `attachShadow({mode: "open"})`, the host node gets a `.shadowRoot` property which opens access to the shadowDOM element objects. The `.composedPath()` method on event objects reflect this `open` status, although the `target` is updated as if the shadowDOM was `closed`.

2. As there is "zero" security, a lightDOM function can gain access into a closed web component using several different strategies:
   * Overriding the `HTMLElement.prototype.attachShadow`.
   * fish for inside shadowDOM scope callbacks using for example the `event.target` property on `composed: true` events.

### Shared DOM scope for shadowDOMs of the same type 
 
Web components are customary defined in their own `<script type="module">` or within self invoking function (SIFs, `(function(){/* semantically protected code here */})();`). Script modules and SIFs provide a semantical scope that cannot be accessed from outside, which essentially is shared only among the different DOM contexts for the custom element type. Although often useful, the semantic scope of the element definition is neither a protective boundary around any individual shadowDOM context (as it is shared among all the instances of that element type), nor does it provide any other new protective boundary that cannot be established for other objects and functions running anywhere in the app.

## Event encapsulation in web components

 * Events are isolated, with five?? connections.
 
Events are the fourth power in the browser, fully on par with HTML, CSS, and JS. Hence, web components and shadowDOM borders encapsulate event flow as it does style and structure. But. Event encapsulationg is rarely discussed. Let's remedy that!
 
At the outset, events are isolated to *one* DOM context. At the outset, events **propagate from the root document node to the `target` in a single DOM context**. Events are `composed: false` by default.

However, events are both a prime mechanism to connect different DOMs, and many events reflect state changes that are relevant for many DOM contexts. Here are the five ways events connect DOM contexts:

1. **Events up, attributes and properties down**. When the internal state of a web component (or an external state it observes) changes, the shadowDOM often needs to alert the lightDOM about this change. The *primary* means for shadowDOM functions to alert the lightDOM is to **dispatch an event on the host node**. The event propagating in the lightDOM is a message from the shadowDOM context.

   Note 1: a lightDOM function should never look inside a shadowDOM and dispatch an event on one of its nodes. Similarly, events rarely need to be dispatched within the DOM context of the function triggering it: a lightDOM function shouldn't dispatch an event in the lightDOM; a shadowDOM function shouldn't dispatch an event in the shadowDOM. The exception being universal event controllers such as FocusEventController that dispatch events within the same scope.
    
   But why? Put simply, events is a more cumbersome way to call a method. It is used when you don't know which functions should be called. Functions running in the lightDOM and shadowDOM respectively should know which elements are in their context (again the exception being generic event controllers). Calling methods on these objects should be the preferred means. If you need to dispatch an event on an element from a function inside the same DOM context as the element, you likely have a situation where you should split the DOM context into two (ie. make a new web component). There are some caveats here regarding slotted events, but we will return to that later.

   Note 2: When the state changes inside a shadowDOM context, there are alternative ways to alert the lightDOM context about the state change: a) setting an HTML attribute and b) setting an element property. HTML attributes should be used when the state change should be able to trigger style reactions and only in a few use cases needs to be observed (which then a more cumbersome `MutationObserver()` then can do). JS properties should be used if the app only needs to read the state proactively and the state change should not trigger CSS rules nor JS function in the lightDOM.  

2. **Default action**. The concept of control in the hierarchy of the DOM is "top dog rule". If two actions associated with two different elements in the DOM, then the control of the conflict resolution should lie with the topmost element/function.
  
   Default actions is "a task containing a delayed state change" that a lower DOM context can attach to an event that the web component itself, or an event controller function, then passes to the lightDOM. The lightDOM is then given the ability to *prevent* this state change by calling `preventDefault()` on the event, if a function in the upper lightDOM context sees that the inner state change clashes with one of its own state changes.
   
   The delayed state change can be many things:
   1. An *internal, shadowDOM* state change such as `beforeinput` or `keypress` harboring the action of changing the `value` content of an `<input type="text">` element.
   2. An *external, lightDOM* state change such as a `click` event that `target` a `<button type="submit">` carrying the action of triggering a `requestSubmit()` on a `<form>` element *in the lightDOM*.
   3. A *global, main DOM* state change such as a `click` event that `target` an `<a href>` element which will trigger the global state of navigating to a new web page.   
   
   This means that the event object is no longer pure text data. It can also hold a task: a function rooted in a DOM context. The default action task associated with an event can hold a task that is contextually associated with a shadowDOM, the current lightDOM, or the topmost main DOM.   
   
   By associating the reaction as a default action with an event, the event (via the `event.addDefaultAction(delayedStateChangeTask)` used in the shadowDOM and the `event.preventDefault()` used in the lightDOM) enable two different DOM contexts with limited insight into each other to collaborate: the shadowDOM subsumes its own reaction to the lightDOMs control. 
                       
3. **Bounce events**. Has anyone said that a function from a shadowDOM context can *only* dispatch an event to its immediate lightDOM? Can a function inside a shadowDOM dispatch more than one event recursively all the way to the `window`, ie. bounce an event from host node to host node up the propagation path? And can such a function choose to stop such recursive event chain halfway, at the host node of its own choosing?

   The short answer is yes. This is to *bounce* an event. And one example of native events that behave in a similar way is the focus events.
   
   The function that bounces a series of events different event objects. However, bounced events commonly have the same name and often share properties. For example, a default action from the event that has just finished propagating in the inner shadowDOM context is transferred to the event that will just begin propagating in the outer lightDOM context. In this way the bouncing function connects a set of DOM context in direct descent.
    
   Note: the method of bouncing events is a (superior) alternative to composed events:
   1. Currently, `composed: true/false` only enable developers to scope events propagation from either the `window` down (true) or the nearest shadowRoot down (false). Hence, the current set up of `composed: true` doesn't allow developers to scope their events as focus events are scoped. To emulate partially `composed: true` focus events, developers must bounce a series of `composed: false` events instead.    
   2. When events are bounced, each DOM context is given its own event object. This has three big benefits:
      1. Better security. If some function for some reason changed properties such as `target` on an element crossing into another DOM context, then that event would be compromised. 
      2. `stopPropagation()` cannot become neither a CaptureTorpedo nor a ShadowTorpedo. These two torpedoes are problems associated with `composed: false` events only (the SlottedTorpedo is still a problem, so is using a last event listener to run the defaultAction, but loosing 2 of 4 problems, is a big deal.
      3. No need to *mutate* the `.target` nor `composedPath()`
      4. The traditional eventPhases are back in normal order. ie no more `AT_TARGET` everywhere. 
   3. the capture phase event listener that is triggered *first* is the naive EarlyBird in the innermost scope. This means that all the complexity associated with ChainedEarlyBird pattern for `composed: true` events is lost. It also becomes possible for a group of CagedEarlyBirds to run sync events at the start of the trigger event, and not only at the end (although event controllers should execute their task at the end, and not at the beginning).   

4. **`composed: true`** events. Events notify different parts of the app about a state change. Often, these state changes are relevant for multiple DOM contexts and `target` element in multiple DOM contexts at the same time. For example, a user `click` on a `<h1>` element inside a shadowDOM of a `<web-comp>` element. The user action state change which the `click` event represents need to `target` *two* different elements in *two* different DOM contexts: first, the `click` `target` the `<h1>` element inside the shadowDOM context; second, the `click` `target` the `<web-comp>` element in the lightDOM context.

   To achieve such a duality of `target`s the browser dispatches a **composed** event (`composed: true`). Composed events are given a propagation path in the flattened DOM, a path that contains a list of nodes from several DOM contexts. Composed events propagate from the root of the topmost DOM context and down to the innermost `target` of the DOM context in which the event occurs. By propagating across a longer, flattened DOM path, the composed events connect several DOM contexts. In our above example, the flattened DOM, composed propagation path is something like `[h1, ..., shadowRoot, web-comp, ..., document, window]`.
   
   When listener functions for composed events are called in different DOM contexts, the `target` and `composedPath()` are consistently updated to reflect only the current DOM context: the `target` and scope of `composedPath()` is restricted to not look *down into* shadowDOM context from the lightDOM context (but not the other way round). This is both necessary to a) preserve the integrity of any `closed`-mode shadowRoot and b) highlight the relevant `target` node in the current DOM context. (Note: the same restrictions applied down towards the `target` is not done upwards toward the propagation root. This is not necessary as the reference from the shadowRoot to the host node is never restricted in the HTML scope, and because the root propagation node is rarely relevant for event listener functions.)

5. **Slotted events**. When an event `target` an element that is slotted, or a descendant of a slotted element, then the propagation path of the event includes the *lower* shadowDOM elements of the slotted element. So while events can be restricted to only propagate to elements within a single DOM scope when they bounce (ie. rendering the `composed: true` with all its event mutations and sharing objects between scopes unnecessary), slotted events must cross shadowDOM borders.
 
   Events that propagate over slotted events gets routed down and then up again, from a lightDOM and into a shadowDOM, and then back up from the shadowDOM and to the lightDOM. In a SlotMatroschka this occurs over several layers. Slotted events contain propagation nodes from multiple DOM contexts, where the event listeners on the higher lightDOM nodes do not have access to the nodes in the slotted shadowDOM context where that shadowRoot is in `closed` mode(!). Find that complex? You should. It is nasty. More about this in the chapter about slotted events.)







## todo WhatIs: DOM contexts?

With web components the DOM is broken into multiple DOM contexts which doesn't care about each other:

1. **main DOM context**. The main DOM is the topmost `document`: the "normal DOM" that web developer "usually" makes.

2. **shadowDOM contexts**. The shadowDOM is the inside of an HTML element: small pieces of HTML, JS, CSS, and events that describe the structure, style, behavior, and run-time evolution of an element. Yes, this means that the inside of HTML elements consists of yet other, smaller HTML elements mixed with some JS code, CSS style, and internal events. 


The technical term "shadow root" refers to the inner `DocumentFragment` of a web component or native element that house any inner HTML elements. The principal term "shadowDOM" commonly refers only to the shadow root. However, it is useful to extend the concept of shadowDOM to mean "inner structure, style, behavior, and/or event flow". This means that the shadowDOM also includes a) CSS style, b) JS properties, and c) event observering/dispatching functions attached to any host node by the element definition (directly or indirectly from the element's `constructor()`, `connectedCallback()`, or `attributeChangedCallback()`). As such, all native elements except the pure `HTMLElement` (ao. `<span>` and `<summary>`) have a shadowDOM, as do any custom element which not only reserve an HTML tag name.

## todo why shadowDOM 

Now, it is obvious that we want to hide away these itsy-bitsy pieces of inner HTML structure,  javascript, and CSS code in the shadowDOM of a native element. First, it would be impossibly complex if web developers had to work only with the low level `<span>` elements and lots of CSS and JS code. Second, we want to encapsulate in structure, layout, and functions of many different elements to prevent styles, functions and structures from mixing up. For example, it is good to not expose all the template, functions, and style of the control panel in a `<video>` element, as it would both swamp the code where the `<video>` element is used and potentially leak both in and out style and functionality. The whole point of web components and HTML elements is this: to hide generic stylistic, structural and functional details to prevent them from confusing the developer and get their references mixed up with the rest of the code where it is used. *The purpose of web components (and native elements) is to encapsulate HTML, CSS, and JS*.  


 
## References

 * 