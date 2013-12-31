/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var SandBox = require('nae-sandbox');

var safeModules = {};
['fs', 'net'].forEach(function (i) {
  safeModules[i] = require('nae-' + i);
});

var messageHandle = {};
messageHandle.run = function () {
  console.log(arguments);
  return;
  var sbx = new SandBox('', {
    'disableModules' : ['child_process', 'vm'],
    'modules' : {
    }
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

