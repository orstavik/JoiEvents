# Grammar: CssAudio

The CssAudio grammar is a short declarative syntax for describing sounds in CSS.

The CssAudio grammar will recognize CSS variables, and try to add them as groups.

## pseudo-BNF

```
Pipe := Nodes, PipeTail.
PipeTail := "|", Nodes, PipeTail || <empty>.

Nodes := Nodearray || SingleNode.
NodeArray := "[", ArgList, "]".
ArgList := Nodes, ArgListTail.
ArgListTail := ",", Nodes, ArgListTail || <empty>.

SingleNode := Group || NodeArray || Function || Value.
Group := "(", Pipe, ")".
Function := Name, "(", ArgList, ")".
Value := Name || NumberText || Coordinate.
Name := [_a-zA-Z][_a-zA-Z0-9-]*.
Coordinate := NumberText, "/", NumberText.
NumberText := [0-9+-][0-9.e+-]*.
```

```
Pipe := <start>, PipeBody, <end> || "(", PipeBody, ")".
PipeBody := Node, PipeTail.
PipeTail := "|", Node, PipeTail || <empty>.

Node := Pipe || Array || Function || Value.

Array := "[", ArgList, "]".
ArgList := Node, ArgListTail.
ArgListTail := ",", Node, ArgListTail || <empty>.

Function := Name, "(", ArgList, ")".
Value := Name || NumberText || Coordinate.
Name := [_a-zA-Z][_a-zA-Z0-9-]*.
Coordinate := NumberText, "/", NumberText.
NumberText := [0-9+-][0-9.e+-]*.
```

## Semantics and resolution

1. The `Pipe` object: `{type: pipe, nodes: array, resolved: array}`
 * calling `resolve(pipe)` will recursively resolve all the `nodes` in the array.
 * and produce an array of the end audio nodes.
 
2. An `Array` is just an array. 
 * Calling `resolve()` on an array, will resolve all the nodes recursively.

3. A `Function` object `{type: function, name: string, args: array, resolved: audioNode}`. 
 * calling `resolve(function)` will recursively resolve all the `args`.
 * calling `getNode(function)` on a `resolved` function will give you an audio node.
 
4. The `Name` is object `{type: name, name: string, resolved: audioNode or txt}`.
 * calling `resolve(name)` will either give you an audio node for a select few names such as `whitenoise`, otherwise the name `string`.

5. The `NumberText` is an object `{txt: string, number: Number}`. 
 * calling `resolve(numberText)` will give you the object.
 
6. The `Coordinate` is an array `[{txt: string, number: Number}, {txt: string, number: Number}]`. 
 * calling `resolve(coordinate)` will give you the array object.
 
## Binding of nodes

Once the audio graph is resolved, the nodes are connected. For each array of nodes in each step of the line for the audio pipe, the nodes are connected many to many. 
 * "a | b | c" yields two calls: "a.connect(b); b.connect(c)" and return "c"
 * "[a, b] | [c, d]"  yields four calls: "a.connect(c); a.connect(d); b.connect(c); b.connect(d)" and return the two last nodes "[c,d]" 

The WebAudio API `AudioNode` or something is likely the interface for the node. All arguments of the `SingleNode` must be `resolved` before the AudioNode function is called.

4. `Name` and `NumberText` are objects: `{txt: string, number: Number}`. If `number` is `undefined`, it is a `Name`. If `txt` is undefined, the number has no unit.

5. `Coordinate` is a `[{txt: string, number: Number}, {txt: string, number: Number}]`.

* Pure data objects, no classes. 