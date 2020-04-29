# Why: make macro and micro tasks?

> Micro and macrotasks are highly relevant for event propagation and dispatch.

## WhatIs: scope? (philosophy )

Blocks of code (ie. `{...}` in JS and lightDOM in HTML) provide scope. Lexical scope.

Tasks provide scope.

Scope is a thought structure. It is a data object, for example an acyclic graph that the developer imagines in his/her short term memory/attention/consciousness when he/she reads write a piece of code. The envisaged scopes are quickly erected, and quickly discarded when the developer jumps from location to location in his code.

The scopes in the minds of the programmer are strongly related to the grammatical structures in the code that are used to create the scopes in the code. In fact, over longer period of time, they form culturally and linguistically as the community of developers gradually shape the face of their language to suit their collective understanding of their programs environment. 

The scopes in the individual mind also is shaped over time, as the developer gradually learns the mindset and culture and grammar of his fellow programmer community. The developer slowly adjusts his own thought constructs to the recognizable grammatical constructs and then learns to "see the code" in the costume of the programming language.

But scope is not a 1:1 match. First, the human mind of the programmer is not focused on the details, but the patterns, and so might miss a detail or two. Second, the programmer might have a slightly or drastically skewed "view of the world" that stem from his/her experience in other programming environments, lack of experience, personal style and creativity, etc. Third, the programmer often knows more about the program, knows what the environment looks like because he has memories of previous scopes from other parts of the program previously studied. Thus, while strongly resembling the grammatical structure of the programming language, ie. when a JS developer imagines the cyclical graph of his/her module or program it tightly resemble the similar textual model written down in code, the scope in the mind of the programmer is not the same as the actual, written version, as the human programmer embelishes and reduces from this model as he/she sees fit and so add creativity and randomness to its structure.     

## Why scope?

Benefit from scopes:

1. Encapsulate to reuse: By wrapping the same functionality and/or data in a block of some kind and giving that block a name, this unit can be referenced to from **many different places** and at **many different times**. This avoids redundancy in both code and data. This is the basic teachings of all programming.
2. Encapsulate to compartmentalize: Human being developers can only envisage so much of the system at the same time. The head space, attention span, and short term memory is limited. Dividing code in time and space, into semantic blocks and discrete events, greatly help the developer to limit the scope of the problem he/she is currently working with. 
3. Encapsulate to share: Once the problem is divided into smaller units, bigger problems can be worked on by different people at the same time (or by the same person at different times). The scopes therefore not only become borders of technical reusability (1) or cognitive reusability (2), but also borders for social reusability (3).



## Low-level lexical and chronological scopes 

Blocks (ie. `{...}`), such as objects, functions, and control structures, separate groups of statements/expressions into different **lexical scopes**. The same name means different things depending on which block scopes it occurs in. Lexical scopes can be nested very, very deep. And lexical scopes can be constructed in grammatically quite complex ways. For example, it might be hard to decipher the lexical scope of a closure, and what `this` means in different functions. The lexical scopes form the foundation for name spaces, and lexical scopes in many ways define the space of our code environment (alongside the space of real values).

Statement and expressions (ie. `;` and `(...)`) also group function calls into groups. But, while blocks divide code into lexical scopes, statements and expressions divide code into **chronological scopes**. For example, by separating functionality with `;` you can create a sequence of `1;2;3;4;...`. Statements provide an upper level sequence of expressions, while expressions can organize functions in as many nested levels as necessary. Technically, both is converted into a single sequence (a call stack) that will run all function calls in both statements and expressions as a single sequence.

Low level JS thus enable us to organize our code in two distinct dimensions:
 * a lexical space (blocks) and  
 * a chronological timeline (statements and expressions).

## High-level lexical and chronological scopes

But, the browser provides us with more, higher level scopes:
 * the **space of the DOM** and
 * **chronological events**.  

While the low-level lexical and chronological scopes in JS are mostly realized as syntactically constructs, the high-level lexical and chronological scopes are mostly realized semantically. 

The DOM provides a spatial super-structure of the state of the application. All data and all functions are organized as nodes in the DOM. This does not mean that all lexical scopes are given an individual entry in the DOM, far from it; the DOM often takes big clusters of data and running functions and add them only under a single `<script>` node in the DOM. The DOM is the **space** under which all data and functions are organized. 

The event loop provides a chronological super-structure of the state of the application. All state changes are organized as events. Events are commonly considered *externally driven*: an event that represent a user action (cf. `mousedown`) or a state change in the browser environment (cf. `resize`). That they are triggered by the same external state change is one reason to divide a group of functions and data as one event.

But. Most events are actually internally driven (cf. `toggle`, `click`, `input`, `submit`, `animationend`, ++). These events are not unified by the fact that they are ultimately initiated by the same external state change. Instead, these functions and data are divided into their own chronological events because *that makes them easier to reason about*.

## Medium-level lexical and chronological scopes
 
