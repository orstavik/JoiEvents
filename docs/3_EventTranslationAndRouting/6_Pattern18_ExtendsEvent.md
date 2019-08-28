# Pattern: ExtendsEvent

`new CustomEvent(...)` is a good method. We can make events. But. When we add methods to the CustomEvent/detail objects, things get a little messy.

1. When we *declare* a `CustomEvent` with custom methods there is an issue. When we first declare the functions, `this` is an abstract construct. It is only when we bind a function to a property on the CustomEvent that `this` becomes the CustomEvent or detail object. Sure, this is fundamentally how `this` works in JS, but are there really no better ways to set up such objects?

2. When we *use* a `CustomEvent` in an event listener, all the different custom events are described by the same class. This makes them less than ideal to work with.
   1. Typescript and other strong-type-tools cannot recognize, nor spellcheck, nor suggest ad-hoc properties added to the CustomEvent. 
   2. No `instanceof`.
   3. Devtools hides the event-type name and ad-hoc properties deep down among other boilerplate properties.
  
   Is there really no better way to expose the API of our custom events?

## Implementation

In es6, there is another way: by extending `Event`:

```javascript
class SpecialEvent extends Event {
  constructor(type, props = {bubbles: true, composed: true}){
    super(type, props);
    this.one = "something";
  }
  two(){
    return this.one + " else";
  }
}
var customEvent3 = new SpecialEvent("special-event");

window.addEventListener("special-event", function(e){
  console.log(e);
  console.log(e.one);
  console.log(e.two());
});

window.dispatchEvent(customEvent3);
```

## Why use `extends Event`?

A *main purpose* for the `class` syntax is to clarify the scope for `this`. When you make a class, you frame `this` with a pair of `{ ... }`. And via `extends` you can include already established scopes for `this`. The confusion of seemingly independent functions with abstract `this` becoming intertwined methods with a bound `this` can be solved using a `class` that `extends Event`.

A `class` would also solve the API issues *users* of the custom event face. Strong-type-tools can check their methods and properties; `instanceof` is ready; and Devtools will clearly present the custom event by name and elevate important properties.

Native events such as `MouseEvent` and `KeyboardEvent` provide this interface. They implement/inherit the `Event` interface and attach their properties and methods *directly* to the event object (*no* `.detail` there).

And, in principle there should be no real performance difference between extending the Event class and adding properties to the CustomEvent object.

So, when do you use `new CustomEvent(...)`? If your code base aims at es5, then `class` is not available. If you create and dispatch custom events in code oriented towards other purposes, such as app scripts and web component definitions, `new CustomEvent(...)` is likely your best choice.

When do you use `extends Event`? If your code base aims at es6, then it is better to go es6 all the way and then transpile es5 as a post-production step. If you are making complex, detailed composed events and event sequences that focus on reusability, then investing in `extends Event` gives you a cleaner API when your composed events are reused and a cleaner interface that will likely produce fewer bugs as the code in and around the produced event objects gets more complex.

## References

 * 
                                                                            