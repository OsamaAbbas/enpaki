'use strict';

console.log('inside a.js: before require b.js');

const b = require('./b');

console.log('inside a.js: after require b.js');