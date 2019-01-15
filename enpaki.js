'use strict';

const fs = require('fs');
const path = require('path');
const Readable = require('stream').Readable;

const locate = require('./locate.js');

const {
  BUNDLE_HEADER,
  BUNDLE_FOOTER,
  FILE_HEADER,
  FILE_FOOTER
} = require('./bundle-template.js');

class enpaki extends Readable {

  constructor(entryScript, opts = {}) {

    super(opts);

    this.basedir = path.dirname(entryScript);
    this.entryScriptIdentity = path.basename(entryScript);

    this.headerSent = false; // TODO: we may not need this
    this.parsedFiles = [];
    this.REGEX_REQUIRE = /require\s*\(\s*["']([^"']+)["']\)/g;

    this.compilers = {
      '.json': require('./compilers/json.js')
    };

    this.includeList = [entryScript]; // TODO: include locate and stat here.
    this.excludeList = [];

    if (Array.isArray(opts.compilers) && opts.compilers.length) {
      opts.compilers.forEach(filename => {
        this.addCompiler(filename);
      });
    }

    if (Array.isArray(opts.include) && opts.include.length) {
      opts.include.forEach(filename => {
        this.includeModule(filename);
      });
    }

    if (Array.isArray(opts.exclude) && opts.exclude.length) {
      opts.exclude.forEach(filename => {
        this.excludeModule(filename);
      });
    }

  } // constructor

  _read(size) {

    if (!this.headerSent) {
      let proceed = this.push(this.readBundleHeader());
      this.headerSent = true;
      if (!proceed) {
        return;
      }
    }

    while (this.includeList.length) {
      let fileContent = this.readFile(this.includeList.shift());
      let proceed = this.push(fileContent);
      if (!proceed) {
        return;
      }
    }

    this.push(this.readBundleFooter());

    this.push(null);

  } // _read

  addCompiler(filename) {

    try {
      let compilerFunction = require(locate(filename, this.basedir));
      this.compilers[compilerFunction.extname] = compilerFunction;
    } catch (error) {

      console.error(`can't add "${filename}" to compilers' list:`);
      console.error(error);
      process.exit(1);
    }

  } // addCompiler

  hasCompiler(extname) {

    return typeof (this.compilers[extname]) == 'function';

  } // hasCompiler

  compileOrRead(filename) {

    let extname = path.extname(filename);

    if (this.hasCompiler(extname)) {

      try {
        return this.compilers[extname](filename);
      } catch (error) {
        console.error(`can't compile "${filename}":`);
        console.error(error);
        process.exit(1);
      }

    } else {

      try {
        return fs.readFileSync(filename, 'utf-8');
      } catch (error) {
        console.error(`can't read "${filename}":`);
        console.error(error);
        process.exit(1);
      }
    }

  } // compileOrRead

  includeModule(filename) {

    try {
      let location = locate(filename, this.basedir);
      if (!this.includeList.includes(location)) {
        this.includeList.push(location);
      }
    } catch (error) {
      console.error(`can't add "${filename}" to the include list:`);
      console.error(error);
      process.exit(1);
    }

  } // includeModule

  excludeModule(filename) {

    try {
      let location = locate(filename, this.basedir);
      this.excludeList.push(location);
    } catch (error) {
      console.error(`can't add "${filename}" to the exclude list:`);
      console.error(error);
      process.exit(1);
    }

  } // excludeModule

  moduleIdentity(filename) {

    return path.relative(this.basedir, filename);

  } // moduleIdentity

  readBundleHeader() {

    return BUNDLE_HEADER(this.entryScriptIdentity);

  } // readBundleHeader

  readFile(filename) {

    let code = this.compileOrRead(filename);

    let moduleIdentity = this.moduleIdentity(filename);

    code = code.replace(/#!.*/, '')
      .replace(this.REGEX_REQUIRE, (match, moduleName) => {
        return this.parseCode(match, moduleName, filename);
      });

    this.parsedFiles.push(filename);

    return FILE_HEADER(moduleIdentity) + code + FILE_FOOTER(moduleIdentity);

  } // readFile

  readBundleFooter() {

    return BUNDLE_FOOTER(this.entryScriptIdentity);

  } // readBundleFooter

  parseCode(match, moduleName, parentModule) {

    if (locate.isCore(moduleName) || this.excludeList.includes(moduleName)) {
      return match;
    }

    let filename;

    try {
      filename = locate(moduleName, path.dirname(parentModule));
    } catch (error) {
      console.error(`can't locate "${moduleName}" (required by "${parentModule}"):`);
      console.log(error);
      process.exit(1);
    }

    let moduleIdentity = this.moduleIdentity(filename);

    if (this.excludeList.includes(filename)) {
      return `require('./${moduleIdentity}')`;
    }

    if (!this.parsedFiles.includes(filename)) {

      this.includeModule(filename);

      if (moduleIdentity.includes('node_modules')) {

        let pkgFile = path.join(path.dirname(filename), 'package.json');

        if (locate.stat(pkgFile).isFile()) {
          this.includeModule(pkgFile);
        }
      }
    }

    return `require('${moduleIdentity}')`;

  } // parseCode
}

module.exports = enpaki;