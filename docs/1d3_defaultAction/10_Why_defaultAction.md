## Why default actions? 

## DOM generic and reusable

All default actions are generic. They may gather and react to contextual information, but they always react in the same way to the same DOM context. They are intended to be reusable.

And this is the purpose of having default actions *in addition to* common event listeners: if an element should behave in the same way to an event in all DOMs, then this should be modelled as a default action, not a regular event listener. Furthermore, the default actions are queued in the uppermost event loop. This loop is used when tasks are queued across element and shadowDom borders.

When you are assuming that other reusable web components also react to an event, you need to ensure that this interaction is coordinated. The vehicle for this coordination is the default action. Makers of reusable web components can ensure that their elements reactions are coordinated with the reactions of other web components through the use of a singular, preventable default action, or a multitude of non-preventable default actions. To ensure that the timing of these reactions are not interwoven, all such reactions are queued in one place, the event loop.

- nested event propagation, creates interwoven flow of events, that differ in multiple ways in complex doms. bad 
+ new events always queued in the event loop, creates singular event flow that differ much less in different complex DOMs. good  

- element reactions occurring during propagation targeted at other elements. this creates a dom context that can automatically, and without clear notice change during event propagation. this creates essentially a fluid dom during event propagation. bad.
+ element reactions being queued in the event loop. the dom never changing automatically during event propagation. ***ONLY*** the developer of the lightDOM DO mutations of the DOM during event propagation. good. 

- we have no coordination among default actions. We have all the probles of conflicting actions. We can have situations were default actions of elements high up in the propagation path run alongside actions of elements nearer the target, and we can have two mutually exclusive actions run together at the same time. super confusing both for user and developer. bad.
+  Only one preventable, conflicting reactions/cascade event run for each trigger event. Singular output of conflict. reactions that can run in parallel with other reactions do so. no conflicts between default actions, not only in the same level of the DOM (inside the same document), but for the entire composed propagation path. good.  

## References