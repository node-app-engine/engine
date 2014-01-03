/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var os = require('os-ex');
var fs = require('fs');
var util = require('util');
var Emitter = require('events').EventEmitter;

var __networkInterfaces = [];
(function refreshAddr() {
  var tmp = ['localhost'];
  var ifs = os.networkInterfaces();
  for (var i in ifs) {
    ifs[i].forEach(function (ips) {
      tmp.push(ips.address);
    });
  }

  __networkInterfaces = tmp;
  setTimeout(refreshAddr, 60000);
}) ();

/**
 * Function to normalize appname
 */
/* {{{ */
var normalize = function (app) {
  var s = '';
  var a = String(app).split('/');
  for (var i = 0; i < a.length; i++) {
    s = a[i].replace(/\s/, '');
    if (s.length > 0) {
      s = s.toLowerCase();
      break;
    }
  }

  return s;
};
/* }}} */

var Route = function (options) {

  Emitter.call(this);

  var _options = {
    'routefile' : __dirname + '/../../run/cache/route.conf',
    'reload' : 1000,
  };
  for (var i in options) {
    _options[i] = options[i];
  }

  /**
   * @ 路由表
   *
   * www.taobao.com : [127.0.0.1 /var/run/app1.32122.80]
   * \/path1
   */
  var _rtable = {};

  /**
   * @ 请求计数器
   */
  var _reqcnt = {};

  var _self = this;

  (function _Reload() {
    fs.readFile(_options.routefile, 'utf8', function (err, txt) {
      if (err) {
        _self.emit('error', err);
      } else {
        var _r1 = {};
        var _r2 = {};
        String(txt).split('\n').forEach(function (row) {
          row = row.trim();
          if (!row.length || ['#', ';', '!'].indexOf(row.substring(0, 1)) > -1) {
            return;
          }

          row = row.split('\t');
          if (!row || row.length < 3) {
            return;
          }

          var idx = normalize(row[0]);
          if (!_r1[idx]) {
            _r1[idx] = [];
            _r2[idx] = _reqcnt[idx] || 0;
          }

          var tmp = row[2].replace(/\s/, '');
          if (/^\d+$/.test(tmp)) {
            _r1[idx].push({
              'host' : row[1].replace(/\s/, ''),
              'port' : row[2].replace(/\s/, ''),
            });
          } /**<  XXX: 获取本地IP */ 
          else {
            _r1[idx].push({
              'path' : tmp,
            });
          }
        });
        _rtable = _r1;
        _reqcnt = _r2;
        _self.emit('reload');
      }
      setTimeout(_Reload, _options.reload);
    });
  })();

  this.get = function (app) {
    var idx = normalize(app);
    if (!_rtable[idx] || _rtable[idx].length < 1) {
      return;
    }

    return _rtable[idx][(_reqcnt[idx]++) % _rtable[idx].length];
  };
};
util.inherits(Route, Emitter);

exports.create = function (options) {
  return new Route(options);
};

