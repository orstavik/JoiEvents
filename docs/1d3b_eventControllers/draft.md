## Principal solution to conflicting default actions
  
When two or more default actions are added to the same trigger event, then the solution is the following model:

1. **Non-conflicting, non-preventable default actions**. Some default actions should be considered independent. These default actions can run in parallel with other default actions, either consistently before or consistently after them, without causing any problems. These default actions are often non-preventable, ie. they cannot be cancelled by calling `.preventDefault()` on their triggering event. An example of such a default action is the task that creates and dispatches `dblclick` events when two `click` events occur at the same time on an element.

2. **Conflicting, preventable default actions**  Other default actions should be considered conflicting with each other. These default actions should not run as a response to the same trigger event, but instead exclude each other. 
   * **conflict resolution algorithm for default actions**: Any default action must be associated with both a) the trigger event and b) an element in the propagation path. Some default actions are associated with the generic `HTMLElement` type, some with a particular element type such as `HTMLAnchorElement`. If two or more conflicting actions are:
       1. associated with the same trigger event but different elements in the propagation path, then the default action of the event should be the action associated with the lowest most element, ie. the element *nearest* the `target` of the trigger event.
       2. associated with the same trigger event and the same element in the propagation path, then the default action of the event should be the action whose controlling function was last registered by the browser. A hypothetical example of such a conflict occuring would be `<div draggable="true" long-pressable="true">`.

Non-conflicting default actions are usually non-preventable, and vice versa.
       
To create conflicting, but non-preventable default actions is bad practice. The conflicting aspect of the elements behavior would likely encounter situations were the developer would like to be able to prevent them, and therefore they should be set up as preventable too.        

To create non-conflicting, but preventable default actions is less problematic. But, it is mostly unnecessary. If you need to make non-conflicting default actions preventable, you should instead dispatch an event first *before* executing any DOM mutations or other functions *and* use the `preventDefault()` in this precursor event to block the DOM mutation or other function. This pattern follows the pattern of both `mousedown` => `contextmenu` => "show context menu" event cascade and the `click` => `reset` => "reset HTML form data".         

