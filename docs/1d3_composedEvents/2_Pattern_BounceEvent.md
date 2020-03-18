# Pattern: BounceEvent

Often, a web component might need to alert its surrounding of the state change of one of its inner elements. And often, there is no need to rename the inner event or change any properties on it. However, the inner event only signals a state change of a DOM element and therefore is `composed: false`. As it should be. In such circumstances, the web component would like to re-dispatch the inner event to its host node so that it will propagate one level up. We call the act of re-dispatching a non-composed event on the host node to "bounce the event".

## Demo: red-green-checkbox

```html
<check-box></check-box>
<script >
  class CheckBox extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode: "open"});
      this.innerHtml = `<input type="checkbox" style="background: green;">`;
      this._check = this.shadowRoot.children[0];
      this.shadowRoot.addEventListener("change", this.onChange.bind(this));
    }
    
    //we need to mirror the core aspects of the checkbox so that
    //a.o. the bounced events will make sense
    get checked(){
      return this._check.checked;
    }
    set checked(value){
      this._check.checked = value;
    }

    onChange(e){
      if(this._check.style.background === "green")
        this._check.style.background = "red";
      const bounceEvent = new Event("change", {composed: false, bubbles: true});
      //no need to copy any 
      this.dispatchEvent(bounceEvent); 
    }                                                                      
  }
</script>


```
 
 the developer might wish to "bounce" the event one level in the DOM, ie. wishes to , as it often might not be relevant for the  

Sometimes, you wish a web component to simply mirror/transpose the state change of an internal element. For example, your web component might simply wrap around an existing `<details>` element, and then you wish for the `<details>`'s `toggle` event to echo out of the web component.

To achieve this effect, you:
1. clone the `toggle` event
2. make the clone also `composed: false`, at least usually, and then
3. dispatch the cloned event to the host node.   
    
## References

 * 