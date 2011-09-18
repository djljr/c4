var Engine = (function(io) {
    //game constants
    var EMPTY = 0;
    var P1 = 1;
    var P2 = 2;

    var startGame = function(socket, rows, cols, board) {
        var boardQueryCallback = function(i, j) {
            return board[j][i];
        }
        var makeMove = function(col) {
            if(!Engine.game.spectator && Engine.game.turnIdx == Engine.game.thisPlayer) {
                socket.emit('move', { col: col });
            }
        }
        UI.initBoard(rows, cols);
        UI.resetBoard(boardQueryCallback, makeMove);
        UI.startGame();            
    };
    
    return {
        // game state    
        game: { spectator: true, gameOn: false, turnIdx: 0, thisPlayer: 0 },
        init: function() {       
            var showJoinButtons = function(data) {
                if(!Engine.game.spectator) { //only spectators are allowed to join
                    data.open.player1 = false;
                    data.open.player2 = false;
                }
                
                UI.showJoinButtons(data);
            };
                
            //Communication stuff
            var socket = io.connect('/');
            UI.init(socket);
            
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
                Engine.game.thisPlayer = data.playerIdx;
                Engine.game.spectator = false;
                showJoinButtons(data);
                UI.showMsg(data.msg);
            });
            socket.on('begin', function(data) {
                Engine.game.gameOn = true;
                Engine.game.spectator = data.spectator;
                UI.showMsg(data.msg); 
                Engine.game.turnIdx = data.game.currentTurn;
                startGame(socket, data.game.rows, data.game.cols, data.game.board)
            });
            socket.on('move', function(data) {
                UI.showMsg(data.msg); 
                UI.dropPiece(data.game.lastMove);
                Engine.game.turnIdx = data.game.currentTurn;
            });
            socket.on('gameover', function(data) {
                Engine.game.gameOn = false;
                Engine.game.spectator = true;        
                UI.showMsg(data.msg);
                showJoinButtons(data);
            });
            
            socket.emit('available');
        }
    };
})(io);

if(exports) {
    exports.Engine = Engine;
}
