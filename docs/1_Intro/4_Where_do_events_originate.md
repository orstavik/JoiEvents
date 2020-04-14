# Where: do events come from?

Events are sent *when* some state property changes *somewhere*. So, where are these state properties located? What areas of state do we care about? From where do events originate?

The state properties behind events can reside almost anywhere. They reside both inside the app/DOM itself (internal events) and outside it (external events).

## External events

*External* events represent a state change of data *outside* of the DOM. For example, a `keydown` event represents a state change of the user's finger, a change of the mouse buttons position, a primitive UI event in the OS; the `offline` event represents a state change in a cut network cable, a router loosing power, the OS loosing wifi connection. The event is a "sign of a state change", and external events represents state changes external to the DOM. 

External events can be relevant for any element anywhere in the DOM. And therefore, they should be accessible to all DOM layers. For example, a `click` is an external event that can be directed at elements in both the main *and* shadowDOM contexts. In an app, a `click` can `target` both a play button in the shadowDOM of a `<video>` element or a regular button in the main DOM. Another example is the `resize` event. When the `window` `resize`s, a reaction might be triggered that both control the layout of the control panel inside a `<video>` element or the content of the footer at the bottom of the main document. Therefore, the external `click` event needs to be accessible in all DOM contexts.

## Internal events

*Internal* events represent a state change of data *inside* the DOM itself. The state can be stored as either DOM nodes, element attributes, or element properties. The DOM consists of a series of elements and nodes, and many events are dispatched that alert of a change of a state of one such element and/or one of its properties. Examples of internal events are:

1. `change`: the value of an input element *has been* changed. The `change` event are sometimes dispatched only when the input element looses focus. The `change` event represent a state change of an input element.

2. `reset`: the `value` property (or equivalent) of potentially several input elements in a `<form>` *will be* changed. The `reset` event represent a state change internal to a group of elements clustered under a single `<form>` element *all within the same DOM context*.

3. `toggle`: the `open` property of a `<details>` element *has been* changed. 

## internal vs. external

 * Internal events are represented by an element in the DOM. The DOM is mainly used to represent visual, virtual entities on the screen. The DOM is also used to represent sound, such as `<audio>`. And finally, the DOM also contain `<script>` and `<base>`, purely system concepts.   
 * External events announce changes in states that are *not* represented in the DOM. These states can be represented in other domains of the web app, ie. as JS functions and properties associated with the `window` or similar global structures. External events may also announce changes in states that otherwise are not accessible in the browser such mouse position.
  
There is no principal reason why there could not be a DOM element for all the other elements. In fact, there are many fun ways to envisage such DOM constructs:
1. `<script type="module">` could be nested inside each other so to facilitate a better understanding for developers (as far as a non-cyclical graph could visualize a cyclical structure.
2. audio and sound is well suited for graph structures, as music note sheets illustrate.
3. sensor api could very well have their own DOM node representation in the `<head>`.
4. a DOM node representation of the external environment could perhaps better illustrate the scope of the browsers knowledge of its users.
4. a DOM node representation of the UI could perhaps better illustrate the scope of the browsers knowledge of users input devices. More than pointer device could be active at the same time, and having elements represent their states would make it simpler to for example avoid overlapping touch events. 

Perhaps, to facilitate the evolution of the web platform, more of the web should be depicted declaratively in the DOM, and not just imperically as JS properties.

## Discussion

The web is limitless. It is ubiquitous. And it keeps growing. More people use the web every day. people use the web for more and more purposes. More web pages and apps are added and grow, both in scope, content and use. But. The technology itself is also growing. The browser as a sentient beast is evolving. 

In its infancy, the web pages could hardly move nor sense. The `<a href>` was there to be `click`ed, enabling the webs most potent power: social networking. The `<input>` element with the `keypress` was also there: enabling interaction and content creation.

But, as the browser evolved, it gained JS and a couple of global event handlers. The browser learned gradually to sense itself, its own body: what `setTimeout` it is, how its elements could `load` and `error`, whether the browsers looses its `online` state, where the app is in its own lifecycle `DOMContentLoaded`, what sounds it `play`, and even a proprioception sense of the movement and position of the apps internal body parts when `animationend`.

Further still, the desktop computer merged and became more tightly associated with its more mobile users. The environment of the browser and its apps evolved to sense state changes of much more of its users and its surrounding: `touchmove`, `deviceorientation`, `devicemotion`, ambient `devicelight`, `Geolocation.watchPosition()`, etc. etc.
 
There is no reason to believe that this development will stop. As the web matures, the apps and browsers will sense more and more:
 * inside the apps body, 
 * inside the browsers body, 
 * inside the client/machine body,
 * inside the body of the network/cloud, 
 * outside in the physical environment of the client (temperature),
 * outside in the social environment of the client (mood, facial expression, attention),
 * outside in the physical environment of the cloud (resources),
 * outside in the social environment of the cloud (friends location)
 * and lots of other stuff we yet not know.

The purpose of the web community is not to protect against this evolution. It likely cannot be halted. The purpose of the web community is to protect our values: democracy, equality, common good, individual freedom, etc. in this development. Maybe Facebook should make their social network accessible so that their users could sense their friends in the domain of all applications? Is it sensible to send messages and friend-requests as events?
    
## References

 * 