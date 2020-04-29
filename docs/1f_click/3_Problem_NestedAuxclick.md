# Problem: NestedInteractiveElements

In principle, this should 
What happens when two elements that both can react to the same trigger event are nested inside each other?

When the two events are branching in parallel, then there is no big problem. But, when the two events should be mutually  

## Demo: OmgWt_

```html
<a href="#omg">omg <input type="text" value="wt_"></a>.

<script>
  const mousedown_prevented = document.querySelector('a[href="#mousedown-prevented"]');
  const click_prevented = document.querySelector('a[href="#click-prevented"]');
  const contextmenu_prevented = document.querySelector('a[href="#contextmenu-prevented"]');
  const auxclick_prevented = document.querySelector('a[href="#auxclick-prevented"]');

  const textarea_auxclick_prevented = document.querySelector('#textarea-auxclick-prevented');
  const textarea_mouseup_prevented = document.querySelector('#textarea-mouseup-prevented');

  window.addEventListener("mousedown", e => console.log("mousedown"));
  window.addEventListener("contextmenu", e => console.log("contextmenu"));
  window.addEventListener("beforeinput", e => console.log("beforeinput"));
  window.addEventListener("auxclick", e => console.log("auxclick"));
  window.addEventListener("click", e => console.log("click"));

  mousedown_prevented.addEventListener("mousedown", e => e.preventDefault());
  click_prevented.addEventListener("click", e => e.preventDefault());
  contextmenu_prevented.addEventListener("contextmenu", e => e.preventDefault());
  auxclick_prevented.addEventListener("auxclick", e => e.preventDefault());

  textarea_auxclick_prevented.addEventListener("auxclick", e => e.preventDefault());
  textarea_mouseup_prevented.addEventListener("mouseup", e => e.preventDefault());
</script>
```
  
## `auxclick` competition

As we saw in the previous chapter, `click` and `auxclick` are both reacting to a sequence consisting of a `mousedown` and `mouseup` event. And they will not run in parallel, even though they very well could have done so. They are competing.

But, as the demo above shows, `auxclick` is also in competition with `contextmenu` *and* run in parallel with `beforeinput` event cascades on input elements.

### `auxclick` vs. `beforeinput`

In many ways, the competition between `auxclick` and `beforeinput` is simplest: they run parallel, one before the other. When a `mousedown` and `mouseup` on the wheel/middle button is performed, the AuxclickController runs first and dispatches its `auxclick` event, and then the InputController runs second and dispatches its `beforeinput` event. This behavior is only really feasible when the `auxclick` event has no default action of its own in this scenario.     



## Further reading

In this chapter we will look at the ins and outs of `click`:
1. We start in this chapter looking at how the browser generates `click`.
2. Then we look at how `auxclick` works, `click`'s cousin.
3. Then we look at the competition between auxclick and click. this competition can be resolved looking at the mouseup event and the state machines of auxclick and click respectively. This is a bit simpler than the kåre en vinner when the competition is between different controllers on the same trigger event depending on the DOM context.
3. We then look at how the browser generates the universal `dblclick` event from `click` events. The `dblclick` is always generated if appropriate.
4. Then we look at the native element's behavior that is triggered by `click`:
   1. `click` on `<summary>` to `open` and  `toggle` the content of the parent `<details>`.   
   1. `click` on `<a href="...">` to navigate to a new document.   
   1. `click` on `<a href="...">` to navigate to a new document.   
   1. `click` on `<img usemap="...">` to navigate to a new document.   
   1. `click` on `<input type="submit">` to `submit`.   

## References

 * dunno