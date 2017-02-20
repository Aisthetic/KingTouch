var processDelay = require("./../managers/delayManager.js").processDelay;
var staticContent = require("./../managers/staticContentManager.js");
exports.Trajet = function(bot){
	this.currentTrajet;
	this.regenMode = false;
	this.bankMode = false;
	this.bankSteep = 0;
	this.fightStarting=false;
	this.trajetRunning = false;
	this.lastChangMapCell = 0;
	this.hasTrajet=false;
	this.bot=bot;
	var self=this;
}
exports.Trajet.prototype.load = function(trajet){
	this.currentTrajet = trajet
	this.hasTrajet=true;
}
exports.Trajet.prototype.stop = function(){
	this.trajetRunning=false;
}
exports.Trajet.prototype.start = function(){
	this.trajetRunning=true;
	this.trajetExecute();
}
exports.Trajet.prototype.startPhoenix = function(){
	this.trajetRunning=false;
}
exports.Trajet.prototype.trajetExecute = function(){

    if(this.bot.data.context != "ROLEPLAY" || typeof this.bot.data.actorsManager.actors[this.bot.data.characterInfos.id] == "undefined"){
        console.log("**Trajet execution canceled !**");
        return;
    }
	if(this.hasTrajet === false){
		console.log("[Trajet]No trajet loaded !");
		return;
	}
	this.bot.logger.log("[Trajt]Execution ...");  
    var action = this.hasActionOnMap(this.currentTrajet);
    console.log(JSON.stringify(action));
    if(typeof action != "undefined"){
        if(typeof action.action != "undefined"){
            if(action.action==="fight"){
                this.parseFight(action);
            }
            else if(action==="gather"){
                this.parseGather(action);
            }
            else{
                this.execMove(action);
            }
        }
    }
    else{
        console.log("[Trajet]Rien a faire sur cette map ! "+this.bot.data.mapManager.mapId);
    }
}
exports.Trajet.prototype.hasActionOnMap = function(actions){
	for(var i  in actions){
        if(isNaN(i) === false){
            if(parseInt(i) === this.bot.data.mapManager.mapId){
                return actions[i];
            }
        }
        else{
            //todo coord
        }
	}
	return "undefined";
}
exports.Trajet.prototype.parsePhoenix = function(action){
	var phoenix = staticContent.getPhoenixInfos(this.bot.data.mapManager.mapId)
	if(typeof phoenix != "undefined"){
		processDelay("frist_interactive_use",() => {
			this.bot.player.useInteractive(phoenix.id,phoenix.skill,phoenix.cell,() =>{
				processDelay("frist_interactive_use",() => {
					console.log("[Trajet]On reprend le trajet !");
					this.bot.context = "ROLEPLAY";
					this.trajetExecute();
				});
			});
		});
		return true;
	}
	else if(typeof action != "undefined"){
		return this.execMove(action);
	}
	return false;
}

exports.Trajet.prototype.parseFight = function(fight){
	var self = this;
	if(fight=="undefined"){return false;}
	self.bot.player.attackBestAvaibleFighter(function(){
		self.bot.logger.log("[Trajet]Aucun combat on change de carte...")
		self.execMove(fight);
	});
	return true;
}

exports.Trajet.prototype.parseGather = function(gather){
	//if(!this.trajetRunning) return console.log("Trajet arrêté , récolte annulée .");
	console.log("------------------------------------------------------");
	console.log('Bot state : ' + this.bot.data.state + ' .');
	if(!this.trajetRunning) return console.log("Trajet not running , gathering action stopped .");
	if(this.bot.data.state != "READY"){
		console.log("Bot not ready for gathering : " + this.bot.data.state);
		return true;
	}
	this.bot.gather.gatherFirstAvailableRessource((result)=>{
		if(result) {
			this.parseGather(gather);
		}
		else{
			console.log("Plus de ressources à récolter disponibles , on passe à la map suivante .");
			this.execMove(gather);
		}
	});
	return true;
}
exports.Trajet.prototype.parseMove = function(move){
	if(move=="undefined"){return false}
	this.execMove(move);
	return true;
}

exports.Trajet.prototype.execMove = function(action){
	if(typeof(action.sun) != "undefined"){
		this.bot.player.move(action.sun);
		this.bot.logger.log("On va sur le soleil...");
		return;
	}
	else if(typeof action.interactive != "undefined" && typeof action.skill !="undefined"){
		self.bot.player.useInteractive(action.interactive,action.skill);
	}
	else if (typeof action.cell !="undefined" && action.dir == "undefined"){
		this.bot.player.gotoNeighbourMap(action.cell);
		console.log("[Trajet]Changement de carte, cellid pre-definis");
	}
	else if(typeof action.cell !="undefined"){
		this.bot.player.gotoNeighbourMap(action.cell,action.flag);
	}
	else if(typeof action.dir != "undefined"){
		this.bot.player.gotoNeighbourMap(-1,action.dir);
		this.bot.logger.log("[Trajet]Changement de carte, premiere cellid disponble");
	}
	else{
		this.bot.logger.log("[Trajet]Action invalide ("+JSON.stringify(action)+") !");
	}
}
