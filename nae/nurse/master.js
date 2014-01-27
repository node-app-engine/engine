/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var fs = require('fs');
var path = require('path');
var child = require('child_process');
var watch = require('os-ex');

var fsqueue = require(__dirname + '/fsqueue.js');

var cleanDirSyncSilent = function (dir, pattern) {
  try {
    fs.readdirSync(dir).forEach(function (sub) {
      if (!pattern.test(sub)) {
        return;
      }

      try {
        fs.unlinkSync(path.join(dir, sub));
      } catch (ex) {
      }
    });
  } catch (ex) {
  }
};

exports.create = function (options) {
  var _options = {
    'dirproc' : __dirname + '/../../run/proc',
    'fsqueue' : __dirname + '/../../run/route.local',
  };
  for (var i in options) {
    _options[i] = options[i];
  }

  var sub = null;

  var seq = 0;

  var que = fsqueue.instance(_options.fsqueue, true);

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

    sub.send({
      'type' : 'run',
      '_seq' : ++seq,
      'data' : [options, configs],
    });

    sub.on('message', function (msg) {
      if ('net' === msg.type) {
        que.write([app, sub.pid].concat(msg.data || []).join('\t'));
      }
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

