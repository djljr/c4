var engine = require('../engine');
var Utils = engine.Utils;

exports.boardAfterMove = function(board, col, player) {
    var row = Utils.highestFilledRow(board, col) - 1;
    board[col][row] = player;
    return board;
};
    
exports.copyBoard = function(board) {
    var copy = [];
    for(var i=0; i<board.length; i++) {
        copy.push(board[i].slice(0));
    }
    return copy;
};

exports.randomMove = function(moves) {
    return moves[Math.floor(Math.random() * moves.length)];
};
