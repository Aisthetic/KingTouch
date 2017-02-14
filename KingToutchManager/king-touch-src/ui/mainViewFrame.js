var configManager = require("./../engine/managers/configManager.js");
var workingConection;
var botsManager;
var uiConnection;
exports.listen = function(connection,manager){
	workingConection=connection;
	botsManager=manager;
	uiConnection=connection;
	uiConnection.on("connectClient",function(accompt){
		var workingBotInfos = botsManager.connectClient(accompt,"Aucun groupe");
		BindBotToUI(botsManager.getClient(workingBotInfos.groupeName,workingBotInfos.clientId));
		uiConnection.send("clientLoaded",{ 
			identifier : workingBotInfos,
			characterInfos : { name : "[Déconnectés]" , level : 0 }
		});
	});
	uiConnection.on("globalUpdateRequest",function(m){
		uiConnection.send("globalUpdate",{ bots: botsManager.getClientsInformations() });
	});
	manager.on("reconnect",function(bot){
		BindBotToUI(bot);
	});
}

function BindBotToUI(bot){
	//Bot->UI
	bot.logger.dispatcher.on("log",function(logData){
		uiConnection.send(getIndicator(bot.data)+"log",logData);
	});
	bot.data.dispatcher.on("characterSelected",function(data){
		console.log("[BotData]Character updated");
		uiConnection.send(getIndicator(bot.data)+"characterSelected",data);
	});
	/*bot.connection.dispatcher.on("packetSend",function(packet){
		uiConnection.send(getIndicator(bot.data)+"packetSend",packet);
	});
	bot.connection.dispatcher.on("packetReceive",function(packet){
		uiConnection.send(getIndicator(bot.data)+"packetReceive",packet._messageType);
	});*/
	bot.data.fightManager.dispatcher.on("spellsLoaded",function(spells){
		console.log("send spell to ui...");
		uiConnection.send(getIndicator(bot.data)+"spellsLoaded",spells);
	});
	//[mapView]
	bot.data.dispatcher.on("mapLoaded",function(loadedMap){
		uiConnection.send(getIndicator(bot.data)+"mapLoaded",loadedMap);
	});
	//[mapView]actors update in fight mode
	bot.data.fightManager.dispatcher.on("syncronized",function(fighters){
		uiConnection.send(getIndicator(bot.data)+"actorsUpdate",fighters);
	});
	bot.data.fightManager.dispatcher.on("fighterUpdated",function(actor){
		uiConnection.send(getIndicator(bot.data)+"actorUpdate",actor);
	});
	//[mapView]actors update in rp mode
	bot.data.actorsManager.dispatcher.on("actorsLoaded",function(actors){
		uiConnection.send(getIndicator(bot.data)+"actorsUpdate",actors);
	});
	bot.data.actorsManager.dispatcher.on("actorUpdated",function(actor){
		uiConnection.send(getIndicator(bot.data)+"actorUpdate",actor);
	});
	//UI->Bot
	uiConnection.on(getBotRequest(bot.data,"trajetLoad"),function(m){
		console.log("Loading trajet ... ");
		bot.trajet.load(m);
	});
	uiConnection.on(getBotRequest(bot.data,"savePile"),function(m){
		bot.data.userConfig.fight.spells = m;
		configManager.saveConfig(bot.data.characterInfos.name,bot.data.userConfig);
		bot.logger.log("Pile de sorts charger !");
	});

}
function getIndicator(botData){
	return botData.clientGroupe+":"+botData.clientId;
}
function getBotRequest(botData,request){
	return botData.clientGroupe+":"+botData.clientId+request;
}
