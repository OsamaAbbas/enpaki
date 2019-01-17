'use strict';

const mocha = require('mocha');
const assert = require('assert')

const enpaki = require('../');

describe('enpaki', () => {

  it('should throw error if entry script is null', () => {
    assert.throws(() => new enpaki(null, {}), 'entry script must be a typeof string, typeof null given');
  });

  it('should throw error if entry script is array', () => {
    assert.throws(() => new enpaki({}, {}), 'entry script must be a typeof string, typeof array given');
  });

  it('should initialise with the default compiler', () => {

    var bundler = new enpaki('./path/to');

    assert.equal(true, bundler.hasCompiler('.json'));
  });

  it('should add a new compiler and support new extension', () => {

    var bundler = new enpaki('./script'), invoked = false;

    var mockCompiler = {
      getSupportedExtensions() {
        return ['.php'];
      },
      compile(filename) {
        invoked = true;
      }
    };

    bundler.addCompiler(mockCompiler);

    assert.equal(bundler.hasCompiler('.json'), true);
    assert.equal(bundler.hasCompiler('.php'), true);
    assert.equal(Object.keys(bundler.compilers).length, 2);
  });
});
