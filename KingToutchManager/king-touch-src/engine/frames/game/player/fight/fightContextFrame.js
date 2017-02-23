var EventWrapper = require("event-wrapper");

exports.processFightContextFrame = function(bot){
	var self = this;
	wrap = EventWrapper(bot.connection.dispatcher,function(error){
		if(typeof error != "undefined"){
			console.log("Error in fightContextFrame wtf !!!! "+error);
		}
	});
	wrap("SequenceEndMessage",function(m){
		if(m.authorId == bot.data.characterInfos.contextualId){
			sequenceStarted = false;
			bot.connection.sendMessage("GameActionAcknowledgementMessage",{valid:true, actionId:m.actionId});
			console.log("Ack ready !");
		}
	});
	wrap("GameFightTurnReadyRequestMessage",function(m){
		if(m.id == bot.data.characterInfos.contextualId) bot.data.fightManager.dispatcher.emit("turnEnd");
		bot.connection.sendMessage("GameActionAcknowledgementMessage",{valid: true, actionId: 3});
		bot.connection.sendMessage("GameFightTurnReadyMessage",{isReady: true});
		console.log("Turn ready ...");
	});
	wrap("GameFightEndMessage",function(m){
	/*	var fightResult = "On a perdu le combat !";
		for(var i = 0; i<m.results.length; i++){
			var result = m.results[i];
			if(result.id == bot.data.characterInfos.contextualId){
				fightResult="On a gagner le fight ^^";
			}
		}
		bot.logger.log(fightResult);//todo faire sa bien ^^*/
		console.log("Combat terminer !");
	});
}
