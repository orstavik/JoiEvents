# Anti-pattern: `:checked`

> `:checked` as an option for `<option>` is skipped. It does not feel well.

`:checked` is a CSS pseudo-class that can query the state of a checkbox or radiobox. The `:checked` pseudo-class implicitly relates to three(!) `checked` properties/attributes on the `<input>` element: 

1. The `checked` attribute in HTML is **not** updated(!) If you mark an unchecked checkbox with the `checked` attribute either in the HTML template or using `.setAttribute("checked", true)`, it becomes checked on screen. The same goes if you remove the `checked` attribute. But if you uncheck the checkbox using a mouse on screen, the `checked` attribute remains in the DOM.

2. In addition to a `checked` attribute, the `<input>` element has a `checked` JS property. When the user `click` on a check- or radiobox, it is this `.checked` JS property that changes. This means that `<input>` elements have a *static* `checked` HTML attribute and a *dynamic* `.checked` JS object property. 

3. To avoid calling `getAttribute("checked")` all the time, the browser also includes a `.defaultChecked` JS property. `.defaultChecked` and the `checked` HTML attribute are always in sync: if you set `anInputEl.defaultChecked = false`, then this setter method will also remove the `checked` attribute from `anInputEl` if necessary, and vice versa. 

4. This means that the attribute selector `[checked]` queries the attribute and the `defaultValue`, **not** the `.checked` JS property which is what you actually **see** in the view and **will get** if you submit the form.

## Why is `checked` broken? 1. Deep state
 
The `checked` architecture is **bad**. Very bad. You should not structure state in your objects in a similar way. And here is why:

The `.checked` property is *visible on screen*; it is the property that changes when the user interacts with the checkbox or radio box; and `.checked` is the value in the `POST` or `GET` request produced when the `<form>` is submitted. The `.checked` property is "the real value" from the perspective of the user. The `.checked` property is "the current value", it reflects the current state of the `<input>` element.
 
Yet, `.checked` is visible *only from JS*. If you print the DOM as HTML, it doesn't exist. And this means that you cannot see it from CSS neither, if you don't use the special `:checked` selector.
   
The HTML template version of the DOM is a) the element tag-name, b) their attributes with string values, and c) the hierarchical relationships of parents, nested children, siblings, etc. No other JS properties exists in the HTML version of the DOM.

This means that if the "real DOM" (ie. what you see on screen and the data that programs and users respond to) and the "HTML DOM" (ie. what you would get if you printed the hierarchy of elements with attributes) are different, then *from the perspective of HTML there is a deep state*.

This in turn means that you cannot fully read nor control the DOM from HTML alone; some operations *must be* performed via JS.

In the case of the `checked` *property*, this means that for CSS to *read* `checked`, it cannot simply query for example the `[checked]` attribute, but must instead use a special pseudo-class `:checked` that can go deeper into the JS zone of the DOM and extract a value.

This is a **bad** pattern. If there are aspects of the *current*, *real* DOM that you need to either a) *read from CSS*, b) *specify from template*, or c) *have the same view of in the debug view of the DOM as on screen*, then that value should either be reflected as a) an attribute or b) a text node child.

> Rule of thumb: If you see something on screen, then this reality should in principle be reflected in the DOM as attributes and text nodes.

## Why is `checked` broken? 2. HTML is synchronous

We start by declaring some simple truths: 
 * HTML and CSS are declarative language. 
 * Declarative languages are synchronous. 
 * The DOM is dynamic. 

Put simply, this means that when you open devtools, then:
1. what you see in the app screen and 
2. the values of the "Elements" hierarchy (the hierarchy of HTML tags and HTML attributes) and the styles (the list of CSS rules and properties), 

   are **always in sync**, even as the DOM changes dynamically. 

Of course, there are some grey areas here: CSS animations and transitions are *declared as functions of time*, and for practical purposes CSS styles are *not* calculated synchronously. But, again, when you see something on screen, then that reality should in principle be reflected in the DOM as attributes and text nodes, *immediately*.

This also means that HTML and CSS **forget**. Immediately. The DOM is not a structure that is designed to *remember* historical states. It's a snapshot of "right now". Historical states of the DOM might very well be highly relevant, useful, and mission critical. But this timeline does not belong in the DOM, this should be preserved elsewhere in JS land.

The `checked` *attribute* however is **not in sync**. It's **historical**. It represents the `defaultValue`. You might be forgiven for thinking that the `defaultValue` is the same as the initial state of the `<input>` element. However, its not, as scripts can easily alter this value using `setAttribute("checked", "")`. 

This is a **horrible** pattern. This means that the HTML version of the DOM explicitly tell you about a default, historic state of the DOM, and *nothing* about the current, real state that you see on screen.

> HTML is a declarative language, and declarative languages are synchronic. All its statements are true at the same time; it all happens at the same time. It is the opposite of an imperative programming language in which things happen one step at a time. The DOM is the current state of HTML. Any dynamic changes to the app's state (that is represented in the DOM, and not just as JS variables) *should* immediately be reflected in the DOM state. The DOM isn't a historic account of the original template; the DOM is always simply "the present reality", a reality that simply happened to be *first* described in an HTML template. 

## References

 * [MDN: CSS pseudo-classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes)