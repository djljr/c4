var Utils = (function() {
    
    var check = function(row, col, board, test, accumulator) {
        if(board[col][row] == engine.EMPTY) { return 0; }
        else if(test(row, col)) { return accumulator(row, col); }
        else { return 1; } 
    };
    
    var checker = {
        cols: function(row, col, board, checkBoard) {
            if(row == 0) { return 1; }
                    
            var test = function(row, col) { return board[col][row] == board[col][row-1]; };
            var accumulator = function(row, col) { return checkBoard[col][row-1].cols + 1; };

            return check(row, col, board, test, accumulator);
        },
        rows: function(row, col, board, checkBoard) {
            if(col == 0) { return 1; }
            
            var test = function(row, col) { return board[col][row] == board[col-1][row]; };
            var accumulator = function(row, col) { return checkBoard[col-1][row].rows + 1; };

            return check(row, col, board, test, accumulator);
        },
        diag_lr: function(row, col, board, checkBoard) {
            if(col == 0 || row == 0) { return 1; }
            
            var test = function(row, col) { return board[col][row] == board[col-1][row-1]; };
            var accumulator = function(row, col) { return checkBoard[col-1][row-1].diag_lr + 1; };
            return check(row, col, board, test, accumulator);
        },
        diag_rl: function(row, col, board, checkBoard) {
            var rows = board[0].length;
            if(col == 0 || row == rows-1) { return 1; }
            
            var test = function(row, col) { return board[col][row] == board[col-1][row+1]; };
            var accumulator = function(row, col) { return checkBoard[col-1][row+1].diag_rl + 1; };
            return check(row, col, board, test, accumulator);
        }
    };
    
    return {
        otherPlayer: function(player) {
            if(player == engine.P1) { return engine.P2; }
            if(player == engine.P2) { return engine.P1; }
        },
        isLegalMove: function(board, col) {
            if(board === undefined || 
                board.length == 0 || 
                board[col] === undefined ||
                board[col].length == 0) 
            { return false; }
            return this.highestFilledRow(board, col) > 0;
        },
        findLegalMoves: function(board) {
            var legalMoves = [];
            for(var col=0; col<board.length; col++) {
                if(Utils.isLegalMove(board, col)) {
                    legalMoves.push(col);
                }
            }
            return legalMoves;
        },   
        /* returns the lowest row index with a piece for given col */
        highestFilledRow: function(board, col) {
            var targetCol = board[col];
            var rows = targetCol.length;
            var highestFilledRow = rows;
            for(var i=0; i<rows; i++) {
                if(targetCol[i] != engine.EMPTY) {
                    highestFilledRow = i;
                    break;
                }
            }
            return highestFilledRow;
        },
        
        /* initializes the board to initialValueFn(row,col) */    
        initBoard: function(rows, cols, initialValueFn) {
            var board = [];
            for(var i=0; i<cols; i++) {
                board[i] = [];
                for(var j=0; j<rows; j++) {
                    board[i][j] = initialValueFn(j,i);
                }
            }
            return board;
        },

        /* returns the player who won, or false */
        checkWin: function(board) {
            if(board === undefined || board[0] === undefined) return 'tie';

            var cols = board.length;
            var rows = board[0].length;
            var initFn = function() { return {cols:0, rows:0, diag_lr:0, diag_rl: 0}; };
            var checkBoard = Utils.initBoard(rows, cols, initFn);
            for(var col=0; col<cols; col++) {
                for(var row=0; row<rows; row++) {
                    for(var dir in checkBoard[col][row]) {
                        checkBoard[col][row][dir] = checker[dir](row, col, board, checkBoard);
                        if(checkBoard[col][row][dir] == 4) { return board[col][row]; }
                    }
                }
            }
            
            if(Utils.findLegalMoves(board).length == 0) {
                return 'tie';
            }
            
            return false;
        },
    };
})();

var engine = {
    EMPTY: 0,
    P1: 1,
    P2: 2,
    gameOver: false,
    
    /* returns object representation of current game state */
    gameState: function() {
        return {
            rows: engine.ROWS,
            cols: engine.COLS,
            board: engine.board,
            lastMove: engine.lastMove,
            currentTurn: engine.turn,
            moveNumber: engine.moves
        };
    },

    move: function(col) {
        if(engine.gameOver) { return; }
        target = Utils.highestFilledRow(engine.board, col) - 1;
        if(target >= 0) {
            engine.moves = engine.moves + 1;
            engine.board[col][target] = engine.turn;
            engine.lastMove = { row: target, col: col, player: engine.turn, moves: engine.moves };
            engine._advanceTurn();
            var winner = Utils.checkWin(engine.board);
            if(winner) {
                engine.gameOver = winner;
            }
        }
    },
        
    /* initialize everything */
    _init: function(rows, cols) {
        engine.ROWS = rows;
        engine.COLS = cols;
        engine.moves = 0;
        engine.gameOver = false;
        engine.lastMove = undefined;
        
        engine.board = Utils.initBoard(rows, cols, function() { return engine.EMPTY; });
        engine.turn = engine.P1;
    },
    
    _advanceTurn: function() {
        if(engine.turn == engine.P1) { engine.turn = engine.P2; }
        else if(engine.turn == engine.P2) { engine.turn = engine.P1; }
    },
};

exports.newGame = function(rows, cols) {
    engine._init(rows, cols);
    return engine;
};

exports.Utils = Utils;

