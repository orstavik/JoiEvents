# Why: encapsulate events?

## Encapsulation 1: Outside the browser

A running web application is not built by a single developer. Never ever. There are lots of developers making the smartphone, desktop computer, OS, browser, network infrastructure, servers, databases, etc. etc. The running app is a gigantic collaborative effort. Spanning millions of developers, working all over the world, going back more than 50 years.

To ensure that all these pieces work together, there are some mayor gatekeepers that ensures everybody behaves appropriately towards each other. First and foremost, the browser. The browser gathers all the resources on the OS and the hardware, and present the web app developer with a single set of resources. Unfortunately, there are many browsers with some discrepancies between them, which causes cracks in the browser uniform. Another mayor gatekeeper is the HTTPS protocol for network communication. So, the vaaaast majority of developers that engange in a single web app are wrapped inside the browser, HTTPS protocol and similar resources.

## Encapsulation 2: inside the browser

A modern app can include thousands of (npm) packages with JS scripts, CSS styles, and HTML template. Each package is made by different individuals/organizations, and the developer put them together to make the app of his dreams (and/or nightmares).

When put together in an app, these packages can come into conflict with each other. If you include two packages that both define a style or a function with the same *name*, then they might call each other at the wrong time and *place* or style parts of the landscape wrongly. To avoid these conflicts in name *space*, the package developers first and foremost wrap their code into JS modules, sifs, objects and other units which create internal name spaces for their code and only expose some highly specific names externally. Styles are renowned for their inability to create namespaces, but developers of styles try to achieve the same using highly elaborate and frequently unique naming conventions for their packages.   

But. Space is not the only place for conflicts: packages can also conflict in time. Race conditions occur when one package alters a state that another package assumes is not altered. So, even though the developers can organize their functions and styles and data structures in nice, orderly name spaces, their state still comes into conflict with each other in unexpected ways run-time.

Thus, for different packages to work nicely together in the app, they also need to protect their own sequential state changes by **encapsulating them not only in space, but also in time**. And they need to do so in a way that enables different packages and thus different developers to **coordinate** and weave together their encapsulated timelines. Developers need to protect the integrety of their state changing flows by encapsulating them, and they need to coordinate their encapsulated flows to other packages' and developers' flows by connecting them. 

## Simple time encapsulation: functions

The main form of encapsulation in time is a function. When you call a function, you give that function the time to perform some state changes. The function can be on an object with its own dynamic state: a method. Or the function can be static: not associated with a state. The function can also have big side effects, ie. can call other functions which alters a state somewhere in the app. The function can pure, not alter any state at all outside of producing a new output.

JS functions used to be easy conceptually. Their timeline used to be encapsulated with hard, fixed borders. Once a function was called, it would retain the flow of control until it completed its task. A function was *one, atomic* time unit. A developer would call a function that another developer had made: the second developer would solve his/her task within the function, and the control of flow was passed back out to the first developer. A sync function.

Imagine the developers making the app as potato-spoon-relay at the market fair. The first developer is given the potato, he puts it on his spoon, and then he runs back and forth. He then gives the potato to his team mate the second developer of the package, who takes the potato and runs his lap. The second developer then hands the potato back to the first developer who then runs a second lap. There is only *one* potato (flow of control), and by invoking and returning output from a function the developers can give each other the flow of control.

JS functions are now much more complex conceptually. Async functions enable the developer to   

We want to **encapsulate internal events**. Web components (and native elements) can have lots of events flying around inside their shadowDOM that are internal details, that has nothing to do with the elements outside. It can be just as important to hide and shield internal events as it is to hide and shield internal style and functionality. Some events therefore needs to be contained inside the shadowDOM context, while other events should be able to fly between shadowDOMs. We do not want the inner event sequences of an element to bleed out from an element (and we don't want irrelevant outer event sequences  to bleed into an element's insides neither). *The purpose of web components (and native elements) is to encapsulate HTML, CSS, JS, **and events***.  
 
## In this chapter:

1. WhatIs: `composed` events? 
1. BounceEvent: a pattern for making `composed: false` "bounce up" and propagate in the above lightDOM when necessary. 
2. Problem: Why should the `submit` event be `composed: true`?
3. Problem: Why should `beforeinput` and `input` events be `composed: false`?
4. Problem: Why do focus events sometimes behave as though they are `composed: false`, when they are always `composed: true`? Are focus events in reality automatically bounced by the browser?
5. Problem: Why should `composed: false` events *not* propagate down into "lower shadowDOMs"? Should nodes in the propagation path that do not have the same document root as the `target` be removed from the propagation path of `composed: false` events?

    
## References

 * 