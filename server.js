
/**
 * Module dependencies.
 */
var express = require('express');
var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);
var http = require('http');
var url = require('url');

var c4engine = require('./engine');

var randomAi = require('./random_ai');

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

app.use(express.bodyParser());

// Routes
app.get('/', function(req, res){
    res.render('index', {
        title: 'Express'
    });
});

app.post('/ai/random/move', function(req, res) {
    //TODO: res.end(randomAi.move(req.body));
});

// Classes
var HumanPlayer = function(socket, playerIdx, moveCallback) {
    this.socket = socket;
    this.playerIdx = playerIdx;
    this.moveCallback = moveCallback;
};

HumanPlayer.prototype.begin = function(msg, state) {
    this.socket.emit('begin', { spectator: false, msg: msg[this.playerIdx], game: state });
};

HumanPlayer.prototype.error = function(msg) {
    this.socket.emit('error', { msg: msg });
};

HumanPlayer.prototype.standby = function(open) {
    this.socket.emit('standby', { msg: "You are player " + this.playerIdx + ", waiting for other player to join.", playerIdx: this.playerIdx, open: open });
};

HumanPlayer.prototype.join = function(player, open) {
    this.socket.emit('join', {player: player, open: open});
};

HumanPlayer.prototype.move = function(msg, state) {
    this.socket.emit('move', { msg: msg[1], game: state });
};

HumanPlayer.prototype.makeMove = function(col) {
    this.moveCallback(col);
};

var Spectator = function(socket) { 
    this.socket = socket;
};

Spectator.prototype.begin = function(msg, state) {
    this.socket.emit('begin', { spectator: true, msg: msg.spectator, game: state });
};

Spectator.prototype.available = function(open) {
    this.socket.emit('available', { open: open, msg: "Waiting for players" });
};

Spectator.prototype.join = function(player, open) {
    this.socket.emit('join', {player: player, open: open});
};

Spectator.prototype.move = function(msg, state) {
    this.socket.emit('move', { msg: msg.spectator, game: state });
};

var ComputerPlayer = function(moveUrl, playerIdx, moveCallback) {
    this.playerIdx = playerIdx;
    this.moveUrl = url.parse(moveUrl);
    this.moveCallback = moveCallback;
};

ComputerPlayer.prototype.join = function() {};
ComputerPlayer.prototype.begin = function() {};

ComputerPlayer.prototype.move = function(msg, state) {
    console.log('move!');
    if(state.currentTurn == this.playerIdx) {
        var mc = this.moveCallback;
        var callback = function(move) {
            mc(parseInt(move));
        };

        this.makeRequest(state, callback);
    }
};

ComputerPlayer.prototype.makeRequest = function(state, callback) { 
    var options = {
        host: this.moveUrl.hostname,
        port: this.moveUrl.port,
        path: this.moveUrl.pathname,
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'POST'
    };
    
    var req = http.request(options, function(res) {
        res.on('data', callback);
    });
    
    req.end(JSON.stringify(state));
};

// Application
var ROWS = 6;
var COLS = 7;

var player1;
var player2;

var spectators = []; //everyone but player1 and player2
var clients = []; // all connected sockets
var currentGame;

var getStateMessages = function() {
    var p1Msg; var p2Msg; var spectatorMsg;
    console.log(currentGame.gameOver);
    if(currentGame.gameOver) {
        p1Msg = "Waiting for players.";
        p2Msg = "Waiting for players.";
        spectatorMsg = "Waiting for players.";        
    }
    else if(currentGame.turn == currentGame.P1) {
        p1Msg = "Your turn.";
        p2Msg = "Opponent is moving.";
        spectatorMsg = "Player 1 to move."
    }
    else if(currentGame.turn == currentGame.P2) {
        p1Msg = "Opponent is moving.";
        p2Msg = "Your turn.";
        spectatorMsg = "Player 2 to move."
    }
    
    return { 1: p1Msg, 2: p2Msg, spectator: spectatorMsg };
};

