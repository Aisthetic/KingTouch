var createEventWrapper = require('event-wrapper');

exports.processServerSelection = function(logger,connection,servers,cb,baseId){
	var selectedServer = "undefined";
	var serverDataMessage;
	var forceCharacter = false;
	logger.log("[processServerSelection]...");
	wrap = createEventWrapper(connection.dispatcher,function(error){
		if(typeof error == "undefined"){
			logger.log("[processServerSelection]OK","success");
		}
		else{
			logger.log("[processServerSelection]"+error,"error");
		}
	});
	wrap("SelectedServerDataMessage",function(m){
		selectedServer=m;
		connection.migrate(selectedServer._access,selectedServer.port);
	});
	wrap("SelectedServerRefusedMessage",function(msg){
		wrap.done("Cant access to selected game server !");
	});
	wrap("open",function() {
		logger.log("Game connection opened !");
		var infos = global.serversInfos;
		infos.server = {address: selectedServer.address, port: selectedServer.port, id: selectedServer.serverId };
		connection.send('connecting', infos);
	})

	wrap("HelloGameMessage",function(m){
		connection.sendMessage('AuthenticationTicketMessage', {
			ticket: selectedServer.ticket,
			lang: "en"
		});
	});
	wrap("AuthenticationTicketAcceptedMessage",function(m){
		wrap.done();
		cb();
	});
	wrap("AuthenticationTicketRefusedMessage",function(m){
		wrap.done("Autentification failed !");
	});
	for(var i = 0; i<servers.length; i++){
		if(servers[i].isSelectable == true && servers[i].charactersCount > 0){
			selectedServer=servers[i];
			break;
		}
	}
	if(selectedServer == "undefined"){
		wrap.done("No game server found !");
	}
	else{
		logger.log("Request for server infos (id : "+selectedServer.id+") ...")
		connection.sendMessage("ServerSelectionMessage",{serverId: selectedServer.id });
	}
}
