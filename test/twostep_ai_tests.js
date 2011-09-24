var ai = require('../ais/twostep_ai');

var assert = require('assert');

module.exports = {
    'checkMovesForWin with on empty board returns no moves': function() {
	    var state = {board: [[0,0,0,0],[0,0,0,0]], currentTurn: 1};
	    assert.eql([], ai.moveDetail.checkMovesForWin(state));
    },

    'checkMovesForWin with a full board returns no moves': function() {
	    var state = {board: [[1,2,1,2],[1,2,1,2]], currentTurn: 1};
	    assert.eql([], ai.moveDetail.checkMovesForWin(state));    
    },
    
    'checkMovesForWin with no possible win returns no moves': function() {
   	    var state = {board: [[1,2,0,0],[2,1,0,0]], currentTurn: 1};
	    assert.eql([], ai.moveDetail.checkMovesForWin(state));
    },
    
    'checkMovesForWin with a winning move returns that position': function() {
	    var state = {board: [[0,1,1,1],[0,0,2,1]], currentTurn: 1};
	    assert.eql([0], ai.moveDetail.checkMovesForWin(state));        
    },
    
    'bestMove when we have a win is the winning move': function() {
	    var state = {board: [[0,1,1,1],[0,0,2,1]], currentTurn: 1};
	    assert.eql({win: 0}, ai.moveDetail.bestMove(state));
    },
    
    'bestMove when we can block the opponent is the block': function() {
        var state = {board: [[0,0,1,1],[0,2,2,2]], currentTurn: 1};
	    assert.eql({good: 1}, ai.moveDetail.bestMove(state));        
    },
    
    'bestMove when we cant do anything to stop a win is some random blocking move': function() {
        var state = {board: [[0,2,2,2],[0,2,2,2],[0,0,0,0]], currentTurn: 1};
        assert.isDefined(ai.moveDetail.bestMove(state).lose);        
    },
    
    'bestMove when we are double trapped is to block one of the wins': function() {
        var state = {board: [[0,0,0,0,2,1],[0,0,0,0,1,1],[0,0,0,0,0,1],[0,2,1,2,1,2],[0,0,0,0,1,2]], currentTurn: 2};
        assert.eql({lose: 2}, ai.moveDetail.bestMove(state));
    },
    
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
        assert.includes([1,2], ai.move(state));
    },
    
    'AI will play a blocking square even if it is double trapped and will lose next turn': function() {
        var state = {board: [[0,0,0,0,2,1],[0,0,0,0,1,1],[0,0,0,0,0,1],[0,2,1,2,1,2],[0,0,0,0,1,2]], currentTurn: 2};
        assert.eql(2, ai.move(state));
    },
};