In between block scopes and the DOM are several layers and areas of lexical scopes. The most common and familiar to most would be to develop classes and objects that represent data, pure functions, and/or state machines as a JS `worker`, `class`, `function`, or `object` property under the `window` or another DOM node. Furthermore, developers can now also organize their data, pure functions, and/or state machines as web components, ie. first class DOM elements. This enables developers to also group branches of DOM elements as shadowDOM and enable native interaction with the rest of the DOM.

In between statements/expressions and the event loop there are also different domains and medium scopes.

1. loops and control structures such as `for` loops and `if..else` choice points. 
2. `worker` threads can be created to run different blocks of code in parallel with the main thread. A `worker` enable the developer to divide two pieces of code to run in different sequences in a way that enables the browser to run them in parallel.
3. microtasks enable the flow of control to delay groups of function calls until the current main flow is completed. Code delayed in a microtask will be run before the macrotask ends, but it will not be initiated until the list of tasks yet to do in the current macrotask is empty. 

## Why scope in time?

> Tasks are like blocks of statements in time. 

Both macro and micro tasks scope the flow of control into separate units. By separating the flow of control from different parts of the code, both the macro and micro tasks ensure that no state changes are made in the DOM by function calls that are not part of the same task, until that task has completed. The borders between the different tasks ensures that function calls from different parts of the system is not interwoven in time.

But why? Why divide code into different tasks?
1. Encapsulate to reuse: When a series of functions (task) that should occur at certain times, but not interweave with other such series of functions (tasks), then such tasks become reusable. We have the core of a reaction; we have the principal foundation for event listeners, default actions, event controllers, callbacks, observers, etc. We can describe one reaction to a particular event, and then reuse this reaction again and again, and from place to place.
2. Encapsulate to compartmentalize: If two sequences can interweave at any given point, then the product of both sequences are dramatically more complex than the simple sum of each set of sequences. By ensuring that the two sequences not only overlap at a fixed point, but also at the tail end of each other, the complexity of the two can be reduced to the complexity of each sequence. Imagine having all the reactions for `mouseup`, `click`, `invalid`, `submit` and more run interweave when the user submits a `<form>`. By dividing state changes into discrete events, we do not have to manage and think about them at the same time, but instead get bite size problems of manageable complexity.
3. Encapsulate to share: Once your code is demarcated to occur within the scope of a task, then *two* things happen:
   1. No other developer's code will interweave with your code, but also
   2. your code will not interweave with other's code.
   
   It is the golden rules of politeness: "Do unto others as you would have them do unto you"; don't interrupt; wait your turn. By dividing code into tasks, you ensure that multiple developers don't speak at the same time come *run-time*.
   
   When a developer is given the control of the flow as a macrotask, this means that he has been given a full "turn to speak". The **macroturn** is like an open-ended question: "what do you think about state-change X?". The state change that triggered the event is his domain; it is his problem; and it is his turn to work with the DOM.
   
   When a developer is given the control of the flow as a microtasks, he is only given a *half* "turn to speak". The **microturn** is like a yes/no-question: "did i leave the kitchen stowe on?". It would be impolite of the developer receiving the flow of control as a microtask to do too much: he should not propagate new events (cf. how `toggle` event is delayed as a macrotask instead of run from within the sync scope of toggling the `.open` property on the `<details>` element); he should not spawn state changes outside/above his own scope. Such actions would be unexpected and "rude" done in a microturn, but expected and desired of a macroturn. Given control of the flow from a microturn, the developer should only do state changes *internal* to his scope: if bigger state changes needs to be done, these actions should be run/delayed as a macrotask.  
   
> Microtasks and macrotasks enable one developer to complete his her chain of thoughts within an uninterrupted flow of control, before passing the flow of control to another function developed by another developer.   

## Do we need micro-tasks?

Microtasks are mainly used for:
1. `Promise`. Many different functions return `Promise`s which essentially queues a callback function in the microtask queue.
2. `MutationObserver`. The `MutationObserver` callbacks are queued in the microtask queue.
3. Custom element callbacks such as `connectCallback()` and `attributeChangedCallback()`, as well as the `slotchange` event, which all echo `MutationObserver` interface, are run async from the microtask queue. 

But, from a principal standpoint, there is no real need for a microtask queue. As the event loop already prioritize different macrotask queues differently, the microtask queue could simply be implemented as a top-, super-priority macrotask queue (a queue that has to be empty before any other macrotask queues were chosen).

From a grammatical standpoint, it is beneficial to distinguish the microtask queue as different from the other macrotask queues. It makes more sense to have a different name for the task queue that has custom syntactic markers such as `async` and `await`.

From a technical standpoint, there can be plenty of reasons. Macrotasks can be separated by different systems in the browser which makes calling the next macrotask much less efficient than calling the next microtask. However, this would be a bad set up, as will become more evident in later chapters.

## References