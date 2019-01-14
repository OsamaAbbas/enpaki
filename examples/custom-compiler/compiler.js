'use strict';

const fs = require('fs');

const compiler = function(filename) {
  
  let src = fs.readFileSync(filename, 'utf-8');

  return '/* custom-compiler */\n\n' + src;
};

compiler.extname = '.js';

module.exports = compiler;