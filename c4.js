var HEIGHT = 480;
var WIDTH = 800;
var COLS = 7;
var ROWS = 6;
var spriteWidth = 80;
var spriteHeight = 57;
var REFRESH_RATE = 16;

var pieceSpeed = 20;

var moveNumber = 0;

var EMPTY = 0;
var P1 = 1;
var P2 = 2;

//store the board transposed (we usually care about columns)
var boardPos = [];
var nextTurn;
var turn = P1;
var gameOn = false;

var turnIdx;
var thisPlayer;

var initBoard = function(defaultValueCallback) {
    board = [];
    for(var i=0; i<COLS; i++) {
        board[i] = [];
        for(var j=0; j<ROWS; j++) {
            board[i][j] = defaultValueCallback(i, j);
        }
    }
    return board;
};

var checkWin = function(socket) {
    var boardCheck = initBoard(function() { return {}; });
    
    for(var i=0; i<COLS; i++) {
        for(var j=0; j<ROWS; j++) {
            if(boardPos[i][j] != EMPTY) {
                boardCheck[i][j] = {cols:1, rows:1, diag:1};
                if(i>0 && boardPos[i][j] == boardPos[i-1][j]) { boardCheck[i][j].cols = boardCheck[i-1][j].cols + 1; }
                if(j>0 && boardPos[i][j] == boardPos[i][j-1]) { boardCheck[i][j].rows = boardCheck[i][j-1].rows + 1; }
                if(i>0 && j>0 && boardPos[i][j] == boardPos[i-1][j-1]) { boardCheck[i][j].diag = boardCheck[i-1][j-1].diag + 1; }
            }
            else {
                boardCheck[i][j] = {cols:0, rows:0, diag:0};
            }
            
            for(var dir in boardCheck[i][j]) {
                if(boardCheck[i][j][dir] == 4) { socket.emit('iwin'); return true; }
            }
        }
    }
    
    return false;
};

var advanceTurn = function(currentTurn) {
    if(currentTurn == P1) { return P2; }
    else if(currentTurn == P2) { return P1; }
};
var dropPiece = function($, col, board, piece, player) {
    col = parseInt(col);
    var sprite = board.addSprite("move" + moveNumber, {
                animation: piece,
                width: spriteWidth,
                height: spriteHeight,
                posx: col * spriteWidth,
                posy: 0 
    });
    var curPieceId = moveNumber;
    
    moveNumber = moveNumber + 1;
    
    var curCol = boardPos[col];
    var highestFilledRow = ROWS;
    for(var i=0; i<ROWS; i++) {
        if(curCol[i] == EMPTY) {
            continue;
        }
        else {
            highestFilledRow = i;
            break;
        }
    }

    if(highestFilledRow == 0) {
        alert("Can't move");
        return;
    }

    boardPos[col][highestFilledRow-1] = player;
    
    //make the move

    var bottomOfCol = (highestFilledRow - 1) * spriteHeight;
            
    $.playground().registerCallback(function() {
        var currentSprite = $("#move" + curPieceId);
        var newTop = parseInt(currentSprite.css("top")) + pieceSpeed;
        if(newTop < bottomOfCol) {
            currentSprite.css("top", newTop);
            return false;
        }
        else {
            currentSprite.css("top", bottomOfCol);
            return true;
        }
        
    }, REFRESH_RATE);
};

var init = function($) {
    boardPos = initBoard(function() { return EMPTY; });

    var boardSquare = new $.gameQuery.Animation({ imageURL: "images/sprites.png",
                                            numberOfFrame: 1,
                                            type: $.gameQuery.ANIMATION_ONCE,
                                            offsetx: 0,
                                            offsety: 0});

    var p1Piece = new $.gameQuery.Animation({ imageURL: "images/sprites.png",
                                            numberOfFrame: 1,
                                            type: $.gameQuery.ANIMATION_ONCE,
                                            offsetx: 80,
                                            offsety: 0});
                                            
    var p2Piece = new $.gameQuery.Animation({ imageURL: "images/sprites.png",
                                            numberOfFrame: 1,
                                            type: $.gameQuery.ANIMATION_ONCE,
                                            offsetx: 160,
                                            offsety: 0});
    
    $("#gameboard").playground({height: HEIGHT, width: WIDTH})
        .addGroup("pieceSprites", {height: HEIGHT, width: WIDTH}).end()
        .addGroup("boardsquares", {height: HEIGHT, width: WIDTH});
        
    var boardSprite = $("#boardsquares");    
    var pieceSprites = $("#pieceSprites");
    
    var joinButton = $("<button></button>");
    joinButton.click(function() { 
        socket.emit('join');
    });
    joinButton.text("Join Game");
    
    
    var msgDiv = $("<div></div>");
    $("#controls").append(msgDiv);
    
    var socket = io.connect('/');
    
    socket.on('available', function(data) {
        if(data.hasOpenSpot) {
            $("#controls").append(joinButton);
        }
        msgDiv.text(data.msg);         
    });
    socket.on('error', function(error) {
        msgDiv.text(error.msg);
    });
    socket.on('standby', function(data) {
        thisPlayer = data.playerIdx;
        joinButton.hide();
        msgDiv.text(data.msg);
    });
    socket.on('begin', function(data) {
        gameOn = true;
        msgDiv.text(data.msg); 
        turnIdx = data.currentTurn;
    });
    socket.on('move', function(data) {
        if(turnIdx == P1) {
            dropPiece($, data.col, pieceSprites, p1Piece);
        }
        else if(turnIdx == P2) {
            dropPiece($, data.col, pieceSprites, p2Piece);
        }
        checkWin(socket);
        turnIdx = data.nextTurn;
    });
    socket.on('win', function(data) {
        gameOn = false;
        msgDiv.text(data.msg);        
    });
    socket.on('lose', function(data) {
        gameOn = false;
        msgDiv.text(data.msg);        
    });
    
    for(var i = 0; i < ROWS; i++) {
        for(var j = 0; j < COLS; j++) {
            var currentSquare = i + "x" + j;
            boardSprite.addSprite(currentSquare, {
                        animation: boardSquare, 
                        width: spriteWidth, 
                        height: spriteHeight, 
                        posx: j * spriteWidth, 
                        posy: i * spriteHeight
            });

            $("#" + currentSquare).click(function(e) {
                var rowcol = e.target.id.split("x");
                if(turnIdx == thisPlayer) {
                    socket.emit('move', { col: parseInt(rowcol[1]) });
                }
            });
        }
    }

    $.playground().startGame();
    socket.emit('available');
};

jQuery(document).ready(init);
