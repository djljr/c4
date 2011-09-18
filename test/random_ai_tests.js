var ai = require('../random_ai');
var assert = require('assert');

module.exports = {
    'AI will win if it can': function() {
        var state = {board: [[0,1,1,1],[0,0,0,0]], currentTurn: 1};
        assert.eql(0, ai.move(state));
    },
    
    'AI will block a win if it can': function() {
        var state = {board: [[0,0,0,0],[0,1,1,1]], currentTurn: 2};
        assert.eql(1, ai.move(state));
    },
    
    'AI will win over blocking a win': function() {
        var state = {board: [[0,1,1,1],[0,2,2,2]], currentTurn: 2};
        assert.eql(1, ai.move(state));
    },
    
    'AI will choose some legal square when there are no wins on the board and only one legal move': function() {
        var state = {board: [[1,2,1,2],[0,0,2,1]], currentTurn: 2};
        assert.eql(1, ai.move(state));
    },
    
    'AI will choose some legal square when there are no wins on the board with many legal moves': function() {
        var state = {board: [[1,2,1,2],[0,0,2,1],[0,1,1,2]], currentTurn: 2};
        assert.includes([2,3], ai.move(state));
    },
}
