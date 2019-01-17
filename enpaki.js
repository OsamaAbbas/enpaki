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

/**
 * @typedef Compiler
 * @function getSupportedExtensions Returns the supported extensions of this compiler
 * @function compile Invokes the compiler
 */

/**
 * @typedef {String} EnpakiFile An absolute or relative (to the project) path to a module
 */

/**
 * @typedef StreamOptions Options to be passed to the stream
 * @prop {String} flags Default: 'r'.
 * @prop {String} encoding Default: 'null'.
 * @prop {Integer} fd The file descriptor id
 * @prop {Integer} mode 0o666
 * @prop {Boolean} autoClose
 * @prop {Integer} start 
 * @prop {Integer} end
 * @prop {Integer} highWaterMark
 */

/**
 * @typedef EnpakiBundlerOptions 
 * @prop {StreamOptions} stream Options to pass to the underlying stream
 * @prop {String} 
 */

module.exports = class Enpaki extends Readable {

  /**
   * Creates the enpaki bundler
   * @param {String} entryScript An absolute or relative path to the primary script
   * @param {EnpakiBundlerOptions} opts Options
   */
  constructor(entryScript, opts = {}) {
    if (typeof entryScript !== 'string' || entryScript.length == 0) {
      throw new Error(`entry script must be a typeof string, typeof ${typeof entryScript} given`)
    }

    //SB: extracted into a stream object for easier implementation and seperation of enpaki options.
    super(opts.stream || {});

    this.basedir = path.dirname(entryScript);
    this.entryScriptIdentity = path.basename(entryScript);

    this.parsedFiles = [];
    this.REGEX_REQUIRE = /require\s*\(\s*["']([^"']+)["']\)/g;
    this.compilers = [];

    //prebuilt compliers which are packed with enpaki
    this.addCompiler({
      getSupportedExtensions() {
        return ['json'];
      },
      compile(filename) {
        let src = fs.readFileSync(filename, 'utf-8');
        return `module.exports = ${src};`;
      }
    });

    this.includeList = [entryScript]; // TODO: include locate and stat here.
    this.excludeList = [];

    if (Array.isArray(opts.compilers) && opts.compilers.length) {
      opts.compilers.forEach(comp => this.addCompiler(comp));
    }

    if (Array.isArray(opts.include) && opts.include.length) {
      opts.include.forEach(filename => this.includeModule(path.resolve(filename)));
    }

    if (Array.isArray(opts.exclude) && opts.exclude.length) {
      opts.exclude.forEach(filename => this.excludeModule(filename));
    }
  }


  /**
   * Overriding stream interface for merging modules into a single stream
   */
  _read() {

    let proceed = this.push(BUNDLE_HEADER(this.entryScriptIdentity));
    if (!proceed) {
      return;
    }

    while (this.includeList.length) {
      //remove it to ensure we don't repeat files
      let fileContent = this.readFile(this.includeList.shift());
      let proceed = this.push(fileContent);
      if (!proceed) {
        return;
      }
    }

    this.push(BUNDLE_FOOTER(this.entryScriptIdentity));

    this.push(null);
  }

  /**
   * Adds a compiler to the bundler
   * @param {Compiler} compiler The compiler interface to add to the bundler
   * @return {void}
   */
  addCompiler(compiler) {
    if ((typeof compiler.getSupportedExtensions === 'function') == false) {
      throw new Error("Compiler object doesn't implement getSupportedExtensions method")
    }

    var supportExtensions = compiler.getSupportedExtensions()
    supportExtensions.forEach((extension) => this.compilers[extension] = compiler)
  }

  /**
   * Returns whether the bundler supports a file extension
   * @param {String} extname The extension name
   */
  hasCompiler(extname) {
    return typeof (this.compilers[extname]) === 'object';
  }

  /**
   * Returns the compiler registered against the extension, if the compiler 
   * doesn't exist it returns a generic compiler which simply reads the file to a string
   * @param {String} extension The extension type
   * @return {String}
   */
  getCompiler(extension) {
    return this.compilers[extension] || {
      compile: (filename) => {
        return fs.readFileSync(filename, 'utf-8');
      },
      getSupportedExtensions() {
        return ['*'];
      }
    }
  }

  /**
   * Applys the compile function of the relevant compiler to the file
   * If the enpaki bundler has no compilers, it will simply read the file into a string and 
   * return the contents
   * @param {EnpakiFile} filename The filename to compile
   * @return {String} The compiled result of the file
   */
  compile(filename) {
    return this.getCompiler(path.extname(filename)).compile(filename)
  }

  /**
   * Adds a module to the includes list of the Enpaki bundler
   * @param {EnpakiFile} filename The filename of module
   */
  includeModule(filename) {
    if (!this.includeList.includes(filename)) {
      this.includeList.push(filename);
    }
  }


  /**
   * Excludes a module in the Enpaki bundler
   * @param {EnpakiFile} filename The filename of module
   */
  excludeModule(filename) {
    try {
      let location = locate(filename, this.basedir);
      this.excludeList.push(location);
    } catch (error) {
      this.excludeList.push(filename);
    }
  }

  /**
   * Returns the relative path of a module based on the filename and relativity of the working directory.
   * @param {EnpakiFile} filename The filename to obtain the identity of a module
   */
  moduleIdentity(filename) {
    return path.relative(this.basedir, filename);
  }

  /**
   * @private
   * 
   * Reads a module into the bundler and bundles it
   * @param {EnpakiFile} filename The filename to read and add into the bundle
   * @return {String} The bundled module
   */
  readFile(filename) {
    let code = this.compile(filename);
    let moduleIdentity = this.moduleIdentity(filename);

    code = code
      .replace(/#!.*/, '')
      .replace(this.REGEX_REQUIRE, (match, moduleName) => this.requireModule(match, moduleName, filename));

    this.parsedFiles.push(filename);
    return FILE_HEADER(moduleIdentity) + code + FILE_FOOTER(moduleIdentity);
  }

  /**
   * @private
   * 
   * Returns a string which encompasses the requiring of a module
   * 
   * @OB please add some more information here
   * 
   * @param {String} match The matching string of the require
   * @param {String} moduleName The module name to register
   * @param {String} parentModule The parent module
   * @return {String}
   */
  requireModule(match, moduleName, parentModule) {
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
        // FIXME: I guess this will fail if package.json is not in the same directory as filename
      }
    }
    return `require('${moduleIdentity}')`;
  }
}