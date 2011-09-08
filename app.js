
/**
 * Module dependencies.
 */
var express = require('express');
var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);

// Configuration

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
    app.use(express.errorHandler()); 
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

var player1Socket;
var player2Socket;
var currentPlayers = 0;
var turnIdx = 1;

var startGame = function() {
    console.log("starting game");
    player1Socket.emit('begin', { msg: 'Game has started, you are player 1. Your turn.', currentTurn: turnIdx });
    player2Socket.emit('begin', { msg: 'Game has started, you are player 2. Waiting for player 1.', currentTurn: turnIdx });
};

io.sockets.on('connection', function(socket) {
    socket.on('join', function(data) {
        console.log('join: ' + data);
    });
    socket.on('available', function(data) {
        var openSpot = (currentPlayers < 2);
        var msg;
        if(openSpot) {
            msg = "Click Join to participate in the game"
        }
        else {
            msg = "Game is full, sorry";
        }
        
        socket.emit('available', { hasOpenSpot: openSpot, msg: msg });
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
        }
        if(player1Socket !== undefined && player2Socket !== undefined) {
            startGame();
        }
    });
    socket.on('move', function(data) {
        if(socket == player1Socket && turnIdx == 2) {
            socket.emit('error', {msg: "Not your turn."});
        }
        if(socket == player2Socket && turnIdx == 1) {
            socket.emit('error', {msg: "Not your turn."});
        }
        turnIdx = (turnIdx % 2) + 1;
        player1Socket.emit('move', {col: data.col, nextTurn: turnIdx});
        player2Socket.emit('move', {col: data.col, nextTurn: turnIdx});        
    });
    socket.on('iwin', function(data) {
        console.log(socket + " thinks they won");
        player1Socket.emit("win", {msg: "you win!"});
        player2Socket.emit("lose", {msg: "you lose"});
    });
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
