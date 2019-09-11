# Pattern: DomRootState

## How to open up?



The question becomes: if we need to *read* and *use* the state information from an EventSequence from both JS and CSS, then where should we put it?

The short answer is:
 * on the root element on the main document as
 * attributes and
 * custom CSS properties.
 
However, such a short answer is so obviously no trustworthy, it needs a more thorough explanation.

### Why should the state of an EventSequence be read from CSS?

The use-case of "reading state from an EventSequence directly from CSS" is quite complex. In fact, I have devoted an entire chapter on the subject. The short answer is that to give the user audio, visual, and vibration feedback require three steps:
1. constructing a view model,
2. decorating the view model, and
3. assigning the view model to a branch in the DOM in a certain context.

Constructing 
 
/declaring particularly visual feedback, but also audio and vibration feedback, from an EventSequence can benefit greatly from the declarative structure of HTML and CSS. Web developers know HTML and CSS best when it comes to making views, and so to use HTML and CSS directly to produce views driven by an EventSequence is both efficient, ergonomic and its complexity scales.
In the later chapter on feedback, it will become clear why, when, how, and where feedback from EventSequences and composed events needs to happen. These feedback use-cases and patterns illustrate the benefits of preserving the state data from EventSequences as HTML attributes and CSS custom properties on the root element (`<HTML>`) in the DOM.


To make data available from both various JS contexts, HTML, and CSS the data needs to be preserved in the DOM (and to a certain degree in CSSOM, since `attr()` in CSS is not well supported). 

 
in the state data needs to be presented EventSequences needs to be accessed from HTML, CSS, and JS. In this chapter, we will pre-summarize this situation and simply give some guidelines as to what goes where.
   

, neither from HTML, CSS, nor JS. 

This means that there is no way for the a developer who includes a `long-press` EventSequence from the previous chapters to read its state. There is no way to neither from HTML, CSS, nor JS to directly assess if for example:
* if the `long-press` event is active or inactive, and if active, 
* when and where on screen or in the DOM the press is occuring. 


   Again, 
   The ListenUp should not alter which event listeners are active without altering the state information in the DOM root node. 
   

1. **internal JS variables** stored inside the composed event function. This topic we will discuss in this chapter.

3. **Pattern: DomRootState**. Store information about the state in the DOM, on the root element.

The simplest way to do this is to store data about an event sequence as **internal JS variables** in the event sequence self-contained function. For example, a `long-press` event can store the time when the `mousedown` was made as a number inside itself. Below is a demo


What info needs to be shown?

1. The name and state of the event gesture. That would mean `long-press`, the starting time the long-press was made, and that the long press is in the `waiting` phase. 

2. We need to show the target of the event, as tag#id.class. Here it is critical that the id is actually unique when selected, but this we must assume is true if we use use it.

Instead of storing the state inside the composed event SIF, which would make that state deep and inaccessible, store it in the DOM. On the root element

One need to add an attribute for the state name. One need to add an attribute for the state step. Every data-point such as when a long-press starts must be added via an attribute. The reason for this is that the subsequent steps in the gesture will need to find this value, and if that data is only accessible via the CSSOM, then that will be slow.

The target should be listed as ="tag-name#id.class.list.names". This will make it possible to use it to create custom visual points.

Some data about the event should be stored as CSS variables, such as the x and y position of the event. These attributes can then be used directly in CSS to adjust visualizations.

## visualization

There are two alternatives for controlling the default visualization.

1. is to add a CSS prop that says that there should be no visualization. That is good because it would go together with other event settings such as --long-press-duration and therefore "cost nothing more". The problem is that this can be a bit difficult to write in css? No, i think it will be ok.

2. add a method on the start-event `.preventDefaultVisualization()`. That is nice and simple.

3. On the custom visualisations, add a css class `.long-press-visualisation`. The composed event SIF could then a) `document.querySelectorAll(".long-press-visualisation")`, 2) then check to see if any of these element where not `display: none`, and 3) if there is an element that is shown, then it wont run the default visualization, and if there is not, it will run the default visualization. This method is very intricate and convoluted and require lots of implicit knowing. 

## References

 * [MDN: CSS `attr()`](https://developer.mozilla.org/en-US/docs/Web/CSS/attr)