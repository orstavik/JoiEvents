# WhatIs: `target`?

The `target` of an event is the node in the DOM that best represent the past or future origin of the state change.

## From where are events dispatched

To understand the 

Web components functions dispatch events. They always target the host node. And they most often are composed :false.
Event controllers dispatch events. They target an element in the path of the trigger event. Or the window. Or a special element such as activeElement.


For future-tense events `target` is a suitable name. The state change *will occur* at that element next, and so the event that heralds that state change should `target` that element.

For past-tense events `target` can be a bit confusing. The state change has already occurred at that element, and so conceptually the event "originates" or "spring out of" that element. However, the system that manages both past-and future-tense events is the same, and so the property name `target` remains the same for both.

## `target` rules of thumb

1. When `target`ing an element in the DOM, a universal rule should be applied. The same type of state change should always `target` their event at the same type of DOM node.  

1. If a state change is external (ie. there is no node in the system that represent it), it is `target` at the default, root node (ie. `window` in the browser).   
  
  External events announce a change of a state that is not represented by any DOM node. This means that there is no DOM node in the DOM that represent the state changing. For external events, the `target` is simply the `window`.

2. If the state change occurs on a group of nodes, the `target` should be the closest, universally known container element of the elements whose state have changed. For example, when a set of input elements have their values reset, then the `<form>` container element for these input elements should be the `target` of the past-tense `reset` event. This applies even when only one `<input>` element is changed.

3. When re-target to host node when going past 

## Events are only dispatched from two locations

Todo. Add events up, attr+prop down in the start chapter.


1. from functions in web components when the state of the web component changes and the web component needs to alert the upper lightDOM context surrounding the host node.

2. from event controller functions.

3.   

## References

 * 