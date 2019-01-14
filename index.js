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
  }

  let filetype = path.extname(filename);
  let code = '', childs = []; // childs is easier than children :)

  try {
    if (options.compilers[filetype] && options.compilers[filetype].call) {
      code = options.compilers[filetype](filename);
    } else {
      code = fs.readFileSync(filename, 'utf-8');
    }
  } catch (error) {
    console.log(filename);
    console.log(error);
    process.exit(1);
  }

  let moduleIdentity = path.relative(options.basedir, filename);

  code = FILE_HEADER(moduleIdentity) +
    (code
      .replace(/#!.*/, '') /* remove shebang characters */
      .replace(_parseFileFunction.REGEX_REQUIRE, (match, moduleName) => {

        let location;

        try {
          // location is where the module file is located,
          // so, 'fs' will be 'fs', because it's a core module,
          // and 'express' will be something like '/path/to/project/node_modules/express/lib/server.js',
          // and './lib/utils' will become '/path/to/project/lib/utils.js' ... etc
          location = locate(moduleName, path.dirname(filename));
        } catch (error) {
          console.log(moduleName);
          console.log(error);
          process.exit(1);
        }

        // so, we need every included module in our bundle to be called by its identity, which
        // would be relative to our basedir, instead of using its absolute path.
        let childIdentity = path.relative(options.basedir, location);

        if (!locate.isCore(location)) {
          // not core module, so it needs to be included.
          // TODO: I think here we should implement the `--exclude` flag.
          if (!_parseFileFunction.parsedFiles.includes(location)) {
            // not already parsed? so push it to childs array
            childs.push(location);

            if (childIdentity.includes('node_modules')) {
              // ... and if it lives inside 'node_modules' directory, we need to
              //     include its 'package.json' file too. I hope it's obvious why.
              let pkgFile = path.join(path.dirname(location), 'package.json');
              if (locate.stat(pkgFile).isFile()) {
                childs.push(pkgFile);
              }
            }
          }
        } else {
          // if it is a core module, like 'fs', revert it to its location, which is his name.
          childIdentity = location;
        }

        // now replace whatever you had with its new identity
        return `require('${childIdentity}')`;
      })) +
    FILE_FOOTER(moduleIdentity);

  _parseFileFunction.parsedFiles.push(filename);

  if (options.include.length) {

    // add include modules to the children that will be parsed soon
    childs = childs.concat(options.include.map(moduleName => {
      try {
        return locate(moduleName, path.dirname(filename));
      } catch (error) {
        console.log(moduleName);
        console.log(error);
        process.exit(1);
      }
    }));

    // empty the array, because the same `options` object will be given to
    // `parseFile` function, and we want these modules to be included once.
    options.include = [];
  }

  // TODO: it's better to change this to streams.
  childs.forEach(location => {
    if (!_parseFileFunction.parsedFiles.includes(location)) {
      code += _parseFileFunction(location, options);
    }
  });

  return code;
};

const enpaki = function (entryScript, opts = {}) {

  let options = {
    basedir: path.dirname(entryScript),
    compilers: {},
    include: opts.include,
    exclude: opts.exclude, /* TODO: this needs to be implemented */
    excludeTypes: opts.excludeTypes /* TODO: this too, and it needs to be there in cli.js */
  };

  opts.compilers = opts.compilers || [];

  if (typeof opts.compilers['.json'] == 'undefined') {
    let jsonCompiler = require('./compilers/json.js');
    options.compilers[jsonCompiler.extname] = jsonCompiler;
  }

  if (opts.compilers) {
    // TODO: we need to give the user the ability to provide his compilers
    //       I don't have a definite answer yet, but maybe we implement a flag
    //       called `--compiler` which accept the same format as `--include`.
    //       the compiler would be a module that is a function with this signature:
    //       `function (filename)`, and that returns code. it also must have an attribute
    //       called `extname`. see `./compilers/json.js` for a very simple implementation.

    // register each compiler with the `extname` that it defines.
    // compilerModule is a string, it can be something like `./typescript-compiler.json`
    // or any other format that `require` function understands.
    opts.compilers.forEach(compilerModule => {
      let compilerFunction = require(compilerModule);
      options.compilers[compilerFunction.extname] = compilerFunction;
    });
  }

  let moduleIdentity = path.basename(entryScript);

  // TODO: it's better to change this to streams.
  //       the current implementation consume more memory, because it
  //       reads all that bundle in memory until it returns it.
  let bundle = BUNDLE_HEADER(moduleIdentity) +
    parseFile(entryScript, options) +
    BUNDLE_FOOTER(moduleIdentity);

  return bundle;
};

module.exports = enpaki;
