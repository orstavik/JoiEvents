# Problem: NestedDefaultActions

Some HTML elements react to certain events: if you `click` on an `<a href>`, then that can  trigger the browser to navigate to a new page; if you `click` on an `<input type="checkbox">`, then that checkbox will flip value. These native reactions when a certain event hits a certain type of `HTMLElement` are DefaultActions. 

In HTML we can also nest elements. But, what happens if we nest *two or more* elements that all should react to the same event? What happens if we *nest DefaultActions*?:

## Demo: NestedDefaultActions
```html 
<details>
  <summary>
    Open summary <a href="#link">Link inside summary <input type="checkbox"> </a>
  </summary>
  Hello Sunshine!!
</details>

<script>
  const details = document.querySelector("details");
  const summary = document.querySelector("summary");
  const link = document.querySelector("a");
  const input = document.querySelector("input");

  function log(e) {
    console.log(e.type, e.currentTarget.nodeName, e.eventPhase);
  }

  function preventD(e) {
    console.log("calling: " + e.type + ".preventDefault()");
    e.preventDefault();
  }

  // window.addEventListener("click", preventD, true);

  details.addEventListener("click", log, true);
  summary.addEventListener("click", log, true);
  link.addEventListener("click", log, true);
  input.addEventListener("click", log);
  link.addEventListener("click", log);
  summary.addEventListener("click", log);
  details.addEventListener("click", log);
</script>
```

This demo illustrates how the browser handles this conflict. When more than one interactive element appear at the same time in a `click` event's target chain, then the browser:
1. only performs *one defaultAction per one event* and 
2. chooses the *defaultAction of lowest element in the event's target chain*.

## Pattern: OverwriteDefaultAction

To implement this behavior in web components and their custom DefaultActions, use the following pattern:

1. Custom elements and web components that should react to a certain event should listen for the event in the capture phase. This has the following benefits:
   1. All events propagate in the capture phase, including events that do not bubble. This means that the custom element/web component do not need to worry about the distinctions between event that hit itself and events that hit one of its children.

2. If the custom element/web component should react to a certain event, then it can simply replace the defaultAction of the current event. If more than one custom element/web component intend to trigger a defaultAction on the same event, then the highest web component will first overwrite the native defaultAction, but then the lower web component will overwrite the higher web component's defaultAction again, which will end up making the lower component's defaultAction win.

 *  There is *one* caveat though. If a native element were to react to a particular event, then the native element's DefaultAction would have already been added to the event loop. This means that the custom element must screen the event's target chain for native elements inside it whose DefaultAction should win.
 
 * This setup can also be torpedoed by calling .stopPropagation() earlier in the inner event propagation loop.
 
//The OverwriteDefaultAction that screens for lower, interactive children in the composedPath of the trigger event is afaik the only way to consistently implement the same behavior as native defaultActions. For non-bubbling events, there might very well be instances were you would only desire to listen for events on the  The problem of screening for native elements below in the target chain is not affected by the event capture phase. If custom elements where to listen for events in the bubble or target phase, an even bigger problem of screening problem would arise. 

## References:

 * 