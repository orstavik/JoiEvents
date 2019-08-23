# Pattern: DomRootState

2. "Deep state" is state data that is hidden and/or inaccessible to other parts of the app. The inner variables in the EventSequence SIF are deep state. The `long-press` EventSequence hides both a) its current state (inactive/active/end) and b) the relevant data from its previous state (the timestamp and potentially x/y-position of the mouse).

   Again, it might seem problematic for a simple `long-press` EventSequence to use deep state. But, to add deep state to an app is conceptually and architecturally problematic: when you add deep state data, you cannot imagine another component ever needing to know about that data. but then, suddenly, a new use-case emerges and you need to access that data anyway. Now, having first pushed this state data deep into somewhere, you can't get it out, and so you instead retrieve it again. And presto! You have created a redundancy that is inefficient and very likely to later cause you headaches.
   
   And, this is exactly the story with deep state in EventSequences. At first, I thought it was ok. And I built my composed events with it. But then I realized I needed to make visual and other feedback for the same events. And then I realized I needed to access the state data from the events from HTML and CSS. And then I (yet again) realized how bad deep state is and why one should try to avoid it.
   
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
