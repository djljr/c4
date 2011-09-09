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

var startGame(socket, rows, cols) {
    for(var i = 0; i < rows; i++) {
        for(var j = 0; j < cols; j++) {
            var currentSquare = i + "x" + j;
            ui.boardSprite.addSprite(currentSquare, {
                        animation: ui.boardSquare, 
                        width: spriteWidth, 
                        height: spriteHeight, 
                        posx: j * spriteWidth, 
                        posy: i * spriteHeight
            });

            $("#" + currentSquare).click(function(e) {
                if(!spectator && turnIdx == thisPlayer) {
                    socket.emit('move', { col: j });
                }
            });
        }
    }

    $.playground().startGame();
};

var dropPiece = function($, col, layer, piece, player) {
    col = parseInt(col);
    var sprite = layer.addSprite("move" + moveNumber, {
                animation: piece,
                width: spriteWidth,
                height: spriteHeight,
                posx: col * spriteWidth,
                posy: 0 
    });
    var curPieceId = moveNumber;
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
    
    
    ui.msgDiv = $("<div></div>");
    $("#controls").append(ui.msgDiv);
    
    //Communication stuff
    var socket = io.connect('/');
    
    socket.on('available', function(data) {
        if(data.hasOpenSpot) {
            $("#controls").append(joinButton);
            game.spectator = false;
        }
        else {
            game.spectator = true;
        }
        ui.msgDiv.text(data.msg);         
    });
    socket.on('error', function(error) {
        ui.msgDiv.text(error.msg);
    });
    socket.on('standby', function(data) {
        thisPlayer = data.playerIdx;
        ui.joinButton.hide();
        ui.msgDiv.text(data.msg);
    });
    socket.on('begin', function(data) {
        game.gameOn = true;
        ui.msgDiv.text(data.msg); 
        turnIdx = data.currentTurn;
        startGame(socket, data.game.rows, data.game.cols)
    });
    socket.on('move', function(data) {
        ui.msgDiv.text(data.msg); 
        if(turnIdx == P1) {
            dropPiece($, data.col, ui.pieceLayer, ui.p1Piece, P1);
        }
        else if(turnIdx == P2) {
            dropPiece($, data.col, ui.pieceLayer, ui.p2Piece, P2);
        }
        turnIdx = data.nextTurn;
    });
    socket.on('win', function(data) {
        game.gameOn = false;
        ui.msgDiv.text(data.msg);
    });
    socket.on('lose', function(data) {
        game.gameOn = false;
        ui.msgDiv.text(data.msg);      
    });
    
    socket.emit('available');
};

jQuery(document).ready(init);
