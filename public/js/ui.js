var UI = (function() {
    //game constants
    var EMPTY = 0;
    var P1 = 1;
    var P2 = 2;
    
    //ui constants
    var HEIGHT = 480;
    var WIDTH = 800;
    
    var spriteWidth = 80;
    var spriteHeight = 57;
    var REFRESH_RATE = 30;
    var pieceAcceleration = 0.02; // px/ms^2
    
    //ui state    
    var ui = {};

    /* 
     * create a new button with text <text> which 
     * emits the 'join' message on <socket> for <player> when clicked
     */
    var joinButton = function(socket, player, text) {
        var joinButton = $("<button></button>");
        joinButton.click(function() { 
            socket.emit('join', { player: player });
        });
        joinButton.text(text);

        return joinButton;
    };

    var aiButton = function(socket, player, defaultBaseUrl, text) {
	    var aiContainer = $("<div></div>");
	    var aiUrl = $("<input></input>");
	    aiUrl.attr("size", "50");
	    aiUrl.val(defaultBaseUrl);

        var aiButton = $("<button></button>");
        aiButton.click(function() {
            socket.emit('ai', {player: player, baseUrl: aiUrl.val()});
        });
        aiButton.text(text);

	    aiContainer.append(aiButton).append(aiUrl);
        return aiContainer;
    };
    
    /* 
     * return a function which will emit the correct 'move' message for <col> on <socket>
     */
    var clickFnFor = function(col, makeMove) {
        return function(e) {
            makeMove(col);
        }
    };

    /*
     * return the sprite for piece for <player>
     */
    var pieceForPlayer = function(player) {
        if(player == P1) {
            return ui.p1Piece;
        }
        if(player == P2) {
            return ui.p2Piece;
        }
    };
    
    return {
        /*
         * Display message <msg> if it is not empty
         */
        showMsg: function(msg) {
            if(msg && msg != "") {
                ui.msgDiv.text(msg);
            }
        },
        
        showInfo: function(msg) {
            if(msg && msg != "") {
                ui.infoDiv.text(msg);
            }        
        },

        initBoard: function(rows, cols) {
            this.rows = rows;
            this.cols = cols;
        },
        
        resetBoard: function(boardQueryCallback, colClickCallback) {
            ui.boardLayer.empty();
            ui.pieceLayer.empty();
            for(var i = 0; i < this.rows; i++) {
                for(var j = 0; j < this.cols; j++) {
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

                    $("#" + currentSquare).click(clickFnFor(j, colClickCallback));
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
                        posy: -spriteHeight 
            });
            var bottomOfCol = move.row * spriteHeight;
                
            var currentSprite = $("#move" + curPieceId);
            var animStart = new Date().getTime();
            var frameStart = new Date().getTime();
            var posAndVelocity = {pos: -spriteHeight, velocity: 0};
            
            var average = function(a){
                var r = {mean: 0, variance: 0, deviation: 0}, t = a.length;
                for(var m, s = 0, l = t; l--; s += a[l]);
                for(m = r.mean = s / t, l = t, s = 0; l--; s += Math.pow(a[l] - m, 2));
                return r.deviation = Math.sqrt(r.variance = s / t), r;
            }
            var posdiffs = [];
            var dts = [];
            $.playground().registerCallback(function() { 
                var frameEnd = new Date().getTime();
                posAndVelocity = function(posAndVelocity, startTime, endTime) {
                    var dt = endTime - startTime;
                    dts.push(dt);
                    var previous = posAndVelocity.pos;
                    posAndVelocity.pos = posAndVelocity.pos + posAndVelocity.velocity + pieceAcceleration / 2 * (dt * dt);
                    posdiffs.push(posAndVelocity.pos - previous);
                    posAndVelocity.velocity = posAndVelocity.velocity + pieceAcceleration * dt;
                    return posAndVelocity;
                }(posAndVelocity, frameStart, frameEnd);
                
                frameStart = frameEnd;
                var newTop = posAndVelocity.pos;
                if(newTop < bottomOfCol) {
                    currentSprite.css("top", newTop);
                    return false;
                }
                else {
                    currentSprite.css("top", bottomOfCol);
                    var animEnd = (new Date().getTime() - animStart);
                    
                    //console.log("animation finished in: " + animEnd + "ms, final velocity: " + posAndVelocity.velocity + ", avgMove: " + average(posdiffs).mean + ", avgDt: " + average(dts).mean + ", steps: " + dts.length);
                    return true;
                }
                
            }, REFRESH_RATE);
        },
        
        init: function(socket) {
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
           
            ui.AIRandom1 = aiButton(socket, 1, 'http://yoc4.no.de/ai/random/move', 'AI for Player 1');
            $("#controls").append(ui.AIRandom1);

            ui.AIRandom2 = aiButton(socket, 2, 'http://yoc4.no.de/ai/twostep/move', 'AI for Player 2');
            $("#controls").append(ui.AIRandom2);
                        
            ui.msgDiv = $("<div></div>");
            $("#controls").append(ui.msgDiv);
            
            ui.infoDiv = $("<div></div>");
            $("#controls").append(ui.infoDiv);
           
        },
        
        showJoinButtons: function(data) {
            if(data.open.player1) {
                ui.joinButtonP1.show();
                ui.AIRandom1.show();     
            }
            else {
                ui.joinButtonP1.hide(); 
                ui.AIRandom1.hide();
            }
            
            if(data.open.player2) {
                ui.joinButtonP2.show();
                ui.AIRandom2.show();
            }
            else {
                ui.joinButtonP2.hide();
                ui.AIRandom2.hide();
            }    
        }
    };
})();
