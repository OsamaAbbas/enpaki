# enpaki
A minimalist bundler for Node.js applications.

## Install
```console
sudo npm install -g enpaki
```

## Usage Information
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
