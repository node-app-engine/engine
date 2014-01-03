/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var fs = require('fs');
var path = require('path');
var should = require('should');

var Helper = require(__dirname + '/../../nae/guard/helper.js');

describe('guard helper interface', function () {

  it('should_scan_fileset_fine', function (done) {
    Helper.fileset('/i/am/not/exists', function (fn) {
      (true).should.eql(false);
    });

    var all = [];
    Helper.fileset(__dirname + '/data/proc', function (fn) {
      var src = path.normalize(__dirname + '/data/proc');
      all.push(fn.substring(src.length + 1));
    });

    setTimeout(function () {
      done();
    }, 100);
  });

});

