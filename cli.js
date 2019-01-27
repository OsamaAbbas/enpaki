#!/usr/bin/env node

const fs = require('fs');

const package = require('./package.json');
const enpaki = require('./enpaki.js');
const perf = require('./perf.js');

function readargv(argv = process.argv) {

  let program = {
    argv: argv.slice(0),
    args: [],
    flags: argv.filter(arg => arg[0] === '-'),
    read(...flags) {
      return flags.reduce((prev, current) => {
        return prev.concat(program[current]);
      }, []).filter(f => f);
    },
    readOne(...flags) {
      return this.read(...flags)[0];
    },
    hasFlag(...flags) {
      return flags.some(f => !!program[f]);
    }
  };

  let lastFlag;

  program.argv.slice(2).forEach(parameter => {

    if (program.flags.includes(parameter)) {
      lastFlag = parameter;
      program[lastFlag] = program[lastFlag] || [];
    } else {
      if (lastFlag) {
        program[lastFlag].push(parameter);
      } else {
        program.args.push(parameter);
      }
    }
  });

  return program;
}

let program = readargv();

if (program.hasFlag('--entry', '-e')) {

  let bundleStream = new enpaki(program.readOne('--entry', '-e'), {
    include: program.read('--include', '-i'),
    exclude: program.read('--exclude', '-x'),
    compilers: program.read('--compiler', '--compilers', '-c')
  });

  bundleStream.on('error', error => console.error(error));

  bundleStream.on('end', () => {
    if (bundleStream.errorsList.length) {
      console.error(bundleStream.errorsList.join('\n'));
    } else {
      if (program.hasFlag('--verbose')) {
        perf('bundled: OK');
        perf.dump();
      }
    }
  });

  if (program.hasFlag('--output', '--out', '-o')) {
    // wrtie the output file
    let outputStream = fs.createWriteStream(program.readOne('--output', '--out', '-o'));
    bundleStream.pipe(outputStream);
  } else {
    // or just send the bundle to stdout
    bundleStream.pipe(process.stdout);
  }
}

else if (program.hasFlag('--version', '-v')) {

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

 --verbose             Display detailed information about the operation.
 -h, --help            Display this information.
 -v, --version         Display version information.

 For bug reporting:
 <${package.bugs.url}>`);
}