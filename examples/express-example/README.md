## Express Example
This example shows you that you can bundle the whole `express` module in your bundle.

Please note that we need to `--exclude ejs`, because express source code gives an example (inside a comment) that has `require('ejs')`, which we don't need or use in this example. Otherwise, you will get this error: `Unable to locate "ejs"`.

### How to run this example?

```bash
$ npm install
$ enpaki --entry entry.js --exclude ejs --output bundle.js
```

```bash
$ node bundle.js
express server listening on port 3000
```