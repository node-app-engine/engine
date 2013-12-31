/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var fs = require('fs');
var util = require('util');
var Builder = require('build4js');
var Path    = require('path');

var Home    = __dirname;

var _props  = Home + '/default.properties';
if (process.argv.length > 2) {
  _props  = Path.normalize(process.argv[2]);
}

if (!(fs.existsSync || Path.existsSync)(_props)) {
  console.log('Property file (' + _props + ') not found.');
  process.exit(1);
}

var _me = Builder.create(_props, Home);
Builder.fileset(Home + '/build/tpl', /\.(ini|txt)$/, function (fn) {
  var f = _me.compile(fn.full, 'etc/' + fn.base, {
    'dir.root' : Home
  });

  Builder.syntax(f).forEach(function (k) {
    throw new Error('Found undefined token "' + k + '" in "' + f + '"');
  });

  fn.setmode(384, f);     /**<  0600  */
});

var log = require('filelog').create({
  'file' : _me.get('log.root', Home + '/log') + '/master.log',
});

var cfg = require('configer').create(Home + '/etc/master.ini');
var app = require('pm').createMaster(cfg.get('master', {
  'pidfile' : Home + '/run/mosad.pid',
}));

app.on('giveup', function (name, n, p) {
  log.warn(util.format('max fatals reached (%d), give up to fork: name=%s pause=%d', n, name, p));
});

app.on('signal', function (signal, name) {
  log.notice(util.format('Got signal (%d) as %s', signal, name));
});

app.on('fork', function (name, pid) {
  log.notice(util.format('new worker forked: name=%s pid=%d', name, pid));
});

app.on('quit', function (name, pid, code, signal) {
  log.notice(util.format('child quit: name=%s pid=%d code=%d signal=%s', name, pid, code, signal));
});

var workers = cfg.find('worker');
var args;
for (var group in workers) {
  if (group && workers[group].script) {
    args = [group, workers[group].script, workers[group]];
    if (workers[group].argument) {
      // ToDo: 多个参数和引号的处理
      args.push([workers[group].argument]);
    }
    app.register.apply(app, args);
  }
}

app.dispatch();

