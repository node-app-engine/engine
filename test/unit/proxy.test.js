/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */
/* jshint immed: false */

"use strict";

var fs = require('fs');
var net = require('net');
var should = require('should');
var sproxy = require(__dirname + '/../../nae/nurse/proxy.js');

describe('super proxy interface', function () {

  var _FD = __dirname + '/proxy.socket';

  var clean = function () {
    fs.readdirSync(__dirname).forEach(function (fn) {
      if (/\.socket$/.test(fn)) {
        try {
          fs.unlinkSync(__dirname + '/' + fn);
        } catch (ex) {
        }
      }
    });
  };

  /* {{{ function before() */
  var fdfiles = [];
  var backend = [];
  before(function () {

    try {
      clean();
    } catch (ex) {
    }
    backend.push(net.createServer(function (req) {
      req.write('[HELLO]');
      req.pipe(req);
    }));

    backend.push(net.createServer(function (req) {
      req.write('[WORLD]');
      req.pipe(req);
    }));

    backend.forEach(function (s, i) {
      fdfiles[i] = __dirname + '/' + i + '.socket';
      s.listen(fdfiles[i]);
    });
  });
  /* }}} */

  /* {{{ funciton after() */
  after(function () {
    backend.forEach(function (s) {
      s.close();
    });
    backend = [];
    fdfiles = [];

    try {
      clean();
    } catch (ex) {
    }
  });
  /* }}} */

  /* {{{ should_simple_tcp_proxy_works_fine() */
  it('should_simple_tcp_proxy_works_fine', function (done) {
    var proxy = sproxy.createProxy();
    proxy.setErrorHandle(function (error, client) {
      client.end(error.stack);
    });

    proxy.setRouteHandle(function (buffer, socket) {
      buffer = buffer.toString();
      if (buffer.indexOf('hello') > -1) {
        return {
          'path' : fdfiles[0],
          'modifiedHeader' : 'I AM BEEN MODIFIED.',
        };
      }

      if (buffer.indexOf('world') > -1) {
        return {
          'path' : fdfiles[1],
        };
      }

      return {
        'path' : 'i/am/not/exists',
      };
    });

    proxy.listen(_FD, function (err) {
      should.ok(!err);

      var count = 3;
      var close = function () {
        if (0 === (--count)) {
          proxy.close();
          done();
        }
      };

      var c1 = net.createConnection(_FD, function () {
        c1.write('aa');
        c1.write('world');
        c1.on('data', function (data) {
          data.toString().should.include('[WORLD]');
          c1.end();
          close();
        });
      });

      var c2 = net.createConnection(_FD, function () {
        c2.write('hello');
        c2.on('data', function (data) {
          data.toString().should.include('[HELLO]I AM BEEN MODIFIED');
          c2.end();
          close();
        });
      });

      var c3 = net.createConnection(_FD, function () {
        this.write('test error');
        this.on('data', function (data) {
          data.toString().should.include('Error: connect ENOENT');
          close();
        });
      });
    });
  });
  /* }}} */

  it('should_set_proxy_header_works_fine', function (done) {
    var proxy = sproxy.createProxy();
    proxy.setErrorHandle(function (error, client) {
      client.end(error.stack);
    });

    proxy.setRouteHandle(function (buffer, socket) {
      return {
        'path' : fdfiles[1],
      };
    });

    /*
    proxy.setProxyHeader(function (client) {
      return ['{' + client.remoteAddress, client.remotePort + '}'].join(':');
    });
    */

    proxy.listen(0, function (err) {
      should.ok(!err);
      net.createConnection({
        'host' : '127.0.0.1',
        'port' : this.address().port,
      }, function (err) {
        this.write('hello');
        this.on('data', function (data) {
          String(data).should.eql('[WORLD]{127.0.0.1:' + this.localPort + '}hello');
          proxy.close();
          done();
        });
      });
    });
  });

});

