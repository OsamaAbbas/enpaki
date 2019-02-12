## Circular Example
This example shows you an example of a circular require. `a.js` requires `b.js` and vice versa.

### How to run this example?

```bash
$ enpaki --entry entry.js --output bundle.js
```

```bash
$ node bundle.js
inside a.js: before require b.js
inside b.js: before require a.js
inside b.js: after require a.js
inside a.js: after require b.js
inside entry.js
```