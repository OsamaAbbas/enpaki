## Basic Example
This example shows you a very straigforward example of an entry script that requires two other script, and one of them requires the other too.

### How to run this example?

```bash
$ enpaki --entry entry.js --output bundle.js
```

```bash
$ node bundle.js
b.js: /path/to/example/b.js
a.js: /path/to/example/a.js
entry.js: /path/to/example/entry.js
```

* `bundle.js` should run exactly like `entry.js`.
* If you move `bundle.js` to another directory, the `__filename` variables reflect the new path.
* If you do `require('./bundle.js')`, you should get all the exports that you have defined in `entry.js`.