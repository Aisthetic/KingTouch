exports.Gather = function(bot){
	this.bot = bot;
	this.blacklist = {};
};

//returns an array of items {ressourceId , skillId}
exports.Gather.prototype.getMustGatheredRessources = function(){//todo gérer l'acquisition de la config métier
	return [{id : 38 , skillId : 45},{id : 43 , skillId : 53 }]//test avec le blé et l'orge .
};

//Gathers the first available element , à voir si la fonction est optimisable
//returns true if there is any gatherable element on the map , else false 
exports.Gather.prototype.gatherFirstAvailableRessource = function(cb) {//TODO: à revoir s'il faut à chaque fois refaire les calculs ou stocker les ressources possbiles sur une variable générale
	if(this.bot.data.state != "READY") return console.log("Bot not ready for gathering .(" + this.bot.data.state + ')');
	var candidates = this.getCandidates();
	for (var i in candidates){
		var elements = candidates[i].elements//pour chaque unique id , il y'a plusieurs elements (un peu de min fuck)
		var skillId = candidates[i].skillId
		var element = null
		element = this.getBestMatch(elements);
		if(!element){//LOL ?
			console.log("no best match on i =" + i + " : " +  Object.keys(candidates).pop())
			if(i == Object.keys(candidates).pop()){//Dernier element qu'on ne peut pas recolter .
				return cb(false);
			}
			continue;
		} 
		this.bot.data.state = "GATHER";
		var timeout;
		var callBack = (result)=>{
			this.bot.data.state = "READY";
			clearTimeout(timeout);
			cb(true);//Faut dire que c'est reussi même si ça fail sur la recolte sinon le bot va croire qu'il n'y a plus de ressources sur la map
		}
		this.gatherElement(element ,skillId, callBack);
		timeout = setTimeout(()=>{//Debug au cas où .
			this.bot.data.state = "READY";
			this.blacklist[element.interactive.elementId] = true;
			cb(true);
			callBack = ()=>{} //plus de callBack
		}, 30000);
		return;
			
	}
	return cb(false);
};

exports.Gather.prototype.gatherable = function(element){//TODO Check if there is no other verifications(pour les pêcheurs ça ne suffit pas)
	if (element.interactive.enabledSkills.length === 0 && element.interactive.disabledSkills.length > 0) return false;
	if (this.blacklist[element.interactive.elementId]) return false;
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
		this.blacklist[element.interactive.elementId] = true;
		return cb(true);
	}
	this.blacklist[element.interactive.elementId] = true;
	console.log("Gathering element :{id : "+ element.interactive.elementId + " , cellid : " + element.stated.elementCellId +" }");
	if(!this.bot.data.mapManager.identifiedElements[element.interactive.elementId]) this.bot.data.mapManager.identifiedElements[element.interactive.elementId] = {id : element.interactive.elementId , position : element.stated.elementCellId};
	this.bot.player.useInteractive(element.interactive.elementId , element.interactive.enabledSkills[0].skillInstanceUid , element.stated.elementCellId ,cb , true);
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