# Pattern: StopStopProp

Adding event listeners in the `CAPTURING_PHASE` is rare. Calling `stopPropagation()` from one of these event listeners is rarer still. But, it can happen. And when it happens, it can be a problem, especially for web components (cf. the chapter CaptureTorpedo).
 
Using `unstoppable` event listener option is one way to avoid such problems. But, another possibility is to control the `stopPropagation()` and `stopImmediatePropagation()` methods on the event instance and/or event interface directly. We call this method the StopStopProp pattern. 

## Universal StopStopProp

The universal StopStopProp monkeypatches the `stopPropagation()` and `stopImmediatePropagation()` methods so that they do NOT work in the `CAPTURING_PHASE` for `composed: true` events. In addition, another method called `block()` is added to the event interface which re-enable developers to call `stopImmediatePropagation()` in the `CAPTURING_PHASE`, but only when they call `preventDefault()` at the same time. (The reason `stopImmediatePropagation()` and `preventDefault()` are linked is because custom web components must use a `CAPTURING_PHASE` event listener on the shadowRoot when they implement custom default actions (which in turn is essential for web components).)  

```javascript
(function () {
  const ogStopProp = Event.prototype.stopPropagation;
  const ogStopImmProp = Event.prototype.stopImmediatePropagation;
  Object.defineProperties(Event.prototype, {
    "stopPropagation": {
      value: function () {
        if (!this.composed || this.eventPhase !== Event.CAPTURING_PHASE)
          return ogStopProp.call(this);
        console.warn("A stopPropagation() call has been blocked."); //todo add stack trace
      }
    },
    "stopImmediatePropagation": {
      value: function () {
        if (!this.composed || this.eventPhase !== Event.CAPTURING_PHASE)
          return ogStopImmProp.call(this);
        console.warn("A stopImmediatePropagation() call has been blocked."); //todo add stack trace
      }
    },
    "block": {
      value: function () {
        ogStopImmProp.call(this);
        this.preventDefault();
      }
    }
  });
})();
```

## Demo: StopStopProp1

```html
<script>
  (function () {
    const ogStopProp = Event.prototype.stopPropagation;
    const ogStopImmProp = Event.prototype.stopImmediatePropagation;
    Object.defineProperties(Event.prototype, {
      "stopPropagation": {
        value: function () {
          if (!this.composed || this.eventPhase !== Event.CAPTURING_PHASE)
            return ogStopProp.call(this);
          console.warn("A stopPropagation() call has been blocked."); //todo add stack trace
        }
      },
      "stopImmediatePropagation": {
        value: function () {
          if (!this.composed || this.eventPhase !== Event.CAPTURING_PHASE)
            return ogStopImmProp.call(this);
          console.warn("A stopImmediatePropagation() call has been blocked."); //todo add stack trace
        }
      },
      "block": {
        value: function () {
          ogStopImmProp.call(this);
          this.preventDefault();
        }
      }
    });
  })();
</script>

<h1>hello sunshine</h1>

<script>
  const h1 = document.querySelector("h1");

  window.addEventListener("click", e => e.stopImmediatePropagation(), true);
  document.addEventListener("click", e => console.log("hello"), true);
  h1.addEventListener("click", e => console.log("sunshine"));
  h1.addEventListener("click", e => e.stopPropagation());
  h1.addEventListener("click", e => console.log("!!!!"));
  document.addEventListener("click", e => console.log("this listener never runs."));
</script>
```


## The per-event StopStopProp

StopStopProp can also be added on a per event basis, which will avoid using a monkeypatch. However, this method has some other drawbacks:
1. It adds an additional event listener, which has both a performance and complexity cost.
2. It will break if more than one event listeners need to use StopStopProp for the same event instance, and one other event listener that calls `stopPropagation()` or `stopImmediatePropagation()` sneaks in between them (it will work if other event listeners call `stopPropagation()` before or after, but not in between).
3. It is less consistent. The developer must remember to add the per-event StopStopProp listeners for all event listeners that needs it.

```javascript
function noCapturePhaseStopPropagation(e){
  e.stopPropagation = function(){
    if (this.eventPhase !== Event.CAPTURING_PHASE)
      return Event.prototype.stopPropagation.call(this);
    console.warn("stopPropagation() has been temporarily blocked!!");
  }.bind(e);
  e.stopImmediatePropagation = function(){
    if (this.eventPhase !== Event.CAPTURING_PHASE)
      return Event.prototype.stopPropagation.call(this);
    console.warn("stopImmediatePropagation() has been temporarily blocked!!");
  }.bind(e);
}
window.addEventListener("click", noCapturePhaseStopPropagation, true);
```

## Demo: StopStopProp2

```html
<script>
  function noCapturePhaseStopPropagation(e){
    e.stopPropagation = function(){
      if (this.eventPhase !== Event.CAPTURING_PHASE)
        return Event.prototype.stopPropagation.call(this);
      console.warn("stopPropagation() has been temporarily blocked!!");
    }.bind(e);
    e.stopImmediatePropagation = function(){
      if (this.eventPhase !== Event.CAPTURING_PHASE)
        return Event.prototype.stopPropagation.call(this);
      console.warn("stopImmediatePropagation() has been temporarily blocked!!");
    }.bind(e);
  }

  window.addEventListener("click", noCapturePhaseStopPropagation, true);
</script>

<h1>hello sunshine</h1>

<script>
  const h1 = document.querySelector("h1");

  window.addEventListener("click", e => e.stopImmediatePropagation(), true);
  document.addEventListener("click", e => console.log("hello"), true);
  h1.addEventListener("click", e => console.log("sunshine"));
  h1.addEventListener("click", e => e.stopPropagation());
  h1.addEventListener("click", e => console.log("!!!!"));
  document.addEventListener("click", e => console.log("this listener never runs."));
</script>
```

## References

 * [discussion about closed shadowDOM intention](https://github.com/w3c/webcomponents/issues/378#issuecomment-179596975)
