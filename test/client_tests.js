var handlers = {};
var socket = { sent: [], on: function(msg, fn) { handlers[msg] = fn; }, emit: function(msg) { this.sent.push(msg); } };
io = { connect: function() { return socket; } };

UI = { messages: [], init: function() { }, showMsg: function(msg) { this.messages.push(msg); } };

var assert = require('assert');
var c4 = require('../c4');

var before = function() {
    c4.Engine.init();
};

module.exports = {
    'client engine object is defined': function() {
        assert.isDefined(c4.Engine);
    },
    
    'engine initialization sets up the game': function() {
        before();
        assert.length(socket.sent, 1);
        assert.includes(socket.sent, 'available');
    },
    
    'on error show the message in the ui': function() {
        before();
        handlers.error({msg: 'error'});
        assert.length(UI.messages, 1);
        assert.includes(UI.messages, 'error');
    }
};
