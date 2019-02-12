'use strict';

const a = require('./a');
const b = require('./b');

console.log('entry.js: ' + __filename);

module.exports = {
  file: __filename
};