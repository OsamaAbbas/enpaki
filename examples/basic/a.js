'use strict';

const b = require('./b');

console.log('a.js: ' + __filename);

module.exports = {
  file: __filename
};