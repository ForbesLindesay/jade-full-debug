'use strict';

var $ = document.getElementById.bind(document);
var util = require('util');
var unescape = require('unescape-html');
var json = require('json-literal');
var ObjectExplorer = require('object-explorer')
var data = json.parse(unescape($('data').innerHTML));

console.dir(data)

var step = 0;
var state = undefined;

$('forward').addEventListener('click', function () {
  step++;
  render();
});
$('backward').addEventListener('click', function () {
  step--;
  render();
});
render();

function render() {
  if (step === 0) {
    $('backward').setAttribute('disabled');
  } else {
    $('backward').removeAttribute('disabled');
  }
  if (step === data.steps.length - 1) {
    $('forward').setAttribute('disabled');
  } else {
    $('forward').removeAttribute('disabled');
  }
  renderTokens();
  renderAST();
}

function renderTokens() {
  var buf = [];
  for (var i = 0; i < data.tok.length; i++) {
    buf.push('<div class="token')
    if (i === data.steps[step].tok) {
      buf.push(' active');
    }
    buf.push('">' + data.tok[i].line + ': ' + data.tok[i].type);
    if (data.tok[i].val !== undefined) {
      buf.push(' (' + util.inspect(data.tok[i].val) + ')')
    }
    buf.push('</div>');
  }
  $('tokens').innerHTML = buf.join('');
}
function renderAST() {
  $('ast').innerHTML = '';
  var eid = data.steps[step].exp;
  var oe = new ObjectExplorer(data.ast, state);
  oe.getNodeForObject = function (obj, path) {
    if (typeof obj.id === 'number') {
      var state;
      if (obj.id === eid) {
        state = 'current';
      } else if (obj.id > eid) {
        state = 'future';
      } else {
        state = 'past';
      }
      var res = ObjectExplorer.prototype.getNodeForObject.call(this, obj, path)
      res.classList.add(state);
      return res
    }
    return ObjectExplorer.prototype.getNodeForObject.call(this, obj, path)
  }
  oe.isExpanded = function (path) {
    if (this.state.isExpanded(path) !== undefined)
      return this.state.isExpanded(path)
    else
      return path[path.length - 1] === 'nodes' ||
             path[path.length - 1] === 'block'
  }
  oe.appendTo($('ast'));
  state = oe.state;
}

