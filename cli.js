#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const package = require('./package.json');
const enpaki = require('./enpaki.js');

let args = process.argv.slice(2);

// replace each short flag with its keyword
// so that we only check for the keyword later
if (args.includes('-e')) {
  args[args.indexOf('-e')] = '--entry';
}

if (args.includes('--compiler')) {
  args[args.indexOf('--compiler')] = '--compilers';
}

if (args.includes('-c')) {
  args[args.indexOf('-c')] = '--compilers';
}

if (args.includes('--out')) {
  args[args.indexOf('--out')] = '--output';
}

if (args.includes('-o')) {
  args[args.indexOf('-o')] = '--output';
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
      // get the argument that comes after `--entry` flag
      return path.resolve(args[entryFlagIdx + 1]);
    }
  }()),

  outScript: (function () {

    let outFlagIdx = args.indexOf('--output');

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
      // get everything between `--include` flag and the next flag
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
  }()),

  compilers: (function () {

    let compilersFlagIdx = args.indexOf('--compilers');

    let nextFlag = args.slice(compilersFlagIdx + 1).filter(arg => arg[0] === '-')[0];
    let nextFlagIdx = nextFlag ? args.lastIndexOf(nextFlag) : Infinity;

    if (compilersFlagIdx === -1) {
      return [];
    } else {
      return args.slice(compilersFlagIdx + 1, nextFlagIdx);
    }
  }())
};

if (program.entryScript) {

  let bundleStream = new enpaki(program.entryScript, {
    include: program.include,
    exclude: program.exclude,
    compilers: program.compilers
  });

  if (program.outScript) {
    // wrtie the output file
    let outputStream = fs.createWriteStream(program.outScript);
    bundleStream.pipe(outputStream);
  } else {
    // or just send the bundle to stdout
    bundleStream.pipe(process.stdout);
  }
}

else if (program.flags.includes('--version')) {

  console.log(package.name, 'v' + package.version);
}

else {

  console.log(`Usage: enpaki --entry script.js [--output bundle.js]

Options:

-e, --entry    <file>              The entry script of the bundle.
-o, --output   <file>              Write the output into <file>.

-i, --include  <file1> <file2>     Include these scripts into the bundle.
-x, --exclude  <file1> <file2>     Exclude these scripts from the bundle.
-c, --compiler <file1> <file2>     Use these compilers.

  --include, --exclude and --compiler accept:
    * a javascript file            (for example: utils.js).
    * a module name                (for example: express, hapi, ... etc).
    * a glob pattern               (for example: node_modules/*).

-h, --help            Display this information.
-v, --version         Display version information.

For bug reporting:
<${package.bugs.url}>
`);

  // console.log("\n\n------\n\n");
  // console.log(program);
}
