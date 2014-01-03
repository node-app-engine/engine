/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var appname = function (url, host, names) {

  var req = {
    'app' : host,
    'url' : url,
  };
  names = names || {};
  if (names[host]) {
    var tmp = url.match(/\w+/);
    if (tmp) {
      req = {
        'app' : tmp[0],
        'url' : url.substring(tmp.index + tmp[0].length) || '/',
      };
    }

    return req;
  }

  var p = -1;
  for (var i in names) {
    p = host.indexOf(i);
    if (p > 1 && p + i.length === host.length) {
      req.app = host.substring(0, p - 1);
    }
  }

  return req;
};

exports.parseAppNameAndRewriteHeader = function (data, names) {
  var txt = String(data);
  var tmp = txt.match(/(\w+)\s+(.+?)\s+HTTP\/(\S+)/);
  if (!tmp) {
    return;
  }

  var svr = txt.match(/[^\w]host\s*:\s*(.+?)\s/i);
  if (!svr) {
    return;
  }

  /**
   * XXX: 存在多字节问题，不能直接data.toString().replace..
   */
  var who = appname(tmp[2], svr[1].split(':').shift().toLowerCase(), names);
  if (who.url !== tmp[2]) {
    var $ = new Buffer(tmp[1] + ' ' + who.url + ' HTTP/' + tmp[3]);
    var _ = new Buffer($.length + data.length - tmp[0].length);
    $.copy(_);
    data.copy(_, $.length, tmp[0].length);
    data  = _;
  }

  return {
    'app' : who.app,
    'req' : data,
  };
};

