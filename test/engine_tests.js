var engine = require('../engine');
var assert = require('assert');

var Utils = engine.Utils;

module.exports = {
    'Utils object is defined': function() {
        assert.isDefined(engine.Utils);
    },
    
    'Highest filled row on empty board is 0': function() {
        var board = [[]];
        assert.eql(0, Utils.highestFilledRow(board, 0));
    },
    
    'Highest filled row on empty column is column length': function() {
        var board = [[0,0,0]];
        assert.eql(3, Utils.highestFilledRow(board, 0));
    },
    
    'Highest filled row on column with single piece is length-1': function() {
        var board = [[0,0,1]];
        assert.eql(2, Utils.highestFilledRow(board, 0));
    },
    
    'Highest filled row on full column is 0': function() {
        var board = [[1,1,1]];
        assert.eql(0, Utils.highestFilledRow(board, 0));
    },
    
    'Init board with size 0 returns []': function() {
        assert.eql([], Utils.initBoard(0,0));
    },
    
    'Init board with 0 rows returns [[]]': function() {
        assert.eql([[]], Utils.initBoard(0,1));
    },
    
    'Init board with 0 cols returns []': function() {
        assert.eql([], Utils.initBoard(1,0));
    },
    
    'Init board fills cell with desired function value': function() {
        var fillFn = function(row,col) { return [row,col]; };
        var board = Utils.initBoard(1,1,fillFn);
        assert.eql([0,0], board[0][0]);
    },
    
    'Check win on empty board returns false': function() {
        assert.eql(false, Utils.checkWin([]));
    },
    
    'Check win with 4 in a single column returns player who won': function() {
        board = [[1,1,1,1]];
        assert.eql(1, Utils.checkWin(board));
    },
    
    'Check win with 4 in a single rows returns player who won': function() {
        board = [[1],[1],[1],[1]];
        assert.eql(1, Utils.checkWin(board));
    },
    
    'Check win with 4 in a left-to-right diagonal returns player who won': function() {
        board = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
        assert.eql(1, Utils.checkWin(board));
    },
    
    'Check win with 4 in a right-to-left diagonal returns player who won': function() {
        board = [[0,0,0,1],[0,0,1,0],[0,1,0,0],[1,0,0,0]];
        assert.eql(1, Utils.checkWin(board));
    },
    
    /* Check all other tetrominos fail */
    'Check win with a J returns false': function() {
        board = [[0,0,0,0],
                 [0,0,1,0],
                 [0,0,1,0],
                 [0,1,1,0]];
        assert.eql(false, Utils.checkWin(board));
    },
    
    'Check win with an L returns false': function() {
        board = [[0,0,0,0],
                 [0,1,0,0],
                 [0,1,0,0],
                 [0,1,1,0]];
        assert.eql(false, Utils.checkWin(board));
    },
    
    'Check win with an O returns false': function() {
        board = [[0,0,0,0],
                 [0,0,0,0],
                 [0,1,1,0],
                 [0,1,1,0]];
        assert.eql(false, Utils.checkWin(board));    
    },
    
    'Check win with an S returns false': function() {
        board = [[0,0,0,0],
                 [0,1,0,0],
                 [0,1,1,0],
                 [0,0,1,0]];
        assert.eql(false, Utils.checkWin(board));    
    },
    
    'Check win with a Z returns false': function() {
        board = [[0,0,0,0],
                 [0,0,1,0],
                 [0,1,1,0],
                 [0,1,0,0]];
        assert.eql(false, Utils.checkWin(board));
    },
    
    'Check win with a T returns false': function() {
        board = [[0,0,0,0],
                 [0,0,0,0],
                 [0,1,0,0],
                 [1,1,1,0]];
        assert.eql(false, Utils.checkWin(board));
    }
};
