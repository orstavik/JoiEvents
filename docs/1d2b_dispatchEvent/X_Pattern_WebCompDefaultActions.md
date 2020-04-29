describe how we should set up default actions for a web component.

There are several issues here that needs attention. For example, which window or shadowRoot that needs the event listener. composed events need to be listened for as defaultActions mainly. non-composed events inside the shadowDoM can be listened for normally.

how to avoid adding the default action listener many times, and not just once. :
1. composed: false: shadowRoot, add when connected 
2. composed: true: add outside the element as an EarlyBird  

we can add a default action from an element that dispatches it. then we add the default action before the event begins event propagation. Here, we assume that the event's future target will be the events preventable: element.

we can also add a default action from an EarlyBird event controller. This will be while the event has begun event propagation. we then might wish to check for native competition. 