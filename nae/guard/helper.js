/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var fs = require('fs');
var path = require('path');

var fileset = exports.fileset = function (root, each, done) {

  var num = 0;
  each = ('function' === (typeof each)) ? each : function () {};
  done = ('function' === (typeof done)) ? done : function () {};
  fs.readdir(root, function (err, all) {
    if (err || !all || !all.length) {
      return;
    }

    all.forEach(function (i) {
      if ('.' === i.substring(0, 1)) {
        return;
      }
      var d = path.normalize(path.join(root, i));
      fs.stat(d, function (e, $) {
        if (!e && $) {
          if ($.isDirectory()) {
            fileset(d, each);
          } else {
            each(d);
          }
        }
      });
    });
  });
};

