# Web components' ten commandments

A web component detects a state change in its shadowDOM. This can occur from a function associated with the web component that observes an external state, or from a function that observes an internal state change, such as a JS property being changed or an HTML attribute being changed or a new element being slotted into it or a style changing. 

1. If the shadowDOM needs to react to an event with a state change in its lightDOM (such as finding and calling a method on another lightDOM element such as the reaction of a `click` event on a `submit` button will), the web component should delay this state change in a task that is added as the default action of the `composed` event currently propagating, or the events that bounce.

1. If the shadowDOM *expect* that the lightDOM will need to react with a JS function to the state change the web component observes, it should dispatch an event on the host hode. This event should be `composed: false`. If the event has an associated default action that will change the global scope (the top, main `document` DOM context state), then it should **bounce**. Events should:
   1. be dispatched for important state changes 
   1. **up DOM contexts**, 
   2. be `composed: false`,
   3. bounce if it has an associated default action that alter a property/call a method on the main `document`/`window` DOM context.

2. If the shadowDOM *expect* that the lightDOM will react to the state change the web component observes 
b. If the shadowDOM want to enable the lightDOM to react to a state change in some rare, but not extremely rare cases, you will update an HTML attribute on the host node. This attribute can be observed using a `MutationObserver()`. If there is too much data of the state, you would use an HTML attribute in combination with a JS property.

c. If the shadowDOM do not expect that the lightDOM needs to react to your state change, only read it when it needs it according to its own flow, you add the state as a JS property on the host node. This is easily accessible from the lightDOM, but changes to it must be polled if the lightDOM needs to react to it.

d. If the shadowDOM do not want the lightDOM to read the state property, for example if the state property is only one part of a combined state property accessible from the host node used for internal computation, then you want to store it on an element inside the shadowDOM scope and not on the host node.

e. From the lightDOM, if you wish to trigger a native reaction inside the shadowDOM for both CSS and JS, you should set an HTML attribute. Both CSS selectors and `attributeChangedCallback()` can automatically register HTML attribute changes.
 
f. From the lightDOM, if you only wish to have a CSS reaction, you could use either a CSS custom property, CSS shadowDOM parts  Attributes you should either use an attribute you most likely only wish to call methods or set properties 

When the internal state of a web component (or an external state it observes) changes, and the web component needs to inform its outer lightDOM context about this state change, it should *not(!)* do so via call methods, update properties or move around DOM nodes in its lightDOM. Instead, the function running in the shadowDOM context should dispatch an event on the host node (or alternatively just a) update a property, b) update an attribute, or c) add/remove a CSS (pseudo-)class on the host node.

 
## References

 * 