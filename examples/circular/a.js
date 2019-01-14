'use strict';

const b = require('./b');

console.log('__filename: ' + __filename);

module.exports = {
  file: __filename,
  b
};