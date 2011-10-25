
/**
 * Module dependencies.
 */
var express = require('express');
var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);
var http = require('http');
var url = require('url');

var c4engine = require('./engine');
var Utils = c4engine.Utils;

var randomAi = require('./ais/random_ai');
var twoStepAi = require('./ais/twostep_ai');

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
    var move = randomAi.move(req.body);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({move: move}));
});

app.post('/ai/twostep/move', function(req, res) {
    var move = twoStepAi.move(req.body);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({move: move}));
});

// Classes
var HumanPlayer = function(socket) {
    this.socket = socket;
    this.playerIdx = "spectator";
    this.spectator = true;
};

HumanPlayer.prototype.joinGame = function(playerIdx, moveCallback) {
    this.moveCallback = moveCallback;
    this.playerIdx = playerIdx;
    this.spectator = false;
};

HumanPlayer.prototype.joinSpectators = function() {
    this.playerIdx = "spectator";
    this.spectator = true;
};

HumanPlayer.prototype.begin = function(msg, state) {
    this.socket.emit('begin', { spectator: this.spectator, msg: msg[this.playerIdx], game: state });
};

HumanPlayer.prototype.available = function(open) {
    this.socket.emit('available', { open: open, msg: "Waiting for players" });
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
    this.socket.emit('move', { msg: msg[this.playerIdx], game: state });
};

HumanPlayer.prototype.makeMove = function(col) {
    this.moveCallback(col);
};

HumanPlayer.prototype.gameover = function(winner, loser, open) {
    if(winner == this.playerIdx) {
        this.socket.emit("gameover", {msg: "You win!", open: open});
    }
    else if (loser == this.playerIdx) {
        this.socket.emit("gameover", {msg: "You lose.", open: open});
    }
    else if (winner == 'tie') {
        this.socket.emit("gameover", {msg: "It's a tie.", open: open});
    }
    else {
        this.socket.emit('gameover', {msg: "Game over. Player " + winner + " wins.", open: open});
    }
};

HumanPlayer.prototype.leave = function(msg, open) {
    this.socket.emit('leave', {msg: msg, open:open});
};

HumanPlayer.prototype.toString = function() {
    return "Human Player " + this.playerIdx;
};

var ComputerPlayer = function(moveUrl, playerIdx, moveCallback) {
    this.playerIdx = playerIdx;
    this.moveUrl = url.parse(moveUrl);
    this.moveCallback = moveCallback;
};

ComputerPlayer.prototype.join = function() {};
ComputerPlayer.prototype.begin = function() {};
ComputerPlayer.prototype.gameover = function() {};
ComputerPlayer.prototype.leave = function() {};
ComputerPlayer.prototype.joinSpectators = function() {};
ComputerPlayer.prototype.valid = function() {
    if(this.moveUrl.hostname === undefined) {
        return false;
    }
    
    return true;
};
ComputerPlayer.prototype.move = function(msg, state) {  
    if(state.currentTurn == this.playerIdx) {
        var mc = this.moveCallback;
        var callback = function(moveJson) {
            var move = moveJson.move;
            mc(move);
        };

        var that = this;
        setTimeout(function() { that.makeRequest.call(that, state, callback) }, 500);
    }
};

ComputerPlayer.prototype.makeRequest = function(state, callback) {
    var options = {
        host: this.moveUrl.hostname,
        port: this.moveUrl.port,
        path: this.moveUrl.pathname,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        },
        method: 'POST'
    };

    var req = http.request(options, function(res) {
        res.on('data', function(data) {
            callback(JSON.parse(data));
        });
    });
    
    req.end(JSON.stringify(state));
};

ComputerPlayer.prototype.toString = function() {
    return "Computer Player " + this.playerIdx;
};

// Application
var ROWS = 6;
var COLS = 7;

var player1;
var player2;

var clients = []; // all connected sockets
var currentGame;

var getStateMessages = function() {
    var p1Msg; var p2Msg; var spectatorMsg;
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
    
    player1.move(messages, currentGame.gameState());
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
    var idx = indexBySocket(list, socket);
    if(idx) {
        list.splice(idx, 1);
    }
};

var removeComputerPlayers = function(list) {
    return list.filter(function(el, ix, arr) {
        return !(el instanceof ComputerPlayer);
    });
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
    if(player1 === undefined || player2 === undefined) {
        return;
    }

    player1.joinSpectators();
    player2.joinSpectators();
    
    player1 = undefined;
    player2 = undefined;
    
    var open = getOpenSlots();

    for(var i=0; i<clients.length; i++) {
        clients[i].gameover(currentGame.gameOver, Utils.nextPlayer(currentGame.gameOver), open);
    }
    
    clients = removeComputerPlayers(clients);
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

        removeBySocket(clients, socket);

        for(var i=0; i<clients.length; i++) {
            clients[i].leave(msg, getOpenSlots());
        }
    });
    
    socket.on('available', function(data) {
        var open = getOpenSlots();        
        var spectator = new HumanPlayer(socket)
        spectator.available(open);
        clients.push(spectator);
        
        if(currentGame) {
            var messages = getStateMessages();
            spectator.begin(messages, currentGame.gameState());
        }
    });

    var makeMove = function(player, col) {
        if(player != currentGame.turn) { return; }
        var open = getOpenSlots();
        if(open.player1 || open.player2) { return; }
        
        currentGame.move(col);
        
        var messages = getStateMessages();
        
        for(var i=0; i<clients.length; i++) {
            clients[i].move(messages, currentGame.gameState());
        }
        
        if(currentGame.gameOver) {
            win();
        }
    };
       
    var moveCallback = function(player) {
        return function(col) {
            makeMove(player, col);
        };
    };
    
    socket.on('ai', function(data) {
        var open = getOpenSlots();
        var computer;
        if(data.player == 1 && open.player1) {
            computer = new ComputerPlayer(data.baseUrl, 1, moveCallback(1));
            if(!computer.valid()) {
                socket.emit('error', { msg: "AI is not valid." });            
                return;
            }
            player1 = computer;
            open.player1 = false;
        }
        else if(data.player == 2 && open.player2) {
            computer = new ComputerPlayer(data.baseUrl, 2, moveCallback(2));
            if(!computer.valid()) {
                socket.emit('error', { msg: "AI is not valid." });            
                return;
            }        
            player2 = computer;           
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
        if(open.player1 == false && open.player2 == false) {
            startGame();
        }
    });
    
    socket.on('join', function(data) {
        var open = getOpenSlots();
        var myIndex = indexBySocket(clients, socket);
        var player = clients[myIndex];
        if(data.player == 1 && open.player1) {
            player.joinGame(1, moveCallback(1));
            player1 = player;
            open.player1 = false;
        }
        else if(data.player == 2 && open.player2) {
            player.joinGame(2, moveCallback(2));
            player2 = player;
            open.player2 = false;
        }
        else {
            socket.emit('error', { msg: "Game is full, sorry." });
            return;
        }     
        player.standby(open);
        
        //inform everyone else of the new contender
        for(var i = 0; i < clients.length; i++) {
            clients[i].join(data.player, open);
        }
        
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
        if(open.player1 || open.player2) {
            socket.emit('error', {msg: "Not enough players."});
            return;
        }
        
        var idx = indexBySocket(clients, socket);
        clients[idx].makeMove(data.col);
    });
});

app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
