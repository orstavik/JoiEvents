# Pattern: EventRoadMap

An event cascade is a series of events and actions that trigger each other with a domino-effect. When one event occurs another might or must follow.
 
In this chapter we make a JS map of these events with the key being the trigger event. We need two different maps:
1. `EventRoadMap.ALL`: all the different possible events that an event might trigger,
2. `EventRoadMap.UNPREVENTABLES`: all the different possible events that an event might trigger that CANNOT be stopped using `.preventDefault()`.    
3. `EventRoadMap.PREVENTABLES`: all the different possible events that an event might trigger that CAN be stopped using `.preventDefault()`.    

In later chapters we will dive deeper into event cascades.  

## Different roadmaps for different purposes

```javascript
const EventRoadMap = {
  PREVENTABLES: {
    click: ["reset"],
    wheel: ["scroll"],
    keypress: ["beforeinput"]
  },
  UNPREVENTABLES: { 
    mousedown: ["contextmenu", "focusin", "focus", "focusout", "blur"],
    mouseup: ["click", "auxclick", "dblclick"],
    click: ["dblclick"],
    keydown: ["keypress"]
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
