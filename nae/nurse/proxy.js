/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var net = require('net');

var ProxyServer = function (options) {

  this._options = {
    'allowHalfOpen' : false,
  };
  for (var i in options) {
    this._options[i] = options[i];
  }

  /**
   * @ 错误代理函数
   */
  this._errorHandle = function (err) {
  };

  /**
   * @ 路由函数
   */
  this._routeHandle = function (buf) {
  };

  this.server = net.createServer(this._options, function (socket) {
    var chunk = [];
    var which = this.address().port;
    socket.on('readable', function () {
      var buf;
      while (1) {
        buf = socket.read();
        if (!buf || !buf.length) {
          break;
        }
        chunk.push(buf);
      }

      // XXX: 
      //console.log(Buffer.concat(chunk) + '');
      if (0) {
        process.send({
          'type' : 'req',
          'port' : which,
        }, socket);
      }
    });
    /**
     * process.send({}, socket);
     */
  }); 
};

ProxyServer.prototype.setRouteHandle = function (fn) {
  if ('function' === (typeof fn)) {
    this._routeHandle = fn;
  }
};

ProxyServer.prototype.setErrorHandle = function (fn) {
  if ('function' === (typeof fn)) {
    this._errorHandle = fn;
  }
};

ProxyServer.prototype.listen = function () {
  this.server.listen.apply(this.server, arguments);
};

ProxyServer.prototype.close = function () {
  this.server.close.apply(this.server, arguments);
};

exports.createProxy = function (options) {
  return new ProxyServer(options);
};

