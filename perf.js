'use strict';

const benchmarkModule = {
  time: null,
  ltime: null,
  marks: [],
  start: () => {
    benchmarkModule.time = process.hrtime();
  },
  ms: (time) => {
    return (time[0] * 1e9 + time[1] / 1e6).toFixed(1);
  },
  log: (msg) => {
    benchmarkModule.marks.push({
      hrtime: benchmarkModule.ms(process.hrtime(benchmarkModule.time)),
      lhrtime: benchmarkModule.ltime == null ? 0 : benchmarkModule.ms(process.hrtime(benchmarkModule.ltime)),
      msg: msg
    });
    benchmarkModule.ltime = process.hrtime();
  },
  colours: {
    green: "\x1b[32m",
    orange: "\x1b[33m",
    white: "\x1b[37m",
  }
};

benchmarkModule.start();

const benchmark = (msg) => benchmarkModule.log(msg);

benchmark.dump = () => {

  benchmarkModule.marks.forEach(e => {

    let timeFmt = `${benchmarkModule.colours.green}[${e.hrtime}ms ${benchmarkModule.colours.orange}+${e.lhrtime}ms]`
    console.log(`${timeFmt.padEnd(25, ' ')} ${benchmarkModule.colours.white}${e.msg} `)
  });
};

module.exports = benchmark;