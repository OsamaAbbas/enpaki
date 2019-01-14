'use strict';

const a = require('./a');
const b = require('./b');

console.log('__filename: ' + __filename);

module.exports = {
  file: __filename,
  a, b
};