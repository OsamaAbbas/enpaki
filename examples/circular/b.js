'use strict';

const a = require('./a');

console.log('__filename: ' + __filename);

module.exports = {
  file: __filename,
  a
};