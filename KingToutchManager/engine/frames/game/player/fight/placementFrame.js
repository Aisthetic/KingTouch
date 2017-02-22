var EventWrapper = require("event-wrapper");
exports.processPlacement = function(bot,rapprocher,cb,dontSayReady){
	var fightInformations = {fighters:{}};
	var isReady = false;
	var starting = true;
	var wrap = EventWrapper(bot.connection,function(error){

	});
	wrap("GameFightPlacementPossiblePositionsMessage",function(m){
		if(m.teamNumber == 0){
			fightInformations.placements = m.positionsForChallengers;
		}
		else{
			fightInformations.placements =	m.positionsForDefenders;
		}
	});
	wrap("GameEntitiesDispositionMessage",function(m){
		for(var i in m.dispositions){
			fightInformations.fighters[m.dispositions.id] = m.dispositions[i].dispositions;
			console.log("fight placement updated !");
		}
	});
	wrap("BasicNoOperationMessage",function(m){
		var self=this;
		if(starting){
			starting=false;
			//processPlacement();
			isReady=true;
		}
		if(isReady){
			isReady=false;
			setTimeout(function(){self.bot.connection.sendMessage("GameFightReadyMessage"); },20)
			self.bot.logger.log("On est prét !");
			wrap.done();
		}
	});
	wrap("GameFightJoinMessage",function(m){
		fightInformations.
	});
	
	function processPlacement(){
		isReady=true;
		var minDist = 
		for (var i = 0; i< fightInformations.placements.length;i++){
			var isSelectable=true;
			var place = fightInformations.placement[i];
			
			for(var i in fightInformations.fighters){
				if(place == fightInformations.fighters[i].dispositions.cellId){
					isSelectable=false;
				}
			}
			
		}
	}
	
	function getNearsetEnnemie(cell){
		for (var i in fightInformations.fighters){
			//if()
		}
	}
}