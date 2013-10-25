'use strict';

var fs = require('fs');
var path = require('path');
var json = require('json-literal');
var express = require('express');
var browserify = require('browserify-middleware');
var jade;
try {
  jade = require('./lib/jade.js');
} catch (ex) {
  jade = require('jade');
}


function generateDebugging(source, options) {
  var tokens = [];
  var expressionID = 0;
  var root = null;
  var events = [{
    type: 'exp',
    index: 0
  }];

  options = options || {};
  options.compileDebug = false;
  options.debug = false;
  options['$jade-full-debug'] = {
    token: function (tok) {
      events.push({
        type: 'tok',
        index: tokens.length
      });
      tokens.push(tok);
    }, expression: function () {
      var id = expressionID++;
      events.push({
        type: 'exp',
        index: id
      });
      return id;
    }, ast: function (ast) {
      root = ast;
    }
  };

  jade.render(source, options);

  var state = {
    tok: 0,
    exp: 0
  }
  var steps = [state].concat(events.filter(function (e) {
    return e.index > 0;
  }).map(function (e) {
    state = JSON.parse(JSON.stringify(state));
    state[e.type] = e.index;
    return state;
  }))

  return {
    tok: tokens,
    ast: root,
    steps: steps
  };
}

function renderDebugData(data) {
  return jade.renderFile(__dirname + '/template.jade', {
    data: json.stringify(data)
  })
}


var app = express();

app.get('/client.js', browserify('./client.js'));
app.use(express.directory(process.cwd()));
app.get('/*', function (req, res, next) {
  var p = path.join(process.cwd(), req.path);
  var src;
  try {
    src = fs.readFileSync(p, 'utf8');
  } catch (ex) {
    if (ex.code !== 'ENOENT') throw ex;
    return next();
  }
  res.send(renderDebugData(generateDebugging(src, {
    filename: p
  })));
});


app.listen(3000);
