var EventWrapper = require('event-wrapper');
exports.processsCharacterSelection = function(logger,connection,cb){
	logger.log("[processsCharacterReconnection]...")
	wrap = EventWrapper(connection.dispatcher,function(error){
		if(typeof error =="undefined"){
			logger.log("[processsCharacterSelection]OK","success")
		}
		else{
			logger.log("[processsCharacterSelection]"+error,"error");
		}
	});
	wrap("CharacterSelectedSuccessMessage",function(m){
		logger.log(m.infos.name+" selected !");
		wrap.done();
		setTimeout(function(){
			cb(m.infos);
		},10);
	});
}
