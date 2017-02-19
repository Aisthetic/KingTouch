exports.Gather = function(bot){
	this.bot = bot;
};

//returns an array of items {ressourceId , skillId}
exports.Gather.prototype.getMustGatheredRessources = function(){//todo gérer l'acquisition de la config métier
	return [{id : 38 , skillId : 45}]//test avec le blé 
};

//Gathers the first available element , à voir si la fonction est optimisable
//returns true if there is any gatherable element on the map , else false 
exports.Gather.prototype.gatherFirstAvailableRessource = function(cb) {//TODO: à revoir s'il faut à chaque fois refaire les calculs ou stocker les ressources possbiles sur une variable générale
	if(this.bot.data.state != "READY") return console.log("Bot not ready for gathering .(" + this.bot.data.state + ')');
	var candidates = this.getCandidates();
	for (var i in candidates){//3 boucles oui mais faut regarder ou est le return donc ça parcout pas tout et ça consomme presque rien (ressources free)
		var elements = candidates[i]//pour chaque unique id , il y'a plusieurs elements (un peu de min fuck)
		var skillId = elements.skillId
		for(var j in elements){
			var element = null
			element = this.getBestMatch(elements[j]);
			if(!element) return cb(false);
				this.bot.data.state = "GATHER";
				this.gatherElement(element ,skillId, (result)=>{
					this.bot.data.state = "READY";
					cb(true);//Faut dire que c'est reussi même si ça fail sur la recolte sinon le bot va croire qu'il n'y a plus de ressources sur la map
				});
				return;
		}	
	}
	return cb(false);
};

exports.Gather.prototype.gatherable = function(element){//TODO Check if there is no other verifications(pour les pêcheurs ça ne suffit pas)
	if (element.interactive.enabledSkills.length === 0 && element.interactive.disabledSkills.length > 0) return false;
	else return true//TODO ADD LVL CHECK
}

//Returns all the mustBeGatheredRessources on the map(doesn't verify if gatherable or not)
exports.Gather.prototype.getCandidates = function() {
	var ressources = {};
	var required = this.getMustGatheredRessources();
	for(var i in required){
			ressources[required[i].id] = { elements : this.bot.data.mapManager.getInteractives(required[i].id) , skillId : required[i].skillId};		
	}
	return ressources;
};

//Gathers a given element
exports.Gather.prototype.gatherElement = function(element, skillId ,cb){
	var skillInstanceUid = -1;
	for(var i in element.interactive.enabledSkills){
		if(element.interactive.enabledSkills[i].skillId == skillId) skillInstanceUid = element.interactive.enabledSkills[i].skillInstanceUid
	}
	if(skillInstanceUid < 0 || typeof skillInstanceUid == 'undefined'){
		console.log("Can't find the associated skillInstanceUid for the demanded element .");
		return cb(false);
	}
	console.log("Gathering element :{id : "+ element.interactive.elementId + " , cellid : " + element.stated.elementCellId +" }");
	this.bot.player.useInteractive(element.interactive.elementId , element.interactive.enabledSkills[0].skillInstanceUid , -1 ,cb , true);
};
//returns the best matching element for the bot (closest distance , todo : highest priority)
exports.Gather.prototype.getBestMatch = function(elements){
 	var closest = null;
 	var minDist = 999;//pas joli
 	var currentCellId = this.bot.data.actorsManager.actors[this.bot.data.characterInfos.id].disposition.cellId;
 	for(var i in elements){
 		var newDist = this.bot.data.mapManager.getDistance(currentCellId,elements[i].stated.elementCellId);
 		if(minDist>newDist && this.gatherable(elements[i])){
 			minDist = newDist;
 			closest = elements[i]
 		}
 	}
 	return closest;
}