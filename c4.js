var UI = (function() {
    //ui constants
    var HEIGHT = 480;
    var WIDTH = 800;
    
    var spriteWidth = 80;
    var spriteHeight = 57;
    var REFRESH_RATE = 16;
    var pieceSpeed = 20;
    
    //ui state    
    var ui = {};
    
    return {
        /* 
         * create a new button with text <text> which 
         * emits the 'join' message on <socket> for <player> when clicked
         */
        joinButton: function(socket, player, text) {
            var joinButton = $("<button></button>");
            joinButton.click(function() { 
                socket.emit('join', { player: player });
            });
            joinButton.text(text);

            return joinButton;
        },

        /*
         * Display message <msg> if it is not empty
         */
        showMsg: function(msg) {
            if(msg && msg != "") {
                ui.msgDiv.text(msg);
            }
        },
    
        /*
         * return the sprite for piece for <player>
         */
        pieceForPlayer: function(player) {
            if(player == P1) {
                return ui.p1Piece;
            }
            if(player == P2) {
                return ui.p2Piece;
            }
        },
        
        /* 
         * return a function which will emit the correct 'move' message for <col> on <socket>
         */
        clickFnFor: function(socket, col) {
            return function(e) {
                if(!game.spectator && game.turnIdx == game.thisPlayer) {
                    socket.emit('move', { col: col });
                }
            }
        },
        
        resetBoard: function(boardQueryCallback) {
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
                    
                    if(boardQueryCallback(i, j) != EMPTY) {
                        ui.pieceLayer.addSprite(currentSquare + '-piece', {
                                animation: pieceForPlayer(boardQueryCallback(i, j)),
                                width: spriteWidth,
                                height: spriteHeight,
                                posx: j * spriteWidth,
                                posy: i * spriteHeight
                        });
                    }

                    $("#" + currentSquare).click(clickFnFor(socket, j));
                }
            }    
        },
        
        startGame: function() {
            $.playground().startGame();
        },
        
        dropPiece: function(move) {
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
        },
        
        init: function() {
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

            ui.joinButtonP1 = joinButton(socket, 1, "Join as Player 1");
            $("#controls").append(ui.joinButtonP1);

            ui.joinButtonP2 = joinButton(socket, 2, "Join as Player 2");
            $("#controls").append(ui.joinButtonP2);
                
            ui.msgDiv = $("<div></div>");
            $("#controls").append(ui.msgDiv);                                                      
        },
        
        showJoinButtons: function(data) {
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
        }
    }
})();

var engine = (function(io) {
    //game constants
    var EMPTY = 0;
    var P1 = 1;
    var P2 = 2;
    
    //game state
    var game = { spectator: true, gameOn: false, turnIdx: 0, thisPlayer: 0 };
    
    return {
        startGame: function(socket, rows, cols, board) {
            var boardQueryCallback = function(i, j) {
                return board[j][i];
            }
            UI.resetGame(boardQueryCallback);
            UI.startGame();            
        },
        init: function() {            
            UI.init();
       
            var showJoinButtons = function(data) {
                if(!game.spectator) { //only spectators are allowed to join
                    data.open.player1 = false;
                    data.open.player2 = false;
                }
                
                UI.showJoinButtons(data);
            };  
                
            //Communication stuff
            var socket = io.connect('/');
            
            socket.on('available', function(data) {
                UI.showMsg(data.msg);
                showJoinButtons(data);
            });
            socket.on('join', function(data) {
                showJoinButtons(data);    
            });
            socket.on('leave', function(data) {
                UI.showMsg(data.msg);
                showJoinButtons(data);
            });
            socket.on('error', function(error) {
                UI.showMsg(error.msg);
            });
            socket.on('standby', function(data) {
                game.thisPlayer = data.playerIdx;
                game.spectator = false;
                showJoinButtons(data);
                UI.showMsg(data.msg);
            });
            socket.on('begin', function(data) {
                game.gameOn = true;
                game.spectator = data.spectator;
                UI.showMsg(data.msg); 
                game.turnIdx = data.game.currentTurn;
                startGame(socket, data.game.rows, data.game.cols, data.game.board)
            });
            socket.on('move', function(data) {
                UI.showMsg(data.msg); 
                UI.dropPiece($, data.game.lastMove);
                game.turnIdx = data.game.currentTurn;
            });
            socket.on('win', function(data) {
                game.gameOn = false;
                showMsg(data.msg);
                game.spectator = true;
                showJoinButtons(data);
            });
            socket.on('lose', function(data) {
                game.gameOn = false;
                UI.showMsg(data.msg);
                game.spectator = true;
                showJoinButtons(data);
            });
            socket.on('gameover', function(data) {
                UI.showMsg(data.msg);    
                showJoinButtons(data);
            });
            
            socket.emit('available');
        }       
    };
})(io);

//used for testing
exports.engine = engine;
