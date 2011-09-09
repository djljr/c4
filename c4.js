//ui constants
var HEIGHT = 480;
var WIDTH = 800;
var spriteWidth = 80;
var spriteHeight = 57;
var REFRESH_RATE = 16;
var pieceSpeed = 20;


var EMPTY = 0;
var P1 = 1;
var P2 = 2;

var game = { spectator: false, gameOn: false, turnIdx: 0, thisPlayer: 0 };
var ui = {};

var pieceForPlayer = function(player) {
    if(player == P1) {
        return ui.p1Piece;
    }
    if(player == P2) {
        return ui.p2Piece;
    }
}

var clickFnFor = function(socket, col) {
    return function(e) {
        if(!game.spectator && game.turnIdx == game.thisPlayer) {
            socket.emit('move', { col: col });
        }
    }
}
var startGame = function(socket, rows, cols, board) {
    for(var i = 0; i < rows; i++) {
        for(var j = 0; j < cols; j++) {
            var currentSquare = i + "x" + j;
            ui.boardLayer.addSprite(currentSquare, {
                        animation: ui.boardSquare, 
                        width: spriteWidth, 
                        height: spriteHeight, 
                        posx: j * spriteWidth, 
                        posy: i * spriteHeight
            });
            
            if(board[j][i] != EMPTY) {
                ui.pieceLayer.addSprite(currentSquare + '-piece', {
                        animation: pieceForPlayer(board[j][i]),
                        width: spriteWidth,
                        height: spriteHeight,
                        posx: j * spriteWidth,
                        posy: i * spriteHeight
                });
            }

            $("#" + currentSquare).click(clickFnFor(socket, j));
        }
    }

    $.playground().startGame();
};

var dropPiece = function($, move) {
    var piece = pieceForPlayer(move.player);
    var curPieceId = move.moves;
    var sprite = ui.pieceLayer.addSprite("move" + curPieceId, {
                animation: piece,
                width: spriteWidth,
                height: spriteHeight,
                posx: move.col * spriteWidth,
                posy: 0 
    });
    var bottomOfCol = move.row * spriteHeight;
            
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
    // UI stuff
    ui.boardSquare = new $.gameQuery.Animation({ imageURL: "images/sprites.png",
                                            numberOfFrame: 1,
                                            type: $.gameQuery.ANIMATION_ONCE,
                                            offsetx: 0,
                                            offsety: 0});

    ui.p1Piece = new $.gameQuery.Animation({ imageURL: "images/sprites.png",
                                            numberOfFrame: 1,
                                            type: $.gameQuery.ANIMATION_ONCE,
                                            offsetx: 80,
                                            offsety: 0});
                                            
    ui.p2Piece = new $.gameQuery.Animation({ imageURL: "images/sprites.png",
                                            numberOfFrame: 1,
                                            type: $.gameQuery.ANIMATION_ONCE,
                                            offsetx: 160,
                                            offsety: 0});
    
    $("#gameboard").playground({height: HEIGHT, width: WIDTH})
        .addGroup("pieceSprites", {height: HEIGHT, width: WIDTH}).end()
        .addGroup("boardsquares", {height: HEIGHT, width: WIDTH});
        
    ui.boardLayer = $("#boardsquares");    
    ui.pieceLayer = $("#pieceSprites");
    
    ui.joinButton = $("<button></button>");
    ui.joinButton.click(function() { 
        socket.emit('join');
    });
    ui.joinButton.text("Join Game");
    $("#controls").append(ui.joinButton);
    
    ui.msgDiv = $("<div></div>");
    $("#controls").append(ui.msgDiv);
    
    //Communication stuff
    var socket = io.connect('/');
    
    socket.on('available', function(data) {
        if(data.hasOpenSpot) {
            game.spectator = false;
            ui.joinButton.show();
        }
        else {
            game.spectator = true;
            ui.joinButton.hide();            
        }
        ui.msgDiv.text(data.msg);         
    });
    socket.on('error', function(error) {
        ui.msgDiv.text(error.msg);
    });
    socket.on('standby', function(data) {
        game.thisPlayer = data.playerIdx;
        ui.joinButton.hide();
        ui.msgDiv.text(data.msg);
    });
    socket.on('begin', function(data) {
        game.gameOn = true;
        ui.msgDiv.text(data.msg); 
        game.turnIdx = data.game.currentTurn;
        startGame(socket, data.game.rows, data.game.cols, data.game.board)
    });
    socket.on('move', function(data) {
        ui.msgDiv.text(data.msg); 
        dropPiece($, data.game.lastMove);
        game.turnIdx = data.game.currentTurn;
    });
    socket.on('win', function(data) {
        game.gameOn = false;
        ui.msgDiv.text(data.msg);
        ui.joinButton.show();
    });
    socket.on('lose', function(data) {
        game.gameOn = false;
        ui.msgDiv.text(data.msg);
        ui.joinButton.show();
    });
    
    socket.emit('available');
};

jQuery(document).ready(init);
