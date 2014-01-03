/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var fs = require('fs');
var path = require('path');
var should = require('should');
var fsqueue = require(__dirname + '/../../nae/nurse/fsqueue.js');

describe('fsqueue interface', function () {

  it('should_basic_queue_works_fine', function (done) {

    var _me = fsqueue.instance(__dirname + '/data/fsqueue', false);
    _me.write(['+', 'a', 'bc '].join('\t'));
    _me.write([' -', 'a', 'b'].join('\t'));

    _me.rotate();
    _me.once('finish', function () {
      fs.readFile(_me._getLastFileName(), 'utf8', function (err, data) {
        data.should.eql(['+\ta\tbc', '-\ta\tb', ''].join('\n'));

        _me.once('finish', function () {
          fs.readFile(_me._getLastFileName(), 'utf8', function (err, data) {
            data.should.eql('another file\n');
            done();
          });
        });

        _me.write('another file');
        _me.rotate();
      });
    });
  });

});

