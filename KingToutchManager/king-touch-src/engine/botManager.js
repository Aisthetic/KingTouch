var Bot = require("./bot.js").Bot;
var EventEmitter = require("events").EventEmitter;
var activityManager = require("./activityManager.js");
var sessionManager = require("./sessionManager.js");

var connected = false;
var accomptCurrent = {username:"",password:""};
var reconnectTry = 0;
var maxReconnectTry = 30;//on est un peut gourmand ta vue

exports.currentBot = null;
exports = module.exports = new EventEmitter();

exports.connect = function(accompt){
    activityManager.on("botDown",()=>{
       console.log("Reconnection request ...");
       exports.reconnect(exports.currentBot);
    });
    accomptCurrent = accompt;
	exports.currentBot = new Bot("Aucun groupe",0,exports.reconnect);
    exports.currentBot.dispatcher.on("characterSelected",()=>{
        maxReconnectTry = 0;
    });
    connected=true;
	exports.currentBot.connect(accompt);
	activityManager.bind(exports.currentBot);
	exports.emit("connect");
    activityManager.startWatching();
}

exports.reconnectClient = function(session){
    if(reconnectTry >= maxReconnectTry){
        console.log("************** Max reconnect for "+accomptCurrent.username+" **************");
        return false;
    }
    reconnectTry++;
	console.log("Reconnecting "+session.accompt.user +" ...");
	exports.currentBot = null;
	exports.currentBot = new Bot("Aucun groupe",0,exports.reconnect);
    exports.currentBot.dispatcher.on("characterSelected",()=>{
        maxReconnectTry = 0;
    });
	exports.currentBot.connect(accomptCurrent);
	activityManager.bind(exports.currentBot);
    exports.rescureSession(session);
    exports.emit("reconnect");
    return true;
}

exports.reconnect = function(bot){
	sessionManager.export(bot,function(result,session){
		if(global.closing == true){
			console.log("Session exporter ("+bot.data.username+") !");
			return;
		}
		if(bot.data.context == "LOGIN"){
			sessionManager.load(bot.data.username,function(result,sess){
				if(!result){
					console.trace("Aucune session existante, on anbandonne la reconnection !");
				}
				else{
                    setTimeout(()=>{ exports.reconnectClient(sess) }, 2000);
				}
			})
		}
		else{
            setTimeout(()=>{ exports.reconnectClient(session) }, 2000);
		}
	});
}

exports.rescureSession = function(session){
    if(connected === false){
        console.log("Bot not ready for rescure !");
        exports.on("connect",()=>{
            exports.rescureSession(session);
        });
        return;
    }
    console.log("Rescuring session...");
    if(typeof session.trajet != "undefined"){
		exports.currentBot.trajet.load(session.trajet);
	}
}