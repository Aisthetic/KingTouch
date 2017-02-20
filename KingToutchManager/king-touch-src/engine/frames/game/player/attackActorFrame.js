var EventWrapper = require("event-wrapper");
var processKeyMovement = require("./movementFrame.js").processKeyMovement;
var compressPath = require("./../../../core/utils/pathfinding.js").compressPath;

exports.processAttackActor = function(bot,keyMovements,callBack){
	var wrap = EventWrapper(bot.connection.dispatcher,function(result){
	});

	wrap("GameMapNoMovementMessage",function(m){
		wrap.done(false);
	});
	wrap("GameContextCreateMessage",function(m){
		bot.logger.log("Attack actor succes !");
		wrap.done();
		callBack(true);
	});
	
	processKeyMovement(bot,keyMovements,function(result){
		console.log("Movement proccesed");
	});
}
