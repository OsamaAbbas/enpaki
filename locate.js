'use strict';

const fs = require('fs');
const path = require('path');

const SYSTEM_ROOT = path.parse(process.cwd()).root;

function isFile(filename) {
  try {
    return fs.statSync(filename).isFile();
  } catch (error) {
    return false
  }
}

function loki(modulePath, directory = process.cwd()) {

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

  throw new Error(`Cannot find module '${modulePath}' from '${directory}'`);
}

function isCore(modulePath) {
  try {
    return require.resolve(modulePath).indexOf(path.sep) === -1;
  } catch (error) {
    return false;
  }
}

function nodeModulesFolders(modulePath, directory) {

  // modulePath must NOT start with '.' nor '/'
  // directory must be absolute

  let list = [];

  while (directory !== SYSTEM_ROOT) {
    list.push(path.join(directory, 'node_modules', modulePath));
    directory = path.dirname(directory);
  }

  list.push(path.join(`${SYSTEM_ROOT}node_modules`, modulePath));

  return list;
}

function candidateFiles(modulePath) {

  // modulePath must be absolute

  let extensions = Object.keys(require.extensions)
    .filter(ext => ext !== '.node');

  let asFileList = ['']
    .concat(extensions)
    .map(ext => path.join(modulePath + ext));

  let pkgMain = [];

  try {
    let pkg = require(path.join(modulePath, 'package.json'));
    if (pkg.main) {
      pkgMain.push(path.join(modulePath, pkg.main));
    }
  } catch (error) { }

  let asFolderList = extensions.map(ext => path.join(modulePath, 'index' + ext));

  return asFileList.concat(pkgMain).concat(asFolderList);
}

function makeFlat(arraysList) {
  return arraysList.reduce((a, b) => a.concat(b), []);
}

loki.isCore = isCore;
loki.isFile = isFile;

module.exports = loki;