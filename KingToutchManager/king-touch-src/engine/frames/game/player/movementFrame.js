var ANIM_DURATION = {
	mounted: { linear: 135, horizontal: 200, vertical: 120, symbolId: 'AnimCourse' },
	parable: { linear: 400, horizontal: 500, vertical: 450, symbolId: 'FX' },
	running: { linear: 170, horizontal: 255, vertical: 150, symbolId: 'AnimCourse' },
	walking: { linear: 480, horizontal: 510, vertical: 425, symbolId: 'AnimMarche' },
	slide:   { linear:  57, horizontal:  85, vertical:  50, symbolId: 'AnimStatique' }
};

var EventWrapper = require('event-wrapper');
var compressPath = require("./../../../core/utils/pathfinding.js").compressPath;
var getCellId = require("./../../../core/utils/pathfinding.js").getC
var getCellsWithDirection = require("./../../../core/utils/pathfinding.js").getCellsWithDirection;
exports.processKeyMovement = function(bot,keyMovements,callBack,dontConfirm){
	if(typeof dontConfirm == "undefined"){
		dontConfirm=false;
	}
	var wrap = EventWrapper(bot.connection.dispatcher,function(result){
		callBack(result);
	});

	wrap("GameMapNoMouvementMessage",function(m){
		console.log("no mouvement");
		done(false)
	});
	wrap("GameMapMovementMessage",function(m){
		if(m.actorId == bot.data.characterInfos.id){
            console.log("MapMovement received !");
			var moveMode =1;
			var timeOut =  100; //getMovementDuration(keyMovements);
            console.log("Confirmation du movement dans : "+timeOut+ "("+keyMovements.length+" cells)");

			setTimeout(function(){
				if(bot.data.context == "ROLEPLAY") bot.data.state="READY";
				if(dontConfirm){
					console.log("Mouvement efectuer, aucune confimation !");
				}
				else{
					bot.connection.sendMessage("GameMapMovementConfirmMessage");
					console.log("Mouvement confirmée !");
				}
				
				wrap.done(true);
			},timeOut);
			console.log("Confirmations du mouvement dans "+timeOut+"ms");
		}
	});
	console.log("Sending map request !");
	bot.connection.sendMessage("GameMapMovementRequestMessage",{keyMovements:compressPath(keyMovements),mapId:bot.data.mapManager.mapId});


}

function getMovementDuration(path,isGhost){
    var motionSheme;
    console.log("Calculating duration ("+path.length+")...");
    if(typeof isGhost != "undefined" && isGhost === 1){
        motionSheme = ANIM_DURATION.slide;
    }
    else if(path.length > 3){
        motionSheme = ANIM_DURATION.running;
    }
    else{
        motionSheme = ANIM_DURATION.walking;
    }
    
    console.log(motionSheme);
    
    var direction;
    var prevX;
	var prevY;
    var total = 0;
    for (var i = 0; i < path.length; i++) {
        var coord = getMapPoint(path[i]);
        console.log(coord);
        var duration;
        if (i === 0) {
			direction = 1;
		} 
        else {
			if (coord.y === prevY) {
				// move horizontaly
				duration = motionScheme.horizontal;
				direction = coord.x > prevX ? 0 : 4;
			} else if (coord.x === prevX) {
				// move verticaly
				duration = motionScheme.vertical;
				direction = coord.y > prevY ? 2 : 6;
			} else {
				// move in diagonal
				duration = motionScheme.linear;
				if (coord.x > prevX) {
					direction = coord.y > prevY ? 1 : 7;
				} else {
					direction = coord.y > prevY ? 3 : 5;
				}
			}
		}
        console.log(duration+" ms added to confirmation dellay");
        total += duration;
    }
    
    return total;
}