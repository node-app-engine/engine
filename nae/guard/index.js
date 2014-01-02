/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var config = require('configer');

(function run(root) {

  var run = require('pm').createWorker();
  run.on('suicide', function () {
  });
  run.ready();

})(__dirname + '/../../etc');
