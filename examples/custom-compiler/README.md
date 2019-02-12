## Custom Compiler Example
This example shows you how to use a custom compiler for a certian filetype (`.json` in our case). The compiler is any module that exports two functions:
1. `getSupportedExtensions()`: which returns an array of extensions (for example: `['.json']`).
2. `compile(filename)`: which takes a `filename` and return the transpiled/compiled source code that will be bundled.

See `./compiler.js` to see how we implemented a simple `.json` compiler.

### How to run this example?

```bash
$ enpaki --entry entry.js --compiler ./compiler.js --output bundle.js
```

```bash
$ node bundle.js
data.value: Hello World
```