var engine = require('../engine');
var AIUtils = require('./aiutils');

var Utils = engine.Utils;

exports.move = function(state) {
    return exports.moveDetail.move(state).col;
};

exports.moveDetail = (function() {
    return {
	    checkMovesForWin: function(state) {
			var legalMoves = Utils.findLegalMoves(state.board);
			var winningMoves = [];
			for(var i=0; i<legalMoves.length; i++) {
			    var board = AIUtils.boardAfterMove(state.board, legalMoves[i], state.currentTurn);
			    if(Utils.checkWin(board) == state.currentTurn) {
			        winningMoves.push(legalMoves[i]);
			    }
			}
			return winningMoves;
		},

	    bestMove: function(state) {
			var winningMoves = this.checkMovesForWin(state);
			if(winningMoves.length > 0) {
			    var move = AIUtils.randomMove(winningMoves);
       			return {win: move};
			}
			
			
			var blockingMoves = [];
			var legalMoves = Utils.findLegalMoves(state.board);			
			var goodMoves = Utils.findLegalMoves(state.board);
			var blockMoves = [];
			for(var i=0; i<legalMoves.length; i++) {
			    var board = AIUtils.boardAfterMove(state.board, legalMoves[i], state.currentTurn);
			    var newState = {board: board, currentTurn: Utils.nextPlayer(state.currentTurn)};
			    var winningMoves = this.checkMovesForWin(newState);
			    if(winningMoves.length > 0) {
			        blockMoves = blockMoves.concat(winningMoves);
			        goodMoves.splice(goodMoves.indexOf(legalMoves[i]), 1);
			        continue;
			    }			    
			}
			
			if(goodMoves.length > 0) {
			    return {good: AIUtils.randomMove(goodMoves)};
			}
			else if(blockMoves.length > 0) {
			    return {lose: AIUtils.randomMove(blockMoves)};
			}
			else {
			    return {random: AIUtils.randomMove(legalMoves)};
			}
		},
    
        move: function(state) {
            var moveDetail = this.bestMove(state);
    
            if(moveDetail.win !== undefined) {
                moveDetail.col = moveDetail.win;
            }
            else if(moveDetail.good !== undefined) {
                moveDetail.col = moveDetail.good;
            }
            else if(moveDetail.lose !== undefined) {
                moveDetail.col = moveDetail.lose;
            }
            else {
                moveDetail.col = moveDetail.random;
            }
            return moveDetail;
        },
    };
})();
