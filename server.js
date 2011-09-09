
/**
 * Module dependencies.
 */
var express = require('express');
var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);

var c4engine = require('./engine');

// Configuration

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

var port = 3000;

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
    port = 3000;
});

app.configure('production', function(){
    app.use(express.errorHandler()); 
    port = 80;
});

// Routes

app.get('/', function(req, res){
    res.render('index', {
        title: 'Express'
    });
});

app.get('/c4.js', function(req, res){
    res.sendfile(__dirname + '/c4.js');
});

// Application
var ROWS = 6;
var COLS = 7;

var player1Socket;
var player2Socket;
var currentPlayers = 0;
var turnIdx = 1;

var spectators = []
var currentGame;

var startGame = function() {
    console.log("starting game");
    currentGame = c4engine.newGame(ROWS, COLS);
    
    player1Socket.emit('begin', { msg: 'Game has started, you are player 1. Your turn.', game: currentGame.gameState() });
    player2Socket.emit('begin', { msg: 'Game has started, you are player 2. Waiting for player 1.', game: currentGame.gameState() });
    
    for(var i=0; i<spectators.length; i++) {
        spectators[i].emit('begin', { msg: 'Player 1 to move.', game: currentGame.gameState() });
    }
};

io.sockets.on('connection', function(socket) {
    socket.on('disconnect', function() {
        if(socket == player1Socket) {
            console.log('player 1 left');
            player1Socket = undefined;
        }
        else if(socket == player2Socket) {
            console.log('player 2 left');
            player2Socket = undefined;
        }
        else {
            console.log('some guy left');
            spectators.splice(spectators.indexOf(socket), 1);
        }
    });
    
    socket.on('available', function(data) {
        var openSpot = (currentPlayers < 2);
        var msg;
        if(openSpot) {
            msg = "Click Join to participate in the game";
        }
        else {
            msg = "Game is full, sorry";
            spectators.push(socket);
            console.log("new spectator");
        }
        
        socket.emit('available', { hasOpenSpot: openSpot, msg: msg });
        if(currentGame) {
            socket.emit('begin', { msg: 'Player ' + currentGame.turn + ' to move.', game: currentGame.gameState() });
        }
    });
    
    socket.on('join', function(data) {
        if(player1Socket === undefined) {
            player1Socket = socket;
            currentPlayers = currentPlayers + 1;
            socket.emit('standby', { msg: "you are player 1", playerIdx: 1 });
        }
        else if(player2Socket === undefined) {
            player2Socket = socket;
            currentPlayers = currentPlayers + 1;
            socket.emit('standby', { msg: "you are player 2", playerIdx: 2 });
        }
        else {
            socket.emit('error', { msg: "Game is full, sorry." });
            return;
        }
        if(player1Socket !== undefined && player2Socket !== undefined) {
            startGame();
        }
    });
    
    socket.on('move', function(data) {
        if(socket == player1Socket && currentGame.turn == 2) {
            socket.emit('error', {msg: "Not your turn."});
        }
        if(socket == player2Socket && currentGame.turn == 1) {
            socket.emit('error', {msg: "Not your turn."});
        }
        if(socket != player1Socket && socket != player2Socket) {
            return;
        }
        currentGame.move(data.col);
        
        var p1Msg;
        var p2Msg;
        if(turnIdx == 1) {
            p1Msg = "Your turn.";
            p2Msg = "Opponent is moving.";
            spectatorMessage = "Player 1 to move."
        }
        else if(turnIdx == 2) {
            p1Msg = "Opponent is moving.";
            p2Msg = "Your turn.";
            spectatorMessage = "Player 2 to move."
        }
        player1Socket.emit('move', { msg: p1Msg, game: currentGame.gameState() });
        player2Socket.emit('move', { msg: p2Msg, game: currentGame.gameState() });
        
        for(var i=0; i<spectators.length; i++) {
            spectators[i].emit('move', { msg: spectatorMessage, game: currentGame.gameState() });
        }
    });
    
    var win = function() {
        if(player1Socket === undefined || player2Socket === undefined) {
            return;
        }
        console.log(socket + " thinks they won");
        var winnerSocket;
        var loserSocket;
        if(socket == player1Socket) {
            winnerSocket = player1Socket;
            loserSocket = player2Socket;
        }
        else if(socket == player2Socket) {
            winnerSocket = player2Socket;
            loserSocket = player1Socket;
        }

        if(winnerSocket && loserSocket) {
            winnerSocket.emit("win", {msg: "You win! Refresh to start a new game."});
            loserSocket.emit("lose", {msg: "You lose. Refresh to start a new game."});
        }
        
        player1Socket = undefined;
        player2Socket = undefined; 
        currentPlayers = 0;       
    };
});

app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
