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
	this.trajetOnExecution = false;
	this.bot=bot;
	var self=this;
}
exports.Trajet.prototype.load = function(trajet){
	this.currentTrajet = trajet
	this.bot.data.userConfig.trajet = trajet;
	this.hasTrajet=true;
	this.trajetRunning=true;
}
exports.Trajet.prototype.stop = function(){
	console.log("Trajet arrêté .");
	this.trajetRunning=false;
}
exports.Trajet.prototype.start = function(){
	if(!this.currentTrajet){
		if(!this.bot.data.userConfig.trajet) return console.log("Pas de trajet à demarer ...");
		this.currentTrajet = this.bot.data.userConfig.trajet;
		this.bot.data.saveUserConfig();
	}
	this.hasTrajet = true;
	this.trajetRunning=true;
	this.trajetExecute();
}
exports.Trajet.prototype.startPhoenix = function(){
	this.trajetRunning=false;
}
exports.Trajet.prototype.trajetExecute = function(){
	var self = this;
	if(this.trajetOnExecution) return  console.log("Trajet already on execution ...");//Moche mais pas le choix , impossible de le faire d'une autre façon en JS...
	this.trajetOnExecution = true;
    if(this.bot.data.context != "ROLEPLAY" || typeof this.bot.data.actorsManager.actors[this.bot.data.characterInfos.id] == "undefined"){
        console.log("**Trajet execution canceled !**");
        this.trajetOnExecution = false;
        return;
    }
	if(!this.hasTrajet || !this.currentTrajet){
		console.log("[Trajet]No trajet loaded !");
		this.trajetOnExecution = false;
		return;
	}
	if(!this.trajetRunning){
		this.trajetOnExecution = false;
		return console.log("Can't execute the trajet , it's has already been stopped .");
	}
	this.bot.logger.log("[Trajet]Execution map " + this.bot.data.mapManager.mapId +' .');
	console.log("Bot state :" + this.bot.data.state +' .');
	if(this.bot.data.state == "OVERLOAD" && !this.bankMode){
			this.bankMode = true;
			console.log("[TRAJET] Bank mode activated .");
	}
	if(this.bankMode){
		if(!this.parseMove(this.hasActionOnMap(this.currentTrajet.trajet["bank"]))) {
			console.log("Le bot est full pods mais pas de trajet de banque sur la map " + this.bot.data.mapManager.mapId +" , arrêt du trajet .");
			this.stop();
		}
		this.trajetOnExecution = false;
		return;
    }
	if(this.bot.data.context =="GHOST"){
		if(this.parsePhoenix(this.hasActionOnMap(this.currentTrajet["phoenix"]))){
			console.log("[Trajet]Execution du trajet vers le phoenix ...");
		}
		else{
			console.log("[Trajet]Aucun trajet vers le phoenix !");//todo worldpath <3
		}
	}
	else if(this.parseMove(this.hasActionOnMap(this.currentTrajet.trajet["moves"]))){
		this.bot.logger.log("[Trajet]Execution du mouvement ...");
	}
	else if(this.parseFight(this.hasActionOnMap(this.currentTrajet.trajet["fights"]))){
		this.bot.logger.log("[Trajet]Execution du fight ...")
	}
	else if(this.parseGather(this.hasActionOnMap(this.currentTrajet.trajet["recolte"]))){
		this.bot.logger.log("[Trajet]Execution de la récolte...");
	}
	else{
		this.bot.logger.log("[Trajet]Rien a faire sur cette map ("+this.bot.data.mapManager.mapId+") !");
	}
	this.trajetOnExecution = false;
}
exports.Trajet.prototype.hasActionOnMap = function(actions){
	try{
		if(actions.length<=0){return "undefined";}
	}
	catch(e){
		return "undefined";
	}
	for(var i = 0;i<actions.length;i++){
		if(actions[i].map == this.bot.data.mapManager.mapId){
			return actions[i];
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
	console.log("------------------------------------------------------");
	console.log(this.bot.data.state);
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
	var self = this;
	if(typeof(action.sun) != "undefined"){
		this.bot.player.move(()=>{} , action.sun , true , false);
		this.bot.logger.log("On va sur le soleil...");
		return;
	}
	else if(typeof action.interactive != "undefined" && typeof action.skill !="undefined"){
		self.bot.player.useInteractive(action.interactive,action.skill);
	}
	else if(typeof action.npc != "undefined"){
		self.bot.player.npcActionRequest(action.npc , action.replies , action.actionId);//gestion interne des inconnus .
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
		this.bot.logger.log("[Trajet]Changement de carte sur une cellule aléatoire .");
	}
	else{
		this.bot.logger.log("[Trajet]Action invalide ("+JSON.stringify(action)+") !");
	}
}