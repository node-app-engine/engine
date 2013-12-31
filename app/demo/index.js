/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var http = require('http');

http.createServer(function (req, res) {
  res.end(req.url);
}).listen(0, function () {
  console.log('server listened at %d', this.address().port);
});

