var EventEmitter = require("events").EventEmitter;
var EventWrapper = require("event-wrapper");
var dispatcher = new EventEmitter;
var clientsWatching = {};
var watching = false;
var watchingInterval = 150000;
var softWatchingInterval = 20000;
var softWatching = false;
exports = module.exports = dispatcher;
exports.startWatching = function(interval){
    if(typeof interval != "undefined"){
        watchingInterval = interval;
    }
    watching  = setInterval(watch,watchingInterval);
    
}
exports.stopWatching = function(){
    clearInterval(watching);
}
exports.bind = function(bot){
    var wrap = EventWrapper(bot.connection.dispatcher,function(error){
        if(typeof error == "undefined"){
            console.log("Activity inspection for "+bot.data.accompt.username +" done !");
        }
        else{
            dispatcher.emit("botDown",bot);
        }
        clientsWatching[bot.data.accompt.username].last = -1;
    });
    var newWatch = {bot: bot, last: new Date().getTime(), wrap: wrap};
    clientsWatching[bot.data.clientId,bot.data.accompt.username] = newWatch;
    wrap("GameMapMovementMessage",function(m){
        if(m.actorId == newWatch.bot.data.characterInfos.id){
            newWatch.last=new Date().getTime();
        }
    });
    wrap("LoginQueueStatusMessage",
         "QueueStatusMessage",
         "GameFightTurnEndMessage",
         "GameFightTurnStartMessage",function(m){
        newWatch.last = new Date().getTime();
    });//todo plus de presision sur les activités par example l´elvage ou le flood et detecter la deconnection ^^ (pour eviter le dellay <3)
}
function getClientIndicator(id,groupe){
    return groupe+":"+id;
}
function watch(){
    var current = new Date().getTime();
    for(var i in clientsWatching){
        var w = clientsWatching[i];
        if(w.last + watchingInterval < current  && w.bot.data.state!="REGEN" && w.last != -1){
            console.log(w.bot.data.accompt.username+" has prolonged inactivity !");
            w.wrap.done(false);
        }
		else if(w.last!=-1){
			w.last=new Date().getTime();
		}
    }
}