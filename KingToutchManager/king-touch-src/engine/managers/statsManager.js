var EventWrapper = require("event-wrapper");
var watches = {};
exports.bind = function(bot){
    var wrap = EventWrapper(bot.connection.dispatcher,function(error){
        if(typeof error !="undefined"){
            console.trace("[statsManager]"+error);
        }
        save(getIndicatior(bot.clientId,bot.clientGroupe));
        delete watches[getIndicatior(bot.clientId,bot.clientGroupe)];
    });

    var watch = {bot:bot,wrap:wrap,stats:{
        fightSucces:0,
        fightFailed:0,
        connections:1
    }}
    watches[getIndicatior(bot.data.clientId,bot.data.clientGroupe)] = watch;

}
exports.done = function(id,groupe){
    watches[getIndicatior(id,groupe)].wrap.done();
}
function save(){

}
function getIndicatior(id,groupe){return id+":"+groupe;}