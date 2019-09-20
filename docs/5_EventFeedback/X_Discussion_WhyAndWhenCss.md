# Discussion: Why and when CSS?

Styling visual feedback is a bigger task

  * *When* and *where* in an app should give *what* visual feedback? 

## When and where?

CSS 

CSS is used to delegate 


In one end of the spectrum we could make *one* alteration *always* and *anywhere*. 
Most simply, an app sets a new visual feedback for an event type. For example, when the mouse is being dragged (`mousemove` while the primary mouse button is pressed), the browser should show the cursor moving as a small airplane.
* More advanced, an app should set a new visual feedback for an event type when it interacts with a select group of elements. For example, when the mouse button hovers over `input[type="checkbox"].active` elements, it should show a `crosshair` symbol.



   
## Strategy 1: CSS

If the developer reflect the application state in the DOM via attributes or classes on relevant elements, CSS rules could be selected depending on app state. 

But, there are two counter arguments against using CSS to set visual feedback:

1. CSS mainly support choosing between pre-existing template: the `cursor` property only let the developer choose one of a set of pre-existing icons. CSS doesn't support declaring additional HTML template: the only(?) CSS property that enable developers to add content to the DOM from CSS, ie. `content: "some text"`, is both very limited (it only allows text content) and messy (conceptually, CSS comes *after* HTML template, and thus should not itself *add* HTML template to the DOM). This makes CSS a bad choice if the developer wishes to add complex custom visual feedback, which it definitively will be.

2. Most developers think about events with their JS thinking-hat on. They "process" events with event listeners, and then in the JS code inside the event listener a) check to see if the app/DOM is in a certain state, and if so b) add some bells and whistles. Although similar objectives can be accomplished declaratively in the reverse order, by first reflecting the app state in the DOM as classes and attributes, and then declaratively turn on/off bells and whistles in CSS based on those attributes/classes, event processing most often require a) manipulation of application state (which needs JS 95% of the time) and b) heavier DOM manipulation, which might not easily lend itself to declarative programming.