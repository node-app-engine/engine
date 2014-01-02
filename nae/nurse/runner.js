/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var SandBox = require('nae-sandbox');

var safeModules = {};
['fs', 'net'].forEach(function (i) {
  safeModules[i] = require('nae-' + i);
});

var safeGlobals = {};
['process'].forEach(function (i) {
  safeGlobals[i] = require('nae-' + i);
});

var injectModules = function (modules, options) {
  var $ = {};
  for (var i in modules) {
    $[i] = modules[i].create(options[i]);
  }

  return $;
};

var messageHandle = {};
messageHandle.run = function (options, sandbox) {
  var sbx = new SandBox(options.approot, {
    'disableModules' : ['child_process', 'vm'],
    'modules' : injectModules(safeModules, sandbox),
    'globals' : injectModules(safeGlobals, sandbox),
  });
  sbx.start();
};

(function run(options) {

  process.on('message', function (msg) {

    if (!msg || !msg.type || !msg._seq) {
      return;
    }

    if ('function' !== (typeof messageHandle[msg.type])) {
      return;
    }

    messageHandle[msg.type].apply(null, msg.data);
    process.send({
      'type' : 'ACK',
      '_seq' : msg._seq,
    });
  });
})();

