var jsonfile = require('jsonfile');

exports.export = function(bot,callBack){
    var newSession = {};
    newSession.accompt = bot.data.accompt;
    newSession.clientInfos = {id:bot.data.clientId,groupe:bot.data.clientGroupe}
    if(bot.trajet.hasTrajet){
        newSession.trajet = bot.trajet.currentTrajet;
    }
    jsonfile.writeFile(getSessionPath(newSession.accompt.username), newSession, function (err) {
	  if(err != null){
          console.trace("[sessionManager]"+err);
      }
	});
    callBack(true,newSession);
    console.log("Session for "+newSession.accompt.username +" exported !")
}
exports.load = function(sessionName,callBack){
	jsonfile.readFile(getSessionPath(sessionName), function(err, obj) {
		if(err == null){
			callBack(true,obj);
		}
		else{
			callBack(false);
		}
	});
}

function getSessionPath(name){
	return "./session/"+name+".json";
}