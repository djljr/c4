var engine = require('../engine');
var AIUtils = require('./aiutils');

var Utils = engine.Utils;

exports.move = function(state) {
    return exports.moveDetail(state).col;
};

exports.moveDetail = function(state) {
    var bestMove = function(state, depth) {
        var legalMoves = Utils.findLegalMoves(state.board);
        if(legalMoves.length == 0) { return { col: 'nothing legal', badIdeas: []}; }    
        if(depth >= 2) { return {badIdeas: []}; }
        var win;
        var block;
        var badIdeas = [];
        for(var i=0; i<legalMoves.length; i++) {
            // see if the move is a win for us
            var board = AIUtils.boardAfterMove(AIUtils.copyBoard(state.board), legalMoves[i], state.currentTurn);
            if(Utils.checkWin(board) == state.currentTurn) {
                win = legalMoves[i];
            }
            
            // see if the move 
            var next = Utils.otherPlayer(state.currentTurn)
            board = AIUtils.boardAfterMove(AIUtils.copyBoard(state.board), legalMoves[i], next);
            if(Utils.checkWin(board) == next) {
                block = legalMoves[i];
            }
            
            if(win === undefined && block === undefined) {
                //check one more move
                var theirTurn = bestMove({board: board, currentTurn: next}, depth+1);
                badIdeas.push(legalMoves[i]);
            }
        }
        
        var goodMoves = legalMoves.filter(function(el, idx) {
            return !(badIdeas.indexOf(el) > -1);
        });
        
        return {win: win, block: block, badIdeas: badIdeas, goodMoves: goodMoves};
    }
    
    var moveDetail = bestMove(state, 0);
    var randomMove = AIUtils.randomMove(moveDetail.goodMoves);
    
    if(moveDetail.win !== undefined) {
        moveDetail.col = moveDetail.win;
    }
    else if(moveDetail.block !== undefined) {
        moveDetail.col = moveDetail.block
    }
    else {
        moveDetail.col = moveDetail.randomMove = randomMove;
        
    }
    
    return moveDetail;
};
