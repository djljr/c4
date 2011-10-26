var engine = require('../engine');
var AIUtils = require('./aiutils');

var Utils = engine.Utils;

exports.move = function(state, moves) {
    var legalMoves = Utils.findLegalMoves(state.board);
    var move = legalMoves[0];
    if(state.moveNumber < moves.length) {
        var tmpMove = parseInt(moves[state.moveNumber]);
        if(legalMoves.indexOf(tmpMove) >= 0) {
            move = tmpMove;
        }
    }
    return move;
};
