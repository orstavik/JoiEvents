# Pattern: EventRoadMap

An event cascade is a series of events and actions that trigger each other with a domino-effect. When one event occurs another might or must follow.
 
In this chapter we make a JS map of these events with the key being the trigger event. We need three different maps:
1. `EventRoadMap.UNPREVENTABLES`: all the different possible events that an event might trigger that CANNOT be stopped using `.preventDefault()`.    
2. `EventRoadMap.PREVENTABLES`: all the different possible events that an event might trigger that CAN be stopped using `.preventDefault()`.    
3. `EventRoadMap.ALL`: all the different possible events that an event might trigger.

In later chapters we will dive deeper into event cascades.  

## Different roadmaps for different purposes

The roadmap dscribes events that *in some contexts* are triggered by the trigger event. `dblclick` for example is not always triggered by `click`; `beforeinput` is only triggered by `keypress` or `keydown` when the `focus` is on an form input element. 

```javascript
const EventRoadMap = {
  PREVENTABLES: {
    click: ["reset", "submit"],
    wheel: ["scroll"],
    keypress: ["beforeinput"],
    beforeinput: ["input"],
    focusout: ["change"],
  },
  UNPREVENTABLES: { 
    mousedown: ["contextmenu", "focusin", "focus", "focusout", "blur"],
    mouseup: ["click", "auxclick", "dblclick"],
    click: ["dblclick"],
    keydown: ["keypress", "beforeinput"]
  }
};
EventRoadMap.ALL = {};
for (let [name, list] of Object.entries(EventRoadMap.PREVENTABLES))
  EventRoadMap.ALL[name] = list.slice();
for (let [name, list] of Object.entries(EventRoadMap.UNPREVENTABLES))
  (EventRoadMap.ALL[name] || (EventRoadMap.ALL[name] = [])).concat(list);
```
 
## References

 * dunno
