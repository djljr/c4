

exports.newGame = function(rows, cols) {
    engine._init(rows, cols);
    return engine;
};

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
        row = engine._highestFilledRow(engine.board, col) - 1;
        if(row >= 0) {
            engine.moves = engine.moves + 1;
            engine.board[col][row] = engine.turn;
            engine.lastMove = { row: row, col: col, player: engine.turn, moves: engine.moves };
            engine._advanceTurn();
            var winner = engine._checkWin(engine.board);
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
        
        engine.board = engine._initBoard(function() { return engine.EMPTY; });
        engine.turn = engine.P1;
    },
    
    _advanceTurn: function() {
        if(engine.turn == engine.P1) { engine.turn = engine.P2; }
        else if(engine.turn == engine.P2) { engine.turn = engine.P1; }
    },
    
    _highestFilledRow: function(board, col) {
        var curCol = board[col];
        var highestFilledRow = engine.ROWS;
        for(var i=0; i<engine.ROWS; i++) {
            if(curCol[i] == engine.EMPTY) {
                continue;
            }
            else {
                highestFilledRow = i;
                break;
            }
        }
        return highestFilledRow;
    },
    
    /* initializes the board to defaultValueCallback(i, j) */
    _initBoard: function(defaultValueCallback) {
        board = [];
        for(var i=0; i<engine.COLS; i++) {
            board[i] = [];
            for(var j=0; j<engine.ROWS; j++) {
                board[i][j] = defaultValueCallback(i, j);
            }
        }
        return board;
    },

    /* returns the player who won, or false */
    _checkWin: function(board) {
        var boardCheck = engine._initBoard(function() { return {}; });
        
        for(var i=0; i<engine.COLS; i++) {
            for(var j=0; j<engine.ROWS; j++) {
                if(board[i][j] != engine.EMPTY) {
                    boardCheck[i][j] = {cols:1, rows:1, diag_l:1, diag_r:1};
                    if(i>0 && board[i][j] == board[i-1][j]) { boardCheck[i][j].cols = boardCheck[i-1][j].cols + 1; }
                    if(j>0 && board[i][j] == board[i][j-1]) { boardCheck[i][j].rows = boardCheck[i][j-1].rows + 1; }
                    if(i>0 && j>0 && board[i][j] == board[i-1][j-1]) { boardCheck[i][j].diag_l = boardCheck[i-1][j-1].diag_l + 1; }
                    if(i>0 && j<engine.ROWS-1 && board[i][j] == board[i-1][j+1]) { boardCheck[i][j].diag_r = boardCheck[i-1][j+1].diag_r + 1; }
                    
                    for(var dir in boardCheck[i][j]) {
                        if(boardCheck[i][j][dir] == 4) {
                            return board[i][j]; 
                        }
                    }                
                }
                else {
                    boardCheck[i][j] = {cols:0, rows:0, diag_l:0, diag_r: 0};
                }
            }
        }
        
        return false;
    },

};
