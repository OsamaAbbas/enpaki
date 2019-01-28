'use strict';

/**
 * Returns a templated bundle header
 * @param {String} __entry_script__ The entry script
 * @return {String}
 */
exports.BUNDLE_HEADER = (__entry_script__) => `/** start of bundle */
;(function () {
var path = require('path');

var _enpakiModules = {};
var _enpakiCache = {};

const SYSTEM_ROOT = '/';

function isFile(filename) {
  return !!_enpakiModules[filename];
}

function locate(modulePath, directory = process.cwd()) {

  if (isCore(modulePath)) {
    return modulePath;
  }

  directory = path.resolve(directory);

  let candidateList = candidateFiles(path.join(directory, modulePath));

  if (!['.', path.sep].includes(modulePath[0])) {
    candidateList = candidateList.concat(makeFlat(nodeModulesFolders(modulePath, directory).map(candidateFiles)));
  }

  for (let filename of candidateList) {
    if (isFile(filename)) {
      return filename;
    }
  }

  throw new Error(\`Cannot find module '\${modulePath}' from '\${directory}'\`);
}

function isCore(modulePath) {
  try {
    return require.resolve(modulePath).indexOf(path.sep) === -1;
  } catch (error) {
    return false;
  }
}

function nodeModulesFolders(moduleName, directory) {

  if (['.', path.sep].includes(moduleName[0])) {
    throw new Error('module name must NOT start with "." nor "/"');
  }
  if (!path.isAbsolute(directory)) {
    throw new Error('directory must be absolute');
  }

  let list = [];

  while (directory !== SYSTEM_ROOT) {
    list.push(path.join(directory, 'node_modules', moduleName));
    directory = path.dirname(directory);
  }

  list.push(path.join(\`\${SYSTEM_ROOT}node_modules\`, moduleName));

  return list;
}

function candidateFiles(modulePath) {

  if (!path.isAbsolute(modulePath)) {
    throw new Error('module path must be absolute');
  }

  let extensions = Object.keys(require.extensions)
    .filter(ext => ext !== '.node');

  let asFileList = ['']
    .concat(extensions)
    .map(ext => path.join(modulePath + ext));

    let pkgMain = [];
    let pkgFile = path.join(modulePath, 'package.json');
  
    if (isFile(pkgFile)) {
      try {
        let pkg = __require('/', pkgFile);
        if (pkg.main) {
          pkgMain.push(path.join(modulePath, pkg.main));
        }
      } catch (error) { }
    }

  let asFolderList = extensions.map(ext => path.join(modulePath, 'index' + ext));

  return asFileList.concat(pkgMain).concat(asFolderList);
}

function makeFlat(arraysList) {
  return arraysList.reduce((a, b) => a.concat(b), []);
}

function __require(moduleParent, moduleName) {

  if (isCore(moduleName)) {
    return require(moduleName);
  }

  var basedir = path.dirname(moduleParent);

  if (moduleName.endsWith('/package.json')) {
    moduleName = path.join(basedir, moduleName);
  } else {
    try {
      moduleName = locate(moduleName, basedir);
    } catch (error) { }
  }

  if (_enpakiModules[moduleName] && _enpakiModules[moduleName].call) {
    if (!_enpakiCache[moduleName]) {
      _enpakiCache[moduleName] = {
        exports: {},
        loaded: false
      };
      if (moduleName === '${__entry_script__}' && typeof require === 'function') {
        require.main = _enpakiCache['${__entry_script__}'];
      } else {
        _enpakiCache[moduleName].parent = _enpakiCache[moduleParent];
      }
      _enpakiModules[moduleName].call(this, _enpakiCache[moduleName].exports, __require.bind(__require, moduleName), _enpakiCache[moduleName], _fix_filename(moduleName), _fix_dirname(moduleName));
      _enpakiCache[moduleName].loaded = true;
    }
    return _enpakiCache[moduleName].exports;
  } else {
    return require(moduleName);
  }
}

function _fix_filename(filename) {
  return path.resolve(__dirname, filename.slice(1));
};

function _fix_dirname(dirname) {
  return path.resolve(__dirname, dirname.slice(1), '/../');
};
`;

/**
 * Returns an enpaki bundled module
 * @param {String} __file__ The relative path to the module
 */
exports.FILE_HEADER = (__file__) => `
/** module: ${__file__} */
_enpakiModules['${__file__}'] = function (exports, require, module, __filename, __dirname) {
`;

exports.FILE_FOOTER = (__file__) => `
return module.exports;
}; /** end module: ${__file__} */
`;

/**
 * Closes the bundle
 * @param {String} __entry_script__ The entry script
 */
exports.BUNDLE_FOOTER = (__entry_script__) => `
if (typeof module === 'object') {
  module.exports = __require('/', '${__entry_script__}');
} else {
  return __require('/', '${__entry_script__}');
}
}());
/** end of bundle */
`;