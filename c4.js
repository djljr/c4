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

var game = { spectator: true, gameOn: false, turnIdx: 0, thisPlayer: 0 };
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
    ui.boardLayer.empty();
    ui.pieceLayer.empty();
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

var joinButton = function(socket, player, text) {
    var joinButton = $("<button></button>");
    joinButton.click(function() { 
        socket.emit('join', { player: player });
    });
    joinButton.text(text);

    return joinButton;
};

var showMsg = function(msg) {
    if(msg && msg != "") {
        ui.msgDiv.text(msg);
    }
}
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

    //functions
    
    var showJoinButtons = function(data) {
        if(!game.spectator) {
            ui.joinButtonP1.hide();
            ui.joinButtonP2.hide();
            return;
        }
        
        if(data.open.player1) {
            ui.joinButtonP1.show();        
        }
        else {
            ui.joinButtonP1.hide(); 
        }
        
        if(data.open.player2) {
            ui.joinButtonP2.show();
        }
        else {
            ui.joinButtonP2.hide();
        }
    };  
        
    //Communication stuff
    var socket = io.connect('/');

    ui.joinButtonP1 = joinButton(socket, 1, "Join as Player 1");
    $("#controls").append(ui.joinButtonP1);

    ui.joinButtonP2 = joinButton(socket, 2, "Join as Player 2");
    $("#controls").append(ui.joinButtonP2);
        
    ui.msgDiv = $("<div></div>");
    $("#controls").append(ui.msgDiv);
    
    socket.on('available', function(data) {
        showMsg(data.msg);
        showJoinButtons(data);
    });
    socket.on('join', function(data) {
        showJoinButtons(data);    
    });
    socket.on('leave', function(data) {
        showMsg(data.msg);
        showJoinButtons(data);
    });
    socket.on('error', function(error) {
        showMsg(error.msg);
    });
    socket.on('standby', function(data) {
        game.thisPlayer = data.playerIdx;
        game.spectator = false;
        showJoinButtons(data);
        showMsg(data.msg);
    });
    socket.on('begin', function(data) {
        game.gameOn = true;
        game.spectator = data.spectator;
        showMsg(data.msg); 
        game.turnIdx = data.game.currentTurn;
        startGame(socket, data.game.rows, data.game.cols, data.game.board)
    });
    socket.on('move', function(data) {
        showMsg(data.msg); 
        dropPiece($, data.game.lastMove);
        game.turnIdx = data.game.currentTurn;
    });
    socket.on('win', function(data) {
        game.gameOn = false;
        showMsg(data.msg);
        ui.joinButtonP1.show();
    });
    socket.on('lose', function(data) {
        game.gameOn = false;
        showMsg(data.msg);
        ui.joinButtonP1.show();
    });
    
    socket.emit('available');
};

jQuery(document).ready(init);
