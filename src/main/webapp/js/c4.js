
var init = function($) {
    var HEIGHT = 480;
    var WIDTH = 800;

    
    var boardSquare = new $.gameQuery.Animation({ imageURL: "images/sprites.png",
                                            numberOfFrame: 1,
                                            type: $.gameQuery.ANIMATION_ONCE,
                                            offsetx: 0,
                                            offsety: 0});

    var p1Piece = new $.gameQuery.Animation({ imageURL: "images/sprites.png",
                                            numberOfFrame: 1,
                                            type: $.gameQuery.ANIMATION_ONCE,
                                            offsetx: 80,
                                            offsety: 0});
                                            
    var p2Piece = new $.gameQuery.Animation({ imageURL: "images/sprites.png",
                                            numberOfFrame: 1,
                                            type: $.gameQuery.ANIMATION_ONCE,
                                            offsetx: 160,
                                            offsety: 0});
                                            
    $("#gameboard").playground({height: HEIGHT, width: WIDTH})
        .addGroup("boardsquares", {height: HEIGHT, width: WIDTH});
    
    var spriteWidth = 80;
    var spriteHeight = 57;
    
    var boardSprite = $("#boardsquares");
    
    for(var i = 0; i < 7; i++) {
        for(var j = 0; j < 6; j++) {
            boardSprite.addSprite(i + "x" + j, {animation: boardSquare, width: spriteWidth, height: spriteHeight, posx: i * spriteWidth, posy: j * spriteHeight});        
        }
    }

    $.playground().startGame();
};

jQuery(document).ready(init);
