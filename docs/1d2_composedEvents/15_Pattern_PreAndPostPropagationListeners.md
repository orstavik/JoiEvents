# When: is PrePropagationCallback PostPropagationCallback

A postPropagation callback for composed: true events would require a twostep event listener:
 1. first an unstoppable event listener would be called upon inside the shadowDOM. This event listener would then add another event listener on the window bubble phase that would also be unstoppable. The added event listener should have a lexical scope to read the properties from the closed shadowDOM. 


If this is universally available, this solves the problem of This has the benefit of being able to implement a last option for defaultAction. Instead of using EarlyBird, we implement a PostPropagationCallback..

No, i should call them prePropagation
postPropagation
prePrePropagation
And do so in the next chapter.

This means that we can implement the addEventListener options as defaultAction and EventController.. This simplifies the interface a lot.. Then you just add defaultActions and EventControllers as regular event listeners anywhere, except that they are marked with "eventcontroller: true" or "defaultaction: true"..

slight reduction in StopPropagation speed vs. increased speed of the defaultAction task. Using event listeners is much less heavy than using toggleTick. And... how speed sensitive is addEventListener and stopPropagation() really??

## References

 * (discussion about closed shadowDOM intention)[https://github.com/w3c/webcomponents/issues/378#issuecomment-179596975]