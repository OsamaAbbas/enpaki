#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const enpaki = require('./index.js');

let args = process.argv.slice(2);

if (args.includes('-e')) {
  args[args.indexOf('-e')] = '--entry';
}

if (args.includes('-o')) {
  args[args.indexOf('-o')] = '--out';
}

if (args.includes('-i')) {
  args[args.indexOf('-i')] = '--include';
}

if (args.includes('-x')) {
  args[args.indexOf('-x')] = '--exclude';
}

if (args.includes('-h')) {
  args[args.indexOf('-h')] = '--help';
}

if (args.includes('-v')) {
  args[args.indexOf('-v')] = '--version';
}

const program = {

  flags: args.filter(arg => arg[0] === '-'),

  entryScript: (function () {

    let entryFlagIdx = args.indexOf('--entry');

    if (entryFlagIdx === -1) {
      return false;
    } else {
      return path.resolve(args[entryFlagIdx + 1]);
    }
  }()),

  outScript: (function () {

    let outFlagIdx = args.indexOf('--out');

    if (outFlagIdx === -1) {
      return false;
    } else {
      return path.resolve(args[outFlagIdx + 1]);
    }
  }()),

  include: (function () {

    let includeFlagIdx = args.indexOf('--include');

    let nextFlag = args.slice(includeFlagIdx + 1).filter(arg => arg[0] === '-')[0];
    let nextFlagIdx = nextFlag ? args.lastIndexOf(nextFlag) : Infinity;

    if (includeFlagIdx === -1) {
      return [];
    } else {
      return args.slice(includeFlagIdx + 1, nextFlagIdx);
    }
  }()),

  exclude: (function () {

    let excludeFlagIdx = args.indexOf('--exclude');

    let nextFlag = args.slice(excludeFlagIdx + 1).filter(arg => arg[0] === '-')[0];
    let nextFlagIdx = nextFlag ? args.lastIndexOf(nextFlag) : Infinity;

    if (excludeFlagIdx === -1) {
      return [];
    } else {
      return args.slice(excludeFlagIdx + 1, nextFlagIdx);
    }
  }())
};

if (program.entryScript) {

  let bundle = enpaki(program.entryScript, {
    include: program.include,
    exclude: program.exclude
  });

  if (program.outScript) {
    fs.writeFileSync(program.outScript, bundle, 'utf-8');
  } else {
    process.stdout.write(bundle);
  }
}

else if (program.flags.includes('--version')) {

  const package = require('./package.json');
  console.log(package.name, 'v' + package.version);
}

else {

  console.log(`
  Usage: enpaki --entry a.js [--include b.js] [--exclude c.js]

  Options:

    -e, --entry           the entry script of the bundle

    -i, --include         include these scripts into the bundle
    -x, --exclude         exclude these scripts from the bundle
                          
                          both include and exclude accept:
                              * a javascript file (for example: utils.js)
                              * a module name (for example: express, hapi, ... etc)
                              * a glob pattern (for example: node_modules/*)

    -h, --help            output usage information
    -v, --version         output enpaki version
`);

  // console.log("\n\n------\n\n");
  // console.log(program);
}
