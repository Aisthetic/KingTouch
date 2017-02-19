var EventEmitter = require("events").EventEmitter;
exports.ActorsManager = function(bot){
	this.dispatcher = new EventEmitter();
	this.actors = {};
	this.fights = {};
	this.npcs = {};
	this.merchants = {};
	this.undefinedActors ={};
	this.userActorStats = {};
	this.bot=bot;
	var self=this;

	bot.connection.dispatcher.on("MapComplementaryInformationsDataMessage",function(m){
		if(bot.data.context == "FIGHT") return;
		self.actors = {};
		self.fights = {};
		self.npcs = {};
		self.merchants = {};
		self.undefinedActors={};
		for(var a = 0;a< m.actors.length;a++){
			if(m.actors[a]._type == "GameRolePlayCharacterInformations"){
				self.actors[m.actors[a].contextualId] = m.actors[a];
			}
			else if(m.actors[a]._type == "GameRolePlayGroupMonsterInformations"){
				self.fights[m.actors[a].contextualId] = m.actors[a];
			}
			else if(m.actors[a]._type == "GameRolePlayNpcInformations"){
				self.npcs[m.actors[a].contextualId] = m.actors[a];
			}
			else if(m.actors[a]._type == "GameRolePlayMerchantInformations"){
				self.merchants[m.actors[a].contextualId] = m.actors[a];
			}
			else{
				console.log("Undefined actor "+JSON.stringify(m.actors[a]))
				self.undefinedActors[m.actors[a].contextualId] = m.actors[a];
			}
		}
		self.dispatcher.emit("actorsLoaded",m.acotrs);
	});
	bot.connection.dispatcher.on("GameMapMovementMessage",function(m){
		if(bot.data.context == "FIGHT") return;
		self.updateActorLocation(m.actorId,m.keyMovements[m.keyMovements.length-1]);
	});
	bot.connection.dispatcher.on("GameMapNoMovementMessage",(m)=>{
			this.actors[bot.data.characterInfos.id].disposition.cellId = this.actors[bot.data.characterInfos.id].disposition.lastCellId;
			console.log("Movement canceled !");
	});
	bot.connection.dispatcher.on("CharacterStatsListMessage",(m)=>{
		this.userActorStats = m.stats;
		this.dispatcher.emit("characterUpdated");
	});
    bot.connection.dispatcher.on("LifePointsRegenEndMessage",(m)=>{
        this.userActorStats.lifePoints = m.lifePoints;
        this.userActorStats.maxLifePoints = m.maxLifePoints;
    });
    bot.connection.dispatcher.on("CharacterLevelUpMessage",(m)=>{
        this.userActorStats.level = m.newLevel;
        console.log(this.bot.data.characterInfos.name+" est passer level "+m.newLevel);
    });
	bot.connection.dispatcher.on("GameRolePlayShowActorMessage",function(m){
		if(bot.data.context == "FIGHT") return;
		if(m.informations._type == "GameRolePlayCharacterInformations"){
			self.actors[m.informations.contextualId] = m.informations;
		}
		else if(m.informations._type == "GameRolePlayGroupMonsterInformations"){
			self.fights[m.informations.contextualId] = m.informations;
		}
		else{
			console.log("Unknow actor type "+JSON.stringify(m));
		}
	});
	bot.connection.dispatcher.on("GameContextRemoveElementMessage",function(m){
		if(typeof self.actors[m.id] != "undefined"){
			delete  self.actors[m.id];
		}
		else if(typeof self.fights[m.id] != "undefined"){
			delete self.fights[m.id];
		}
		else if(typeof self.merchants[m.id] !="undefined"){
			delete self.merchants[m.id];
		}
		else{
			console.log("Unknow game context remove element "+JSON.stringify(m));
		}
	});
}
exports.ActorsManager.prototype.updateActorLocation = function(id,loc){
	if(this.bot.data.context == "fight"){console.trace("ActorsManager cant update actors during fight !"); return;}
	if(typeof this.actors[id] != "undefined"){
		this.actors[id].disposition.lastCellId = this.actors[id].disposition.cellId;
		this.actors[id].disposition.cellId = loc;
	}
	else if(typeof this.fights[id] != "undefined"){
		this.fights[id].disposition=loc;
	}
	else{
		console.log("Undefined gues, update failed !");
	}
}
exports.ActorsManager.prototype.getOccupiedCells = function(){
	if(this.bot.data.context == "FIGHT") {console.trace("ActorsManager not working during fight !"); return;}

	var occupedCells={};
	for(var i in this.fights){
		occupedCells[this.fights[i].disposition.cellId] = true;
	}
	for(var i in this.actors){
		occupedCells[this.actors[i].disposition.cellId] = true;
	}
	for(var i in this.npcs){
		occupedCells[this.npcs[i].disposition.cellId] = true;
	}
	for(var i in this.merchants){
		occupedCells[this.merchants[i].disposition.cellId] = true;
	}
	for(var i in this.undefinedActors){
		try{
			occupedCells[this.undefinedActors[i].disposition.cellId] = true;
		}
		catch(e){
			console.log("Cant get locaction of undefined actor : "+JSON.stringify(this.undefinedActors[i]));
		}
	}
	var ret = {};
	//check cells
	for(var i in occupedCells){
		if(i != "undefined"){
			ret[i] = occupedCells [i];
		}
	}
	return ret;
}
