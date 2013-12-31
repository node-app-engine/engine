/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var config = require('configer');
var Master = require(__dirname + '/master.js');

/* {{{ private function objectReplace() */
var objectReplace = function (src, pattern, map) {
  for (var i in src) {
    if ('object' === (typeof src[i])) {
      src[i] = objectReplace(src[i], pattern, map);
    } else if ('string' === (typeof src[i])) {
      src[i] = src[i].replace(pattern, function (k, w) {
        return map[w] || k;
      });
    }
  }

  return src;
};
/* }}} */

(function run(root) {

  /**
   * @ 管理的app列表
   */
  var APP = {};
  var _me = config.create(root + '/nurse.ini');
  var cfg = config.create(_me.get('applist'), _me.get('reload') || 1000);

  var sbx = config.create(root + '/sandbox.ini')._getAll();

  var _Reload = function () {
    var DEF = cfg.find('app');
    Object.keys(APP).forEach(function (idx) {
      if (DEF[idx]) {
        delete DEF[idx];
        return;
      }

      APP[idx].stop('SIGTERM');
      delete APP[idx];
    });

    Object.keys(DEF).forEach(function (idx) {
      DEF[idx].appname = idx;
      APP[idx] = Master.create();
      APP[idx].start(idx, DEF[idx], objectReplace(sbx, /\{(.+?)\}/g, DEF[idx]));
    });
  };

  setInterval(function () {
    for (var i in APP) {
      console.log(APP[i].rusage());
    }
  }, 60000);

  cfg.on('reload', _Reload);

  /**
   * this nurse process is ready
   */
  var run = require('pm').createWorker();
  run.on('suicide', function () {
    for (var i in APP) {
      APP[i].stop('SIGKILL');
    }
  });
  run.ready();

})(__dirname + '/../../etc');

