# Enpaki
A minimalist bundler for Node.js applications. enpaki `(en·pak·i ← pak·o)` means "to wrap up, to package, to pack" in Esperanto language.

## Install
```console
sudo npm install -g enpaki
```

## Usage Information

Enpaki is still a work in progress. More documentation and usage information will be added soon.

In most cases, it works without problems. There are a few cases that may cause issues (please help us by reporting them). However, in these cases, either enpaki will fail in the bundling process or the bundle script won't run. So, enpaki will not introduce new unexpected runtime errors, hopefully. See `examples/` for more information.

```$ enpaki --help
Usage: enpaki --entry script.js [--output bundle.js]

Options:

-e, --entry    <file>              The entry script of the bundle.
-o, --output   <file>              Write the output into <file>.
                                   If omitted, print the output to stdout.

-i, --include  <file1> <file2>     Include these scripts into the bundle.
-x, --exclude  <file1> <file2>     Exclude these scripts from the bundle.
-c, --compiler <file1> <file2>     Use these compilers.

  --include, --exclude and --compiler accept:
    * a javascript file            (for example: utils.js).
    * a module name                (for example: express, hapi, ... etc).
    * a glob pattern               (for example: node_modules/*).

-h, --help            Display this information.
-v, --version         Display version information.
```

## Acknowledgements
This tool is written from scratch, but it was inspired by [module-concat](https://github.com/bminer/module-concat) (by [Blake Miner](https://github.com/bminer)).