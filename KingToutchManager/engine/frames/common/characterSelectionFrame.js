var EventWrapper = require('event-wrapper');
exports.processsCharacterSelection = function(logger,connection,reconnecting,cb){
	var noOperationIndex = 0;
	logger.log("[processsCharacterSelection]...")
	wrap = EventWrapper(connection.dispatcher,function(error){
		if(typeof error =="undefined"){
			logger.log("[processsCharacterSelection]OK","success")
		}
		else{
			logger.log("[processsCharacterSelection]"+error,"error");
		}
	});
	wrap("CharactersListMessage",function(m){
		if(m.characters.length <=0 ){
			wrap.done("No characters found !");
		}
		else{
			logger.log("Selecting frist character ("+m.characters[0].name+") ...");
			connection.sendMessage("CharacterSelectionMessage",{id:m.characters[0].id});
		}
	});
	wrap("BasicNoOperationMessage",function(m){
		if(noOperationIndex==0){
			if(reconnecting){
				logger.log("Reconnecting ready !");
				connection.sendMessage("CharacterSelectedForceReadyMessage");
			}
			else{
				logger.log("Request for characters ...");
				connection.sendMessage("CharactersListRequestMessage");
			}
		}
		noOperationIndex++;
	});
}
