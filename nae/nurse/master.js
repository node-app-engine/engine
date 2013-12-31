/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var child = require('child_process');
var watch = require('os-ex');

exports.create = function (options) {
  var _options = {};
  for (var i in options) {
    _options[i] = options[i];
  }

  var sub = null;

  var seq = 0;

  var _me = {};

  _me.start = function (app, options, configs) {
    if (sub) {
      return;
    }

    sub = child.fork(__dirname + '/runner.js', [app], {
    });

    sub.on('error', function (err) {
      sub = null;
    });

    sub.on('exit', function (code, signal) {
      sub = null;
    });

    options = options || {};
    options.appname = app;

    var src = options.srcfile;
    delete options.srcfile;

    sub.send({
      'type' : 'run',
      '_seq' : ++seq,
      'data' : [src, options, configs],
    });

    sub.on('message', function (msg) {
    });
  };

  _me.stop = function (signal) {
    if (!sub) {
      return;
    }
    sub.kill(signal || 'SIGTERM');
  };

  _me.rusage = function () {
    if (!sub || !sub.pid) {
      return;
    }

    var res = watch.procstat(sub.pid);
    res['%cpu'] = watch.cpuusage(sub.pid);

    return res;
  };

  return _me;
};

