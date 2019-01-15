'use strict';

const moduleA = './a';
const moduleB = './b';

const a = require(moduleA);
const b = require(moduleB);

console.log('entry.js: ' + __filename);

module.exports = {
  file: __filename,
  a, b
};