'use strict';

console.log('inside b.js: before require a.js');

const b = require('./a');

console.log('inside b.js: after require a.js');