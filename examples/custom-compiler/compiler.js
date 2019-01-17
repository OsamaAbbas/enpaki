'use strict';

const fs = require('fs');

module.exports = {
  getSupportedExtensions() {
    return ['.json'];
  },
  compile(filename) {
    let src = fs.readFileSync(filename, 'utf-8');
    return '/* custom compiler */\nmodule.exports = ' + src + ';';   
  }
};