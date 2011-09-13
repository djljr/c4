
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

var player1;
var player2;
var currentPlayers = 0;

var spectators = []; //everyone but player1 and player2
var clients = []; // all connected sockets
var currentGame;

var getStateMessages = function() {
    var p1Msg; var p2Msg; var spectatorMsg;
    if(currentGame.turn == currentGame.P1) {
        p1Msg = "Your turn.";
        p2Msg = "Opponent is moving.";
        spectatorMsg = "Player 1 to move."
    }
    else if(currentGame.turn == currentGame.P2) {
        p1Msg = "Opponent is moving.";
        p2Msg = "Your turn.";
        spectatorMsg = "Player 2 to move."
    }
    
    return { p1Msg: p1Msg, p2Msg: p2Msg, spectatorMsg: spectatorMsg };
};
var startGame = function() {
    if(!currentGame || currentGame.gameOver) {
        currentGame = c4engine.newGame(ROWS, COLS);
    }
    var messages = getStateMessages();
    player1.socket.emit('begin', { spectator: false, msg: messages.p1Msg, game: currentGame.gameState() });
    player2.socket.emit('begin', { spectator: false, msg: messages.p2Msg, game: currentGame.gameState() });
    
    spectators = [];
    for(var i=0; i<clients.length; i++) {
        if(clients[i] == player1.socket || clients[i] == player2.socket) { continue; }
        spectators.push(clients[i]);
        clients[i].emit('begin', { spectator: true, msg: messages.spectatorMsg, game: currentGame.gameState() });
    }
    
};

var getOpenSlots = function () {
    return { player1: (player1 === undefined), player2: (player2 === undefined) };
};

io.sockets.on('connection', function(socket) {
    socket.on('disconnect', function() {
        var msg = "";
        if(player1 && socket == player1.socket) {
            player1 = undefined;
            msg = "Player 1 left, waiting for a new challenger";
        }
        else if(player2 && socket == player2.socket) {
            player2 = undefined;
            msg = "Player 2 left, waiting for a new challenger";
        }
        else {
            console.log('some guy left');
            spectators.splice(spectators.indexOf(socket), 1);
        }
        clients.splice(clients.indexOf(socket), 1);
        for(var i=0; i<clients.length; i++) {
            clients[i].emit('leave', {open: getOpenSlots(), msg: msg});
        }
    });
    
    socket.on('available', function(data) {
        var open = getOpenSlots();
        
        socket.emit('available', { open: open, msg: "Waiting for players" });
        
        clients.push(socket);
        if(currentGame) {
            spectators.push(socket);
            console.log("new spectator");            
            socket.emit('begin', { spectator: true, msg: 'Player ' + currentGame.turn + ' to move.', game: currentGame.gameState() });
        }
    });
    
    socket.on('join', function(data) {
        var open = getOpenSlots();
        if(data.player == 1 && open.player1 == true) {
            player1 = {socket: socket};
            socket.emit('standby', { msg: "You are player 1, waiting for other player to join.", playerIdx: 1, open: open });
        }
        else if(data.player == 2 && open.player2 == true) {
            player2 = {socket: socket};
            socket.emit('standby', { msg: "You are player 2, waiting for other player to join.", playerIdx: 2, open: open });
        }
        else {
            socket.emit('error', { msg: "Game is full, sorry." });
            return;
        }
        
        open = getOpenSlots();
        for(var i = 0; i < clients.length; i++) {
            if(clients[i] == socket) { continue; }
            clients[i].emit('join', {player: data.player, open: open});
        }
        if(open.player1 == false && open.player2 == false) {
            startGame();
        }
    });
    
    socket.on('move', function(data) {
        if(!player1 || !player2) {
            return;
        }
        if(socket == player1.socket && currentGame.turn == 2) {
            socket.emit('error', {msg: "Not your turn."});
            return;
        }
        else if(socket == player2.socket && currentGame.turn == 1) {
            socket.emit('error', {msg: "Not your turn."});
            return;
        }
        else if(socket != player1.socket && socket != player2.socket) {
            return;
        }
        var open = getOpenSlots();
        console.log(open);
        if(open.player1 == true || open.player2 == true) {
            socket.emit('error', {msg: "Not enough players."});
            return;
        }
        currentGame.move(data.col);
        
        var messages = getStateMessages();

        player1.socket.emit('move', { msg: messages.p1Msg, game: currentGame.gameState() });
        player2.socket.emit('move', { msg: messages.p2Msg, game: currentGame.gameState() });
        
        for(var i=0; i<spectators.length; i++) {
            spectators[i].emit('move', { msg: messages.spectatorMsg, game: currentGame.gameState() });
        }
        
        if(currentGame.gameOver) {
            win();
        }
    });
    
    var win = function() {
        console.log("we have a winner: " + currentGame.gameOver);
        if(player1 === undefined || player2 === undefined) {
            return;
        }

        var winner;
        var loser;
        if(currentGame.gameOver == 1) {
            winner = player1;
            loser = player2;
        }
        else if(currentGame.gameOver == 2) {
            winner = player2;
            loser = player1;
        }
        
        console.log("winner: " + winner);
        console.log("loser:  " + loser);
        player1 = undefined;
        player2 = undefined;
        
        var open = getOpenSlots();

        if(winner && loser) {
            winner.socket.emit("win", {msg: "You win!", open: open});
            loser.socket.emit("lose", {msg: "You lose.", open: open});
            for(var i=0; i<spectators.length; i++) {
                spectators[i].emit("gameover", {msg: "Game over", open: open});
            }
        }
    };
});

app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
