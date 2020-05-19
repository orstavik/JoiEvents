1. add test for app with comp a that uses comp c v2 and comp b that uses comp c v1
2. the problem of the helicopter parent child. check for ability, not type. judge the book by its content, not its cover. make properties that are sometimes available return null instead of undefined when they could be present.
3. make customElements.define third argument be a semantic version identifier.


5. delay the calling of define until DCL.
6. test how the multiple customElements work.  

Why undefine?
4. test if define undefine define will call the constructor twice.
https://github.com/w3c/webcomponents/issues/754
https://github.com/w3c/webcomponents/issues/716
