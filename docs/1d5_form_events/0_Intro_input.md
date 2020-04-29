## Intro: Why input elements and events?

Some of the most important HTML elements we have is the form and input elements. Input elements require both a lot of (reusable) JS functions and a lot of (reusable) CSS style. And, there are lots of alternative use-cases for input elements: suggestive writing, spellchecking, hotkeys, automatic translation, AI enhancement, dynamic generation of selections, dynamic visualization during input, wysiwig/code editors, domain specific "pickers" (cf. date and color pickers), and lots lots more.

Custom input is one of the most important use-cases for web components, on par with other top domains such as custom output and custom layout. It is as if web components were designed for custom input elements who likely need to encapsulate both custom structure (cf. `<select>`), custom style, and not to mention custom JS functionality. Custom input elements is hand in glove for web components.

But. There are two big challenges with custom input elements: 
1. How to respond to user events by default? ie. how to organize and implement their default actions? How to observe the user actions and react to them?
2. How to alert other scripts about the input elements' builtin, default *re*action to the user actions? 

## References

 * 