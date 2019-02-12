## Exclude Example
This example shows you how to exclude a file or a module from the bundle.

### How to run this example?

```bash
$ enpaki --entry entry.js --exclude ./c.js --output bundle.js
```

```bash
$ node bundle.js
inside a.js
inside b.js
inside c.js
entry.js: /path/to/example/entry.js
```

* `bundle.js` should NOT contain `c.js` file.
* If you move `bundle.js` to another directory, you have to move `./c.js` file as well.