'use strict';

exports.BUNDLE_HEADER = (__entry_script__) => `/** start of bundle */
;(function () {
var path = require('path');

var _enpakiModules = {};
var _enpakiCache = {};
var _isCached = {};

var isCore = function (moduleName) {
  try {
    return require.resolve(moduleName).indexOf(path.sep) === -1;
  } catch (error) {
    return false;
  }
};

var stat = function (filename) {
  filename = path.relative(__dirname, filename);
  return {
    isFile: _ => !!_enpakiModules[filename]
  };
};

var locate = function (moduleName, basedir) {
  basedir = basedir || '.';
  if (moduleName[0] == '/') {
    basedir = path.parse(process.cwd()).root;
  }
  if (isCore(moduleName)) {
    return moduleName;
  }
  if (moduleName.startsWith('./') || moduleName.startsWith('/') || moduleName.startsWith('../')) {
    var result = loadFile(path.resolve(basedir, moduleName));
    if (result) {
      return result;
    }
  }
  if (['.', './', '/', '../'].includes(moduleName.slice(0, 2))) {
    var result = loadDirectory(path.resolve(basedir, moduleName));
    if (result) {
      return result;
    }
  }
  var result = loadNodeModules(moduleName, basedir);
  if (result) {
    return result;
  }
  throw new Error(\`Cannot find module '\${moduleName}'\`);
};

var loadFile = (x) => {
  return ['']
    .concat(Object.keys(require.extensions))
    .filter(ext => ext !== '.node')
    .map(ext => path.resolve(x + ext))
    .filter(file => stat(file).isFile())[0] || false;
};

var loadIndex = (x) => {
  return loadFile(path.join(x, 'index'));
};

var loadDirectory = (x) => {
  var pkgFile = path.join(x, 'package.json');
  try {
    var pkg = require(pkgFile);
    var main = path.join(x, pkg.main);
    return [loadFile(main), loadIndex(main), loadIndex(x)]
      .filter(_ => !!_)[0] || false;
  } catch (error) {
    return loadIndex(x);
  }
};

var loadNodeModules = (x, start) => {
  var directories = nodeModulesPaths(start);
  return directories
    .map(directory => path.relative(__dirname, directory))
    .map(directory => [loadFile(path.join(directory, x)), loadDirectory(path.join(directory, x))])
    .reduce( (list, item) => list.concat(item), [] )
    .filter(_ => !!_)[0] || false;
};

var nodeModulesPaths = (start) => {
  return start
    .split(path.sep)
    .map( (_, i, parts) => parts.slice(0, i + 1).join(path.sep) + '/node_modules' )
    .reverse();
};

var __dynamic_require = function (moduleParent, moduleName) {
  var basedir = path.dirname( path.resolve(moduleParent) );
  var location = locate(moduleName, basedir);
  return __require(moduleParent, path.relative( __dirname, location ), true);
};

var __require = function (moduleParent, moduleName, skipDynamic) {
  if (isCore(moduleName)) {
    return require(moduleName);
  }
  if (_enpakiModules[moduleName] && _enpakiModules[moduleName].call) {
    if (!_isCached[moduleName]) {
      _enpakiCache[moduleName] = {
        exports: {},
        loaded: false
      };
      _isCached[moduleName] = true;
      if (moduleName === '${__entry_script__}' && typeof require === 'function') {
        require.main = _enpakiCache['${__entry_script__}'];
      } else {
        _enpakiCache[moduleName].parent = _enpakiCache[moduleParent];
      }
      _enpakiModules[moduleName].call(this, _enpakiCache[moduleName].exports, __require.bind(__require, moduleName), _enpakiCache[moduleName], __filename_fix(moduleName), __dirname_fix(moduleName));
      _enpakiCache[moduleName].loaded = true;
    }
    return _enpakiCache[moduleName].exports;
  } else {
    try {
      if (skipDynamic) {
        return require(moduleName);
      } else {
        return __dynamic_require(moduleParent, moduleName);
      }
    } catch (error) {
      console.log("\\n");
      console.error(error.message);
      process.exit(1);
    }
  }
};

var __filename_fix = function (filename) {
  return require('path').resolve(__dirname, filename);
};

var __dirname_fix = function (dirname) {
  return require('path').resolve(__dirname, dirname, '/../');
};
`;

exports.FILE_HEADER = (__file__) => `
/** module: ${__file__} */
_enpakiModules['${__file__}'] = function (exports, require, module, __filename, __dirname) {
`;

exports.FILE_FOOTER = (__file__) => `
return module.exports;
}; /** end module: ${__file__} */
`;

exports.BUNDLE_FOOTER = (__entry_script__) => `
if (typeof module === 'object') {
  module.exports = __require(null, '${__entry_script__}');
} else {
  return __require(null, '${__entry_script__}');
}
}());
/** end of bunble */
`;