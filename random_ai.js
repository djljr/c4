var engine = require('./engine');

var Utils = engine.Utils;

exports.move = function(state) {
    return exports.moveDetail(state).col;
};

exports.moveDetail = function(state) {    
    var boardAfterMove = function(board, col, player) {
        var row = Utils.highestFilledRow(board, col) - 1;
        board[col][row] = player;
        return board;
    };
    
    var copyBoard = function(board) {
        var copy = [];
        for(var i=0; i<board.length; i++) {
            copy.push(board[i].slice(0));
        }
        return copy;
    };
    
    var randomMove = function(legalMoves) {
        return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    };
    
    var legalMoves = Utils.findLegalMoves(state.board);
    if(legalMoves.length == 0) { return { col: 'nothing legal' }; }
    
    var block;
    var win;
    
    for(var i=0; i<legalMoves.length; i++) {
        // see if the move is a win for us
        var board = boardAfterMove(copyBoard(state.board), legalMoves[i], state.currentTurn);
        if(Utils.checkWin(board) == state.currentTurn) {
            win = legalMoves[i];
        }
        
        // see if the move 
        var next = Utils.otherPlayer(state.currentTurn)
        board = boardAfterMove(copyBoard(state.board), legalMoves[i], next);
        if(Utils.checkWin(board) == next) {
            block = legalMoves[i];
        }
    }
    
    var randomMove = randomMove(legalMoves);
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
