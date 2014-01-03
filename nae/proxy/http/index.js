/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var fs = require('fs');
var Log = require('filelog');

var HTTP_STATUS_CODE = require('http').STATUS_CODES;
var HTTP_SORRY_TEXT = 'HTTP/1.1 {CODE} {TEXT}\r\n';
try {
  HTTP_SORRY_TEXT = fs.readFileSync(__dirname + '/sorry.txt', 'utf8');
} catch (e) {
}

var sorry = function (code, message) {
  var Map = {
    'CODE' : code,
    'TEXT' : HTTP_STATUS_CODE[code],
    'DATE' : new Date(),
    'HTML' : String(message || HTTP_STATUS_CODE[code] || ''),
  };

  return HTTP_SORRY_TEXT.replace(/\{(.+?)\}/g, function (i, w) {
    return Map[w] || w;
  });
};

var config = require('configer').create(
    __dirname + '/../../../etc/proxy.ini');

var helper = require(__dirname + '/helper.js');

/**
 * @ 本地域名
 */
var Names = {
  'localhost' : true,
  '127.0.0.1' : true,
};
String(config.get('http', {}).naeserver || '').split(',').forEach(function (x) {
  x = x.replace(/\s/, '');
  if (x.length) {
    Names[x] = true;
  }
});

var route = require(__dirname + '/../route.js').create(config.get('http'));
route.on('error', function (err) {
});

var proxy = require('tcproxy').createServer();
proxy.whenProxyError(function (error, socket) {
  socket.end(sorry(502));
});

proxy.setProxyHeader(function (client) {
  var s = JSON.stringify({
    'remoteAddress' : client.remoteAddress,
    'remotePort' : client.remotePort,
  });
  var b = new Buffer(10 + s.length);
  b.write('[NAE]:');
  b.writeUInt8(s.length, 6);
  b.write(s, 10);
  return b;
});

proxy.use(function (data, socket) {
  var $ = helper.parseAppNameAndRewriteHeader(data, Names);
  if (!$ || !$.app) {
    socket.end(sorry(400));
    return;
  }

  var req = route.get($.app);
  if (!req) {
    socket.end(sorry(404));
    return;
  }

  console.log(req);
  req.modifiedHeader = $.req;

  return req;
});

var app = require('pm').createWorker();
app.ready(function (socket, which) {
  proxy.server.emit('connection', socket);
});

app.on('suicide', function () {
  proxy.close();
});

