

exports.newGame = function(rows, cols) {
    engine.init(rows, cols);
    return engine;
};

var engine = {
    EMPTY: 0,
    P1: 1,
    P2: 2,
    
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
    
    /* initialize everything */
    init: function(rows, cols) {
        engine.ROWS = rows;
        engine.COLS = cols;
        engine.moves = 0;
        
        engine.board = engine.initBoard(function() { return engine.EMPTY; });
        engine.turn = engine.P1;
    },
    
    advanceTurn: function() {
        if(engine.turn == engine.P1) { engine.turn = engine.P2; }
        else if(engine.turn == engine.P2) { engine.turn = engine.P1; }
    },
    
    highestFilledRow: function(board, col) {
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
    
    move: function(col) {
        row = engine.highestFilledRow(engine.board, col) - 1;
        if(row > 0) {
            engine.moves = engine.moves + 1;
            engine.board[col][row] = engine.turn;
            engine.lastMove = { row: row, col: col, player: engine.turn, moves: engine.moves };
            engine.advanceTurn();
        }
    },
    
    /* initializes the board to defaultValueCallback(i, j) */
    initBoard: function(defaultValueCallback) {
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
    checkWin: function(board) {
        var boardCheck = engine.initBoard(function() { return {}; });
        
        for(var i=0; i<engine.COLS; i++) {
            for(var j=0; j<engine.ROWS; j++) {
                if(board[i][j] != engine.EMPTY) {
                    boardCheck[i][j] = {cols:1, rows:1, diag:1};
                    if(i>0 && board[i][j] == board[i-1][j]) { boardCheck[i][j].cols = boardCheck[i-1][j].cols + 1; }
                    if(j>0 && board[i][j] == board[i][j-1]) { boardCheck[i][j].rows = boardCheck[i][j-1].rows + 1; }
                    if(i>0 && j>0 && board[i][j] == board[i-1][j-1]) { boardCheck[i][j].diag = boardCheck[i-1][j-1].diag + 1; }
                    
                    for(var dir in boardCheck[i][j]) {
                        if(boardCheck[i][j][dir] == 4) {
                            return boardCheck[i][j]; 
                        }
                    }                
                }
                else {
                    boardCheck[i][j] = {cols:0, rows:0, diag:0};
                }
            }
        }
        
        return false;
    },

};
