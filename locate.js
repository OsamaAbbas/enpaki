'use strict';

const fs = require('fs');
const path = require('path');

const isCore = function (moduleName) {
  try {
    return require.resolve(moduleName).indexOf(path.sep) === -1;
  } catch (error) {
    return false;
  }
};

const stat = function (filename) {
  try {
    return fs.statSync(filename);
  } catch (error) {
    return {
      isFile: _ => false
    };
  }
};

/**
 * this function implements `require.resolve` logic
 * for more informaion: https://nodejs.org/api/modules.html#modules_all_together
 */
const locate = function (moduleName, basedir) {

  //  1. If X is a core module,
  //    a. return the core module
  //    b. STOP
  if (isCore(moduleName)) {
    return moduleName;
  }

  basedir = basedir || '.';

  //  2. If X begins with '/'
  //    a. set Y to be the filesystem root
  if (moduleName[0] == '/') {
    basedir = path.parse(process.cwd()).root;
  }

  //  3. If X begins with './' or '/' or '../'
  //    a. LOAD_AS_FILE(Y + X)
  if (moduleName.startsWith('./') || moduleName.startsWith('/') || moduleName.startsWith('../')) {

    var result = loadFile(path.resolve(basedir, moduleName));

    if (result) {
      return result;
    }
  }

  //    b. LOAD_AS_DIRECTORY(Y + X)
  if (['.', './', '/', '../'].includes(moduleName.slice(0, 2))) {

    var result = loadDirectory(path.resolve(basedir, moduleName));

    if (result) {
      return result;
    }
  }

  //  4. LOAD_NODE_MODULES(X, dirname(Y))
  var result = loadNodeModules(moduleName, basedir);

  if (result) {
    return result;
  }

  //  5. THROW "not found"
  throw new Error(`Cannot find module '${moduleName}' from '${basedir}'`);
};

//  LOAD_AS_FILE(X)
//    1. If X is a file, load X as JavaScript text.  STOP
//    2. If X.js is a file, load X.js as JavaScript text.  STOP
//    3. If X.json is a file, parse X.json to a JavaScript Object.  STOP
//    4. If X.node is a file, load X.node as binary addon.  STOP
const loadFile = (x) => {

  return ['']
    .concat(Object.keys(require.extensions))
    .filter(ext => ext !== '.node')
    .map(ext => path.resolve(x + ext))
    .filter(file => stat(file).isFile())[0] || false;
};

//  LOAD_INDEX(X)
//    1. If X/index.js is a file, load X/index.js as JavaScript text.  STOP
//    2. If X/index.json is a file, parse X/index.json to a JavaScript object. STOP
//    3. If X/index.node is a file, load X/index.node as binary addon.  STOP
const loadIndex = (x) => {

  return loadFile(path.join(x, 'index'));
};

//  LOAD_AS_DIRECTORY(X)
//    1. If X/package.json is a file,
//      a. Parse X/package.json, and look for "main" field.
//      b. let M = X + (json main field)
//      c. LOAD_AS_FILE(M)
//      d. LOAD_INDEX(M)
//    2. LOAD_INDEX(X)
const loadDirectory = (x) => {

  let pkgFile = path.join(x, 'package.json');

  try {
    let pkg = require(pkgFile);
    let main = path.join(x, pkg.main);

    return [loadFile(main), loadIndex(main), loadIndex(x)]
      .filter(_ => !!_)[0] || false;
  } catch (error) {
    return loadIndex(x);
  }
};

//  LOAD_NODE_MODULES(X, START)
//    1. let DIRS = NODE_MODULES_PATHS(START)
//    2. for each DIR in DIRS:
//      a. LOAD_AS_FILE(DIR/X)
//      b. LOAD_AS_DIRECTORY(DIR/X)
const loadNodeModules = (x, start) => {

  let directories = nodeModulesPaths(start);

  return directories
    .map(directory => [loadFile(path.join(directory, x)), loadDirectory(path.join(directory, x))])
    .reduce( (list, item) => list.concat(item), [] )
    .filter(_ => !!_)[0] || false;
};

//  NODE_MODULES_PATHS(START)
//    1. let PARTS = path split(START)
//    2. let I = count of PARTS - 1
//    3. let DIRS = [GLOBAL_FOLDERS]
//    4. while I >= 0,
//      a. if PARTS[I] = "node_modules" CONTINUE
//      b. DIR = path join(PARTS[0 .. I] + "node_modules")
//      c. DIRS = DIRS + DIR
//      d. let I = I - 1
//    5. return DIRS
const nodeModulesPaths = (start) => {

  return start
    .split(path.sep)
    .map( (_, i, parts) => parts.slice(0, i + 1).join(path.sep) + '/node_modules' )
    .reverse();
};

locate.isCore = isCore;
locate.stat = stat;

module.exports = locate;
