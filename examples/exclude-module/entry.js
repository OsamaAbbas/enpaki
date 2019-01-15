'use strict';

const a = require('./a');
const b = require('./b');
const c = require('./c');

console.log('entry.js: ' + __filename);

module.exports = {
  file: __filename,
  a, b, c
};