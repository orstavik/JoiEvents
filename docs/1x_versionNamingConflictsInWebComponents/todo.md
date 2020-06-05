1. add test for app with comp a that uses comp c v2 and comp b that uses comp c v1
2. the problem of the helicopter parent child. check for ability, not type. judge the book by its content, not its cover. make properties that are sometimes available return null instead of undefined when they could be present.
3. make customElements.define third argument be a semantic version identifier.


5. delay the calling of define until DCL.
6. test how the multiple customElements work.  

Why undefine?
4. test if define undefine define will call the constructor twice.
https://github.com/w3c/webcomponents/issues/754
https://github.com/w3c/webcomponents/issues/716


There are three use-cases for package management for web components:

1. conflicts between the same component loaded and used within *different shadowDOMs* /dom contexts. These components do not interact with each other. And they only interact with their own host node. 

   This problem is solved by two practices: 1. give different tag names in the shadowDOM. 2. using scoped customElements. It could be noted that simply using custom tag-names can partially solve the use case for scoped customElements, however, the code of such scoped names is not that pretty.
   
   Adding the ability to add different CustomElementRegistries to each document/shadowRoot is a good idea. However, it doesn't quite solve the problem of undefining custom element definition.

2. conflicts between components in helicopter parent child relationships. Ie a helicoterParent of one version interacting with a child of another version.
 
   This is solved by having the helicopter parent child relationships interact based on ability, not type. Ie. the form don't query elements to see if they have a certain tag name or type, but if they have certain properties and/or attributes. The form should consider every element with a .name and .value different from `undefined` to be a control element.     

3. Event controllers. What if one element loads an event controller that another element also needs? What if two elements load two different versions of the same event controller?

   This cannot be. And to avoid such conflicts the customElements.define system can be used. We can register an event-controller-eventname. Or we could do customElements.defineEvent(...). Maybe this is better. This method could then be responsible for registering the  

4. Other underlying JS conflicts. Do two different custom elements interact with the same network resource, redundantly or in conflict? Do two different custom elements write to the same global, `window` property? Do they register some class names in the global scope with the same name?

5. Inefficiencies. The last issue is inefficiency. Even when components are not in conflict with each other, loading two or more compatible version of the same resource in different branches of the DOM is unnecessary. It takes bandwidth, computing resources, etc. Enabling the `^` and the `~` selectors from npm would be much better.
    
So, as long as they are given different tag-names in their , that do not interact with any elements outside of the shadowDOM. This is 

Does versioning really matter? If we have component inside shadowDom, we can just hide with different name. For HelicopterParentChild we should check for ability, not type.
So, what is left?
1. The conflict emerges. There are two components that both use a third element, and they both load it themselves.
This setting also illustrate how the loading of web comps are problematic from a user perspective. Because the components need many. Should all loading be delegated out? Should there be a package.json for each web comp, that can be accumulated out? And this applies to all js scripts.
It requires a design or load time package resolver.
The simplest package resolver is the try catch around adding a package for the same name. This doesn't work well enough.
The second simplest package resolver is the check for ability not type.
The simplest is first wins.
The second is implied interfaces.
First loaded wins.
The third is adding a version. This implies an implied interface. As any element can be given the same name. Ie.
Thus, should the name of the element be package owner-project name from github?
Or would that make it difficult to branch?
Should it be theme-concept? Like form-button? Modal-form-button? Likely, there are so many different considerations and use cases for this naming, that it cannot be trusted. Or should it be group-role, like material-button?
Then, we have the problems with interaction and encapsulation of elements. Mostly, elements are separate. Elements that are only in use in the shadowDom don't interfere with other versions of the same element in different shadowDoms. The only problem here is inefficiency.
The problem of interactivity is only HelicopterParentChild and they should check for ability not type.
But, i think maybe web components should be loaded as scripts. Their own type. <Script type="web-comp" src="url" tag="x-y" dependencies="?">.
Because, this script could check if it is necessary to load a new type before the web resource is gotten. This script tag could also do the version check. And this script tag would be the home for any dependency control.
This script tag is basically just adding the ability to load a script using a url instead of a ready class, so to avoid loading a file unless it is necessary.
I need to check the dynamic import.



Semantic versioning arithmetic npm vs github versions.
1. It enables developers to accept minor changes or patches to web components from the web components developers. If you only have fixed versions, then you can't do this. This is important and useful and allow for concurrent development.
2. Semver also enable packages to conform around a shared usecase. This web components don't do. They only have the one name. To fix this, either each shadowDom would need their own customElements.define. Or you would need to add a semantic version to the name of the element: my-comp-1-3-0-rc1
3. So, if app A uses web comp B and web comp C v1, and web comp B uses web comp C v2, how can this conflict be solved when app A registers comp-c (v1) and then web comp B tries to register comp-c (v2)which it doesn't have to, because comp-c is already there, but which is wrong and don't work, because it is v1.




Web components that use other web components should probably lock their names using semver tail names on the tag name.
If the web comps themselves cannot integrate semver when they load components, neither in the url for the js modules, nor in the custom elements define, then there is little point in using npm.
If elements are only nested as isolated entities, then smaller problem. They can be given unique v numbers. But, if two elements can be integrated with each other directly inside a third vontext/app/shadowDom, then we have a problem. However. This is very little the case:
1. Dom elements don't travel between documents. AdoptedCallback is a non use case.
2. Js methods should only run via host node. That means that it is only directly above or below, the shadowDom and the lightdom that use each others api, and they both know the version.
No.. Wait. Its only the HelicopterParentChild relationships that are sensitive to version conflicts.
You have a form parent. And then a button child. And an input text field. But you use button v1 and text v2. Button v1 require form v1 and text v2 require form v2.
Inside a component, the text v2 might interact with form v1.
Or inside an app.
I need to research version management inside js modules hierarchies.



http://nodesource.com/blog/semver-tilde-and-caret/

Ok, the semver 2.0 is the core rules. And then npm adds the ~ and ^ to the mix. I think that any client side package manager simply need to support the npm semver system, and that is good.
The problem is that the npm package manager specifies the dependency at the point of use, not the point of definition.
I must take a break, sorry
The second problem is that the js modules are not versioned. There is no syntax for defining compatibility between two js modules which load the same class. No.. That is not true.. It is possible before the class is registered. And it is very simple to add a static get version() method to the class. Which a customElements could use. So that when you define the tag, you could check the registered class for version name.
Hm.. Adding the static version on the class. And then we could ascribe this static property to classes that don't yet have a version.
What if we generate package.json from the sourcecode of the web components?
Ok, we have a static get version () {return "1.2.3"
Every time customElements.define is called, then a semver query is added.
Scanning the source code can generate a package json file.
F... It is dependency both on the level of the dom and js. I think the js needs to be off the table.
It is unsustainable to have two files for every web component, a js file and a package.json file.
We must have one. But, we can generate package.json from parts of the js file, that is simple.
Package.json would be easier for many today, but it would be far from simpler.
Second, if versions are js static methods, then load time version control is possible.
Having the version number in the source file to communicate intent about functional state is good) and then we just generate a npm file from the single source (of truth) file.
Then the distribution system of npm can be used, as is. But, the version should be added as
Static getter. Then the element can be used in different loading schemes also runtime. But it can be used design time too. It is good. Using the static getters should also be used design time. Static methods are available all the time. They can be hacked runtime, but they are a kind of shared space. They are the designtime space made available runtime.
Todo. Add static get version to the demo. Use this method to assign version to the tag name. Enable this value to be overridden by customElements.define. Set customMethods.define AcceptVersion.