var startGame = function() {
    if(!currentGame || currentGame.gameOver) {
        currentGame = c4engine.newGame(ROWS, COLS);
    }
    var messages = getStateMessages();

    for(var i=0; i<clients.length; i++) {
        clients[i].begin(messages, currentGame.gameState());
    }
    
};

var getOpenSlots = function () {
    return { player1: (player1 === undefined), player2: (player2 === undefined) };
};

var indexBySocket =  function(list, socket) {
    for(var i=0; i<list.length; i++) {
        if(list[i].socket == socket) { 
            return i;
        }
    }
}

var removeBySocket = function(list, socket) {
    list.splice(indexBySocket(list, socket), 1);
};

var isMyTurn = function(socket) {
    if(!player1 || !player2) {
        return false;
    }
    
    if(socket == player1.socket && currentGame.turn == 2) {
        return false;
    }
    
    if(socket == player2.socket && currentGame.turn == 1) {
        return false;
    }
    
    if(socket != player1.socket && socket != player2.socket) {
        return false;
    }
    
    return true;
};

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
        removeBySocket(clients, socket);
        
        for(var i=0; i<clients.length; i++) {
            clients[i].emit('leave', {open: getOpenSlots(), msg: msg});
        }
    });
    
    socket.on('available', function(data) {
        var open = getOpenSlots();        
        var spectator = new Spectator(socket)
        spectator.available(open);
        clients.push(spectator);
        if(currentGame) {
            var messages = getStateMessages();
            spectator.begin(messages, currentGame.gameState());
        }
    });

    var makeMove = function(player, col) {
        if(player != currentGame.turn) { return; }
        
        currentGame.move(col);
        
        var messages = getStateMessages();
        
        for(var i=0; i<clients.length; i++) {
            clients[i].move(messages, currentGame.gameState());
        }
        
        if(currentGame.gameOver) {
            win();
        }
    }
       
    var moveCallback = function(player) {
        return function(col) {
            makeMove(player, col);
        };
    };
    
    socket.on('ai', function(data) {
        var open = getOpenSlots();
        var computer;
        if(data.player == 1 && open.player1) {
            computer = player1 = new ComputerPlayer(data.baseUrl, 1, moveCallback(1));
            open.player1 = false;
        }
        else if(data.player == 2 && open.player2) {
            computer = player2 = new ComputerPlayer(data.baseUrl, 2, moveCallback(2));       
            open.player2 = false;
        }
        else {
            socket.emit('error', { msg: "Game is full, sorry." });
            return;
        }

        for(var i = 0; i < clients.length; i++) {
            clients[i].join(data.player, open);
        }
        
        clients.push(computer);
        console.log('ai message: ' + clients.length);
        if(open.player1 == false && open.player2 == false) {
            startGame();
        }        
    });
    
    socket.on('join', function(data) {
        var open = getOpenSlots();
        var player;
        if(data.player == 1 && open.player1) {
            player = player1 = new HumanPlayer(socket, 1, moveCallback(1));
            open.player1 = false;
        }
        else if(data.player == 2 && open.player2) {
            player = player2 = new HumanPlayer(socket, 2, moveCallback(2));
            open.player2 = false;
        }
        else {
            socket.emit('error', { msg: "Game is full, sorry." });
            return;
        }     
        player.standby(open);
        
        removeBySocket(clients, socket)
        //inform everyone else of the new contender
        for(var i = 0; i < clients.length; i++) {
            clients[i].join(data.player, open);
        }
        
        clients.push(player);
        console.log('join message: ' + clients.length);
        if(!open.player1 && !open.player2) {
            startGame();
        }
    });
    
    socket.on('move', function(data) {
        if(!isMyTurn(socket)) {
            socket.emit('error', {msg: "Not your turn."});
            return;
        }
        
        var open = getOpenSlots();
        if(open.player1 == true || open.player2 == true) {
            socket.emit('error', {msg: "Not enough players."});
            return;
        }
        
        console.log('numclients: ' + clients.length);
        
        var idx = indexBySocket(clients, socket);
        console.log(idx);
                
        clients[idx].makeMove(data.col);
    });
});

app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
