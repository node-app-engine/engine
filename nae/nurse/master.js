/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var fs = require('fs');
var path = require('path');
var child = require('child_process');
var watch = require('os-ex');
var mkdirp = require('mkdirp');

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
  };
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

    _me._fdpath = path.normalize(path.join(_options.dirproc, app, 'fd'));
    mkdirp.sync(_me._fdpath);
    fs.watch(_me._fdpath, {
      'persistent' : true
    }, function (evt, filename) {
      // TODO: flush route.local
      console.log(evt, filename);
    });

    sub = child.fork(__dirname + '/runner.js', [app], {
    });

    sub.on('error', function (err) {
      sub = null;
    });

    sub.on('exit', function (code, signal) {
      cleanDirSyncSilent(_me._fdpath, new RegExp('_' + sub.pid + '.sock$'));
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
    });
  };

  _me.stop = function (signal) {
    if (!sub) {
      return;
    }

    if (_me._fdpath) {
      cleanDirSyncSilent(_me._fdpath, new RegExp('_' + sub.pid + '.sock$'));
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

