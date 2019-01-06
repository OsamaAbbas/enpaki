'use strict';

const fs = require('fs');
const path = require('path');

const locate = require('./locate.js');

const {
  BUNDLE_HEADER,
  BUNDLE_FOOTER,
  FILE_HEADER,
  FILE_FOOTER
} = require('./bundle-template.js');

const parseFile = function _parseFileFunction(filename, options = {}) {

  if (!_parseFileFunction.initialized) {
    _parseFileFunction.REGEX_REQUIRE = /require\s*\(\s*["']([^"']+)["']\)/g;
    _parseFileFunction.parsedFiles = [];
    _parseFileFunction.initialized = true;
    // console.log('initialized');
  }

  let filetype = path.extname(filename);
  let code = '', childs = [];

  try {
    if (options.compilers[filetype] && options.compilers[filetype].call) {
      code = options.compilers[filetype](filename);
    } else {
      code = fs.readFileSync(filename, 'utf-8');
    }
  } catch (e) {
    console.log(filename);
    console.log(e);
    process.exit(1);
  }

  let moduleIdentity = path.relative(options.basedir, filename);

  code = FILE_HEADER(moduleIdentity) +
    (code
      .replace(/#!.*/, '')
      .replace(_parseFileFunction.REGEX_REQUIRE, (match, moduleName) => {

        let location;

        try {
          location = locate(moduleName, path.dirname(filename));
        } catch (error) {
          console.log(error);
          process.exit(1);
        }

        let childIdentity = path.relative(options.basedir, location);

        if (!locate.isCore(location)) {
          if (!_parseFileFunction.parsedFiles.includes(location)) {
            childs.push(location);
            if (childIdentity.includes('node_modules')) {
              let pkgFile = path.join(path.dirname(location), 'package.json');
              if (locate.stat(pkgFile).isFile()) {
                childs.push(pkgFile);
              }
            }
          }
        } else {
          childIdentity = location;
        }

        return `require('${childIdentity}')`;
      })) +
    FILE_FOOTER(moduleIdentity);

  _parseFileFunction.parsedFiles.push(filename);

  if (options.include.length) {

    childs = childs.concat(options.include.map(moduleName => {
      try {
        return locate(moduleName, path.dirname(filename));
      } catch (error) {
        console.log(error);
        process.exit(1);
      }
    }));
    options.include = [];
  }

  childs = childs.forEach(location => {
    code += _parseFileFunction(location, options);
  });

  return code;
};

const enpaki = function (entryScript, opts = {}) {

  let options = {
    basedir: path.dirname(entryScript),
    compilers: {},
    include: opts.include,
    exclude: opts.exclude,
    excludeTypes: opts.excludeTypes
  };

  opts.compilers = opts.compilers || [];

  if (typeof opts.compilers['.json'] == 'undefined') {
    let jsonCompiler = require('./compilers/json.js');
    options.compilers[jsonCompiler.extname] = jsonCompiler;
  }

  if (opts.compilers) {
    opts.compilers.forEach(compilerModule => {
      let compilerFunction = require(compilerModule);
      options.compilers[compilerFunction.extname] = compilerFunction;
    });
  }

  let moduleIdentity = path.basename(entryScript);

  let bundle = BUNDLE_HEADER(moduleIdentity) +
    parseFile(entryScript, options) +
    BUNDLE_FOOTER(moduleIdentity);

  return bundle;
};

module.exports = enpaki;
