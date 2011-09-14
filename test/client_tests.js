io = {};
var assert = require('assert');
var c4 = require('../c4');
module.exports = {
    'test working': function() {
        assert.isNotNull(c4.UI);
    }
};
