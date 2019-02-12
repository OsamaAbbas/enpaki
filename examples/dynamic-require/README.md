## Dynamic Require Example
This example shows you how dynamic require statements will work. Enpaki takes a semi-dynamic approach, where you can give `require()` a variable and it still understands what file to call, provided that you have included that file in your bundle. Keep in mind that `--include` option can take glob patterns.

See `entry.js` for more information.

### How to run this example?

```bash
$ enpaki --entry entry.js --include ./a.js ./b.js --output bundle.js
```

```bash
$ node bundle.js
inside a.js
inside b.js
entry.js: /path/to/example/entry.js
```