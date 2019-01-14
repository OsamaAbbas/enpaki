'use strict';

const fs = require('fs');

const compiler = function(filename) {
  
  let src = fs.readFileSync(filename, 'utf-8');

  return 'module.exports = ' + src + ';';
};

compiler.extname = '.json';

module.exports = compiler;