# Pattern: AsyncPastTenseEvent

this event occurs after a state change. it has no default action. simpler
3. the choice of dispatching this event sync or async (in a toggleTick). If the event is only reacting to a method that are triggered intentionally, AND the event is `composed: false` you *might* get away with dispatching it sync. But, if the event is dispatched as an attribute change (cf. `toggle`), then the preferred solution would be async as it would be microtask async in the first place, and that would confuse even more (ie. it would run after the first microtasks queued, but after nested microtasks). Again, the preferred and default solution is always to dispatch it async. Past-tense events should run async.

```javascript
function doStateChange(el, value){
  el.prop = value;
  const pastTenseEvent = new CustomEvent("state-change", {composed:trueOrFalse, bubbles: trueOrFalse});
  toggleTick(()=> el.dispatchEvent(pastTenseEvent)); //or setTimeout()
}
```
## past-tense events from a web components 

This is where the pattern really shines, this is its preferred use-case.

The method is simply added as a method on the web component, and then the web component changes its state and then dispatches the event.

## past-tense events from an observer in a web component  

todo test if the open attribute change in the toggle will open the details element on screen after the first prt, or if it remains closed after 2-5 prt, and if that  

 