var engine = require('../engine');
var AIUtils = require('./aiutils');

var Utils = engine.Utils;

exports.move = function(state) {
    return exports.moveDetail(state).col;
};

exports.moveDetail = function(state) {       
    
    var legalMoves = Utils.findLegalMoves(state.board);
    if(legalMoves.length == 0) { return { col: 'nothing legal' }; }
    
    var block;
    var win;
    
    for(var i=0; i<legalMoves.length; i++) {
        // see if the move is a win for us
        var board = AIUtils.boardAfterMove(state.board, legalMoves[i], state.currentTurn);
        if(Utils.checkWin(board) == state.currentTurn) {
            win = legalMoves[i];
        }
        
        // see if any move is a win for the other player
        var next = Utils.nextPlayer(state.currentTurn);
        board = AIUtils.boardAfterMove(AIUtils.copyBoard(state.board), legalMoves[i], next);
        if(Utils.checkWin(board) == next) {
            block = legalMoves[i];
        }
    }
    
    var randomMove = AIUtils.randomMove(legalMoves);
    var move;
    if(win !== undefined) {
        move = win;
    }
    else if(block !== undefined) {
        move = block
    }
    else {
        move = randomMove;
    }
    
    return { col: move, win: win, block: block, rand: randomMove };
}
