# Pattern: LocalizeListeners

To speed up global event listeners we localize them. To do so, we need a `localize()` function that:

1. finds all the possible target elements,
2. adds the initial event trigger listener to them, and
3. removes the initial event trigger listener from the `window`.

Once the event listeners are localized, the composed event is no longer dynamic: if you add another element to the DOM and want the event listener attached to it, you must be able to `registerElement(newElement)`. And finally, you might need a function that enable you to switch back and `globalize()` your composed event again.

## Example: `localizable-mouseover-echo`

```javascript
(function(){
  
  function onMouseover(e){
    e.target.dispatchEvent(new CustomEvent("mouseover-echo", {bubbles: true, composed: true}, e));
  }

  function querySelectorAllDeep(query, doc, res){
    res = res.concat(doc.querySelectorAll(query));
    var all = doc.querySelectorAll(query);
    for (var i = 0; i < all.length; i++)
      all[i].shadowRoot && querySelectorAllDeep(query, all[i].shadowRoot, res);
    return res;
  }

  var locations;  //when undefined, the composed event is in localized state
  class MouseoverEchoEvent extends Event {
    
    constructor(type, options = {bubbles: true, composed: true}, trigger){
      super(type, options);
      this.trigger = trigger;
    }
    
    preventDefault(){
      this.trigger.preventDefault();
      this.trigger.stopImmediatePropagation ? 
        this.trigger.stopImmediatePropagation() : 
        this.trigger.stopPropagation();
    }

    static localize(query){
      if (locations) {
        var allLocations = querySelectorAllDeep(query, document, []);
        for (var i = 0; i < allLocations.length; i++) {
          var potentiallyNewLocation = allLocations[i];
          if (locations.indexOf(potentiallyNewLocation) < 0)
            potentiallyNewLocation.addEventListener("mouseover", onMouseover, true);
        }
        locations = locations ? locations.concat(allLocations) : locations;
      } else {            //first time
        locations = querySelectorAllDeep(query, document, []);
        for (var i = 0; i < locations.length; i++)
          locations[i].addEventListener("mouseover", onMouseover, true);
        window.removeEventListener("mouseover", onMouseover, true);
      }
    }
    
    static globalize(){
      if (!locations)   //already global
        return;
      for (var i = 0; i < locations.length; i++)
        locations[i].removeEventListener("mouseover", onMouseover, true);
      locations = undefined;
      window.addEventListener("mouseover", onMouseover, true);
    }
    
    /**
    * if the composed event is localized, adds an event listener to the localized version and returns true;
    * if the composed event is not localized, does nothing and returns false;
    */
    static register(el) {
      if (!locations)
        return false;
      el.addEventListener("mouseover", onMouseover, true);
      locations.push(el);
      return true;
    }

  }

  window.addEventListener("mouseover", onMouseover, true);
})();
```

<pretty-printer href="demo/mouseover-echo-localizable.js"></pretty-printer>

## Demo: `mouseover-echo` on fire

<code-demo src="demo/MouseoverOnFireLocalizable.html"></code-demo>

## TypeSpecificEvent and AttributeSpecificEvent

Often, LocalizeListeners is combined with the TypeSpecificEvent and AttributeSpecificEvent patterns. In such instances, the `localize()` function likely will not need a query selector, as this is implicitly provided by the other patterns. 

> Tips: If you need the LocalizeListeners pattern, you likely need/will benefit from TypeSpecificEvent and AttributeSpecificEvent, and vice versa.

## todo

enable localize on children, descendants

if the touch-hover attribute has the value `"children"`, then the localize function will add it on all the children.
else
if the touch-hover attribute has another value `"query[whatever]"`, then localize function will select those children. The problem here is the target selection. How can we make that work together?

## References

 * 