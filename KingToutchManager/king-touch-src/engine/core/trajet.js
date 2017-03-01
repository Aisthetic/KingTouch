var processDelay = require("./../managers/delayManager.js").processDelay;
var staticContent = require("./../managers/staticContentManager.js");
var yaml = require('js-yaml');
var fs   = require('fs');
exports.Trajet = function(bot){
	this.currentTrajet;
	this.regenMode = false;
	this.bankMode = false;
	this.bankSteep = 0;
	this.fightStarting=false;
	this.trajetRunning = false;
	this.lastChangMapCell = 0;
	this.hasTrajet=false;
	this.trajetOnExecution = false;
	this.bot=bot;
}
exports.Trajet.prototype.load = function(trajet){//Todo voir s'il faut réinitialiser les steps ou pas
	this.stop();
	try {
		this.currentTrajet = yaml.safeLoad(trajet)
		console.dir(this.currentTrajet);
	} 
	catch (e) {
		//Todo envoyer une erreur à l'UI
	 	console.log(e);
	}
	this.bot.data.userConfig.trajet = this.currentTrajet;
	this.bot.data.saveUserConfig();
	this.hasTrajet=true;
}
exports.Trajet.prototype.stop = function(){
	if(this.trajetRunning) console.log("Trajet arrêté .");
	this.trajetRunning=false;
}
exports.Trajet.prototype.start = function(){
	if(!this.currentTrajet){
		if(!this.bot.data.userConfig.trajet.loadedTrajet || this.bot.data.userConfig.trajet.loadedTrajet) return console.log("Pas de trajet à demarer ...");
		this.currentTrajet = this.bot.data.userConfig.trajet.loadedTrajet;
		this.bot.data.saveUserConfig();
	}
	this.hasTrajet = true;
	this.trajetRunning=true;
	this.trajetExecute();
}
exports.Trajet.prototype.startPhoenix = function(){
	this.trajetRunning=false;
}
exports.Trajet.prototype.checkState = function(){
	if(this.trajetOnExecution) return false;//Moche mais pas le choix , impossible de le faire d'une autre façon en JS...
	this.trajetOnExecution = true;
    if(!this.hasTrajet || !this.currentTrajet || !this.trajetRunning || this.bot.data.context != "ROLEPLAY" || typeof this.bot.data.actorsManager.actors[this.bot.data.characterInfos.id] == "undefined"){
        console.log("**Trajet execution canceled !**");
        this.trajetOnExecution = false;
        return false ;
    }
	console.log("Bot state :" + this.bot.data.state +' .');
	if(this.bot.data.state == "OVERLOAD" && !this.bankMode){
		if(!this.currentTrajet.banque){
			console.log("Le bot est full pods mais pas de trajet de banque sur la map " + this.bot.data.mapManager.mapId +" , arrêt du trajet .");
			this.stop();
		}
			this.bankMode = true;	
			console.log("[TRAJET] Bank mode activated .");
	}
	if(this.bot.data.context =="GHOST"){
		if(!this.currentTrajet.phoenix){
			console.log("[Trajet]Aucun trajet vers le phoenix !");//todo worldpath <3
		}
	}
	return true;
}

exports.Trajet.prototype.analyseSteps = function(map){
	console.log("Nombre d'étapes : " + Object.keys(map).length);
	//pas d'actions à faire .
	if(map.length == 0) return null;

	//une seule action à faire .
	if(map.length == 1) return map;

	//On procède au étapes .
	if(!this.bot.data.userConfig.trajet.steps) this.bot.data.userConfig.trajet.steps = 0;
	var step = this.bot.data.userConfig.trajet.steps;
	if(!step[this.bot.data.mapManager.mapId]) step[this.bot.data.mapManager.mapId] = 0;
	step[this.bot.data.mapManager.mapId] = step[this.bot.data.mapManager.mapId] %Object.keys(map).length;//le nombre d'étapes enregistré ne doit jamais dépasser celui des maps
	this.bot.data.userConfig.trajet.steps = step;
	this.bot.data.saveUserConfig();
	console.log("Step :" + step);
	console.dir (Object.keys(map))
	var obj ={}
	//je me fais chier par les objets en js...du tout pas possible de faire un truc clean -_-
	obj[Object.keys(map)[step]] = map[Object.keys(map)[step]]
	return obj;
/*	for (var i = Things.length - 1; i >= 0; i++) {
		steps[this.bot.data.mapManager.mapId] = steps[this.bot.data.mapManager.mapId] % map.length;//le nombre d'étapes enregistré ne doit jamais dépasser celui des maps
		this.bot.data.userConfig.trajet.steps = steps;
		this.bot.data.saveUserConfig();
		if(stepsCount == steps[this.bot.data.mapManager.mapId]) return {i : map[i]}; //Normalement c'est un stepsCount == allSteps mais pour éviter 
	}*/
}

exports.Trajet.prototype.trajetExecute = function(){
	if(!this.checkState()) return;

	//Coordonnées du bot .
	var coords = this.bot.data.mapManager.coords.x + ',' + this.bot.data.mapManager.coords.y;
	var mapId = this.bot.data.mapManager.mapId;
	this.bot.logger.log("[Trajet]Execution map [" + coords +'] .');

	//Gestion des étapes
	var map = null;
	if(this.currentTrajet.mouvement[coords]) map = this.currentTrajet.mouvement[coords];
	else if(this.currentTrajet.mouvement[mapId]) map = this.currentTrajet.mouvement[mapId];
    /*console.log("Etapes à analyser : ");
	console.dir(map);
	map = this.analyseSteps(map);
	console.log("Etape actuelle : ");
	console.dir(map);*/
	if(!map) return console.log("[Trajet]Rien a faire sur cette map ["+coords+"] !");
	//Banque
	if(this.bankMode){
		this.parseMove(map)
		this.trajetOnExecution = false;
		return;
    }

    //Fantome
	if(this.bot.data.context =="GHOST"){
		this.parsePhoenix(map);
		this.trajetOnExecution = false;
		return;
	}

	//Mouvements
	else if(this.currentTrajet.mouvement){
		this.bot.logger.log("[Trajet]Execution du mouvement ...");
		this.parseMove(map)
	}

	//Combats
	else if(this.currentTrajet.combat){
		this.parseFight(map)
	}

	//Recolte
	else if(this.currentTrajet.recolte){
		this.bot.logger.log("[Trajet]Execution de la récolte...");
		this.parseGather(map)
	}

	//Plus rien à faire
	else{
		this.bot.logger.log("[Trajet]Rien a faire sur cette map ["+coords+"] !");
	}
	this.trajetOnExecution = false;
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
	this.bot.gather.gatherFirstAvailableRessource((result)=>{
		if(result)this.bot.sync.process();//plus rien à récolter 
		else this.execMove(gather)
	});
	return true;
}

exports.Trajet.prototype.parseMove = function(move){
	if(move=="undefined"){return false}
	this.execMove(move);
	return true;
}

exports.Trajet.prototype.execMove = function(action){
	var self = this;
	if(typeof(action.sun) != "undefined"){
		this.bot.player.move(()=>{} , action.sun , true , false);
		this.bot.logger.log("On va sur le soleil...");
		return;
	}
	/*
	@Interactive : (params optionnels : on utilise la premiere interactive disponible de la map)
		id
		skill
	*/
	else if(typeof action.interactive != "undefined" && typeof action.skill !="undefined"){
		self.bot.player.useInteractive(action.interactive,action.skill);
	}
	/*
	@Npc : (params optionnels : on parle au premier npc disponible de la map)
		id
		replies
		actionId
	*/
	else if(typeof action.npc != "undefined"){
		self.bot.player.npcActionRequest(action.npc , action.replies , action.actionId);//gestion interne des inconnus .
	}
	/*
	@direction : id
	@cell : id
	*/
	else if (typeof action.cell !="undefined" && action.direction == "undefined"){
		this.bot.player.gotoNeighbourMap(action.cell);
		console.log("[Trajet]Changement de carte, cellid pre-definis");
	}
	/*
	@direction : id
	*/
	else if(typeof action.cell !="undefined"){
		this.bot.player.gotoNeighbourMap(action.cell,action.flag);
	}
	/*
	@direction : id
	*/
	else if(typeof action.direction != "undefined"){
		this.bot.player.gotoNeighbourMap(-1,action.direction);
		this.bot.logger.log("[Trajet]Changement de carte sur une cellule aléatoire .");
	}

	else{
		this.bot.logger.log("[Trajet]Action invalide ("+JSON.stringify(action)+") !");
	}
}