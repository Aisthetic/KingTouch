var EventWrapper = require('event-wrapper');
var compressPath = require("./../../../../core/utils/pathfinding.js").compressPath;
exports.processKeyMovement = function(bot,keyMovements,callBack){
	var wrap = EventWrapper(bot.connection.dispatcher,function(result){
		callBack(result);
	});
	wrap("GameMapNoMovementMessage",function(m){
		console.log("No movement .");
		wrap.done(false)
	});
	wrap("SequenceEndMessage",function(m){
		console.log("Movement ok .");
		wrap.done(true);
	});
	bot.connection.sendMessage("GameMapMovementRequestMessage",{keyMovements:compressPath(keyMovements),mapId:bot.data.mapManager.mapId});
}
