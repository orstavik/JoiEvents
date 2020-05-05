antipattern 1 SYNC change state in the shadowDOM of a web component before the lightDOM has had a chance to prevent it.

Are there any events that trigger default action that cannot be prevented? the touch scroll? But are there any other? are there any unpreventable default actions? This is such an antipattern that there are no native examples of.

Demo:
1. a checkbox that the user cannot control from the lightDOM.
2. an ahref that the user cannot stop from navigating. 


antipattern 2 partial SYNC state change in a shadowDOM before the default action and the second half after the default action. 

Demo: this is the a href that changes :visited before the default action, which is then preventDefault()ed which makes the whole thing meaningless


antipattern 3 highest target wins (1): the shadowDOM action nearest the target is overridden by a higher component, universally. As this happens in the DOM scope of the outer element, this is not that problematic. But this effect can better be controlled by  calling preventDefault() first, and then either discard the inner default action or wrap it. This makes the use of the inner defaultActions pointless. We could exemplify this using the pointlessness of having an ahref and a h1 inside a web comp, and then having the 

Demo: Here, it would be the checkbox inside the ahref/summary and how that would be a problem.



antipattern 4: highest target wins (2): slotted default action override shadow default action.

Demo:  there is the confusion with link text inside <span and not, and how it triggers the details.


todo: write up the article about slotted events.  