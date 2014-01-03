/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var fs = require('fs');
var Emitter = require('events').EventEmitter;
var path = require('path');
var util = require('util');

var _instance = {};
exports.instance = function (filename) {
  filename = path.normalize(filename);
  if (!_instance[filename]) {
    _instance[filename] = new Queue(filename);
  }

  return _instance[filename];
};

var Queue = function (filename, append) {

  Emitter.call(this);

  var _fd = null;

  var _sq = 0;

  var next = function () {
    return [filename, (_sq++) % 10].join('.');
  };

  var _fn = next();

  var _self = this;
  this.push = function (row) {
    if (!_fd) {
      _fd = fs.createWriteStream(_fn, {
        'flags' : append ? 'a+' : 'w+',
        'encoding' : 'utf8',
        'mode' : 438,   /**<  0666  */
      });
      append = false;
      _fd.on('error', function (err) {
        _self.emit('error', err);
        _fd = null;
      });
      _fd.on('finish', function () {
        _self.emit('finish');
      });
    }
    _fd.write(String(row).trim() + '\n');
  };

  this.rotate = function () {
    if (!_fd) {
      return;
    }

    _fd.end(function () {
      _fd = null;
      _fn = next();
    });
  };
};
util.inherits(Queue, Emitter);

