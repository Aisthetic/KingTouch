var EventWrapper = require("event-wrapper")
var EventEmitter = require("events").EventEmitter;
var getSpellRange = require("./../core/utils/spellShape.js").getSpellRange;
var getShapeRing = require("./../core/utils/spellShape.js").shapeRing;
var getLine = require("./../core/utils/lineOfSight.js").getLine;
var getMapPoint = require("./../core/utils/pathfinding.js").getMapPoint;
var getCellId = require("./../core/utils/pathfinding.js").getCellId;
var staticContent = require("./staticContentManager.js");

exports.FightManager = function(bot){
	this.bot=bot;
	this.dispatcher = new EventEmitter();
	this.fighters = {};
	this.playerStats=null;
	this.spells = null;
	this.spellsData = null;
	this.spellsLoaded = false;
    this.invockeCount = 0;
	this.addHandlers();
}
exports.FightManager.prototype.addHandlers = function(){
	var self=this;
	var myTurnSync = false;
	this.bot.connection.dispatcher.on("GameFightStartingMessage",(m)=>{
		this.spellsWaitingInterval = {};
		this.invockeCount = 0;
		console.log("[FightManager]Debut du combat !");
		try
		{
			for (var i in self.spells) {//todo gérer les sorts à delai initial (genre punition)
						self.spells[i].nextSpellDelay = 0
			}
		}
		catch(e) {console.log(e)}
		this.bot.logger.log("[FightManager]Debut du combat !");
		this.dispatcher.emit("start");
	});
	self.bot.connection.dispatcher.on("GameFightSynchronizeMessage",function(m){

		self.fighters = {};
		for(var i = 0; i<m.fighters.length;i++){
			self.fighters[m.fighters[i].contextualId] = m.fighters[i];
		}
		self.dispatcher.emit("syncronized",m.fighters);
		if(myTurnSync){
			myTurnSync=false;
			if(self.spellsLoaded == true){
				self.dispatcher.emit("turnStart");
			}
			else{
				self.bot.logger.log("[Fight]En attente des spells ...");
				self.dispatcher.on("spellsLoaded",function(){
					self.dispatcher.emit("turnStart");
				});
			}
		}
	});
	self.bot.connection.dispatcher.on("SpellListMessage",function(m){
		var spellIds = [];
		self.spells = {};
		self.spellsData = {};
		for(var spell =0;spell<m.spells.length;spell++){
			spellIds.push(m.spells[spell].spellId)
		}
		staticContent.getSpellsInfos(spellIds,function(loadedSpells){
			var spellsCount = 0;
			for(var x  in loadedSpells){
				spellsCount++;
				self.spells[loadedSpells[x].id] = loadedSpells[x];
				staticContent.getSpellLevelsInfos(loadedSpells[x].spellLevels,loadedSpells[x].id,function(id, levels){
						var levelsToAdd = []
						for(var z in levels){
							levelsToAdd.push(levels[z]);
						}
						self.spellsData[id] = levelsToAdd;
						var levelsCount = 0;
						for(var p in self.spellsData){
							levelsCount++
						}
						if(levelsCount == spellsCount){
							self.spellsLoaded = true;
							self.dispatcher.emit("spellsLoaded",self.spells);
						}
				});
			}
			for(var i in m.spells){
				self.spells[m.spells[i].spellId].spellLevel = m.spells[i].spellLevel -1;
			}
		});
	});
	self.bot.connection.dispatcher.on("GameFightTurnStartMessage",function(m){
		if(typeof self.bot.data.characterInfos == "undefined"){
			console.log("[fightManager]Player not ready !");
			setTimeout(500,()=>{process()});
		}
		else{
			process();
		}
		function process(){
			if(m.id == self.bot.data.characterInfos.contextualId){
				self.bot.logger.log("[Fight]Debut du tours de jeux");
				myTurnSync = true;
				for(var s in self.spellsWaitingInterval){
					self.spells[s].nextSpellDelay -= 1;
					if(self.spells[s].nextSpellDelay <=0){
						delete self.spellsWaitingInterval[s];
					}
				}
			}
			else
			{
				console.log("Début du tour de jeu de : " + m.id);
			}
		}
	});
	self.bot.connection.dispatcher.on("GameActionFightDeathMessage",function(m){
	try{
		delete self.fighters[m.trajetId] ;
		self.dispatcher.emit("death",m.trajetId);
	}
		catch(e){console.log("cant hanlde actor death !");}
	});
	self.bot.connection.dispatcher.on("FighterStatsListMessage",function(m){
		self.playerStats = m.stats;
		self.bot.connection.sendMessage("GameActionAcknowledgementMessage",{valid: true});
	});
	self.bot.connection.dispatcher.on("GameActionFightPointsVariationMessage",function(m){//todo logging
		if(m.trajetId != self.bot.data.characterInfos.contextualId){return;}
		switch(m.actionId){
			case 129: //pm
				self.fighters[self.bot.data.characterInfos.id].stats.movementPoints += m.delta;
			break;
			case 102: //package
				self.fighters[self.bot.data.characterInfos.id].stats.actionPoints += m.delta;
			break;
		}
	});
	this.bot.connection.dispatcher.on("GameFightEndMessage",(m)=>{
        for(var i in this.spells){
            this.spells[i].nextSpellDelay = 0;
        }
		this.dispatcher.emit("end");
	});
}
exports.FightManager.prototype.spellCasted = function(id){
	this.fighters[this.bot.data.characterInfos.id].stats.actionPoints -= this.spellsData[id][this.spells[id].spellLevel].apCost;
	this.spells[id].nextSpellDelay = this.spellsData[id][this.spells[id].spellLevel].minCastInterval;
	this.spellsWaitingInterval[id] = true;
}
exports.FightManager.prototype.getOccupiedCells = function(cible){
	if(typeof cible == "undefined") cible = -9999999;
	var ret ={};
	for(var i in this.fighters){
		if(this.fighters[i].contextualId != cible && this.fighters[i].contextualId != this.bot.data.characterInfos.contextualId) ret[this.fighters[i].disposition.cellId] = 1;
	}
	return ret;
}
//
//team
//team 0 ennemies
//team 1 allies
//mode
exports.FightManager.prototype.getNearsetFighter = function(team){
	return this.getFightersByDistance(team)[0];
}
exports.FightManager.prototype.getFightersByDistance = function(team){
	var fightersToSort = [];
	for(var i in this.fighters){
		if(this.fighters[i].teamId == 1 && this.fighters[i].alive == true && team == 0){
			this.fighters[i].distance = this.bot.data.mapManager.getDistance(this.getUserFighter().disposition.cellId,this.fighters[i].disposition.cellId);//on asigne distance directement sur les fighters car on pourais en avori besoin plus tard
			fightersToSort.push(this.fighters[i]);
		}
	}
	fightersToSort.sort(function(a,b){
	  if (a.distance > b.distance)
		return 1;
	  if (a.distance < b.distance)
		return -1;
	  return 0;
	});
	return fightersToSort;
}
exports.FightManager.prototype.cellIsFree = function(cellId){
	if(this.bot.data.mapManager.isWalkable(cellId)){
		for(var i in this.fighters){
			if(this.fighters[i].disposition.cellId == cellId){
				return false;
			}
		}
		return true;
	}
	else{
		return false;
	}
}
exports.FightManager.prototype.canCast = function(id,type,current){
    if(typeof this.spells[id] == "undefined"){
        console.log("[fightManager]Can't find spell "+id);
        return false;
    }
	if(!current) current = this.getUserFighter().disposition.cellId;
	var spell = this.spellsData[id][this.spells[id].spellLevel];
	var spellRange = getSpellRange(current,spell);
	var cells = {};

	for(var i =0;i<spellRange.length;i++){// sa sera beaucoup plus rapide au calcule qu´avec un array :3
		cells[getCellId(spellRange[i][0],spellRange[i][1])]=1;
	}

	if(type == 0){//sur les ennemies
		var cibles = this.getFightersByDistance(0);
		for(var i =0;i<cibles.length;i++){//on verifie pour chaque ennemies (du plus proche au plus eloignier) si une cellule dans le spell range existe
			var c = cibles[i].disposition.cellId//si elle est dans le rang alors on verifie la ligne de vue et si on peut cast le spell 
			if(typeof cells[c] != "undefined" && this.canCastThisSpell(id) && this.verifyLos(c,id)){
				return c;//un fighter est sur la cellue, on a le champs libre
			}
		}
	}
	else if (type == 5){
		console.log("[fightManager]on voie si on peut invocker ...");
		if(this.canInvocke(spell) && this.canCastThisSpell(id)){
            console.log("[fightManager]On cherche une cellue vide ... ("+spellRange.length+"+ cell possible)");
			for(var i in cells){
                console.log("[fightManager]Checking cell...");
				if(this.cellIsFree(i)){
					if(spell.castTestLos == true && this.verifyLos(i,id)){
						this.invockeCount++;
						console.log("[FightManager]On invocke !");
						return i;
					}
                    else if(spell.castTesLos == false){
						this.invockeCount++;
						console.log("[FightManager]On invocke !");
						return i;
                    }
                }
			}
            console.log("dur");
		}
		console.log("[FIGHTMANAGER] On peut pas .");
	}
	return false;//on peut rien cast
}
//si cellid n'est pas definis on prend la cellule du joueur
exports.FightManager.prototype.fightersInRange = function(cellId,rang){
    console.log("[fightManager]Looking for fighters in rang !");
    p = getMapPoint(cellId);
	rang = getShapeRing(p.x,p.y,0,rang);
    for(var i = 0;i<rang.length;i++){
        var cell = getCellId(rang[i][0],rang[i][1]);
        console.log("[fightManager]Inspect cell "+cell);
        for(var x in this.fighters){
            if(this.fighters[x].disposition.cellId == cell){
                return true;
            }
        }
    }
    	console.log("[fightManager]No fighter avaible !");

	return false;
}
exports.FightManager.prototype.canInvocke = function(spell){//todo reconnection en combat et effet de la pano 
	if(this.invockeCount <= 0){
		this.invockeCount++;
		return true;
	}
	return false;
}
//Checks if there is enough PA and if there isn't any delay on the spell //TODO Check bot states .(ivre , pesanteur ...etc)
exports.FightManager.prototype.canCastThisSpell = function(spellId){
	if(typeof spellId == "undefined" || typeof this.spells[spellId] == "undefined"){
		console.log("[fightManager]Undefined spell id !");
		return false;
	}
	else if(typeof this.spells[spellId].nextSpellDelay == "undefined"){
		this.spells[spellId].nextSpellDelay=0;
	}

	return (this.getUserFighter().stats.actionPoints >=  this.spellsData[spellId][this.spells[spellId].spellLevel].apCost && this.spells[spellId].nextSpellDelay <= 0);
}
exports.FightManager.prototype.verifyLos = function(cell,spellId){
	var occupieds = {};
	for(var i in this.fighters){
		occupieds[this.fighters[i].disposition.cellId] = 1;
	}
	function check(coord){
		var cell = getCellId(coord);
		return (occupieds[cell] == "undefined" && this.bot.data.mapManager.isWalkable(cell,true));
	}
	if(this.spellsData[spellId][this.spells[spellId].spellLevel].castTestLos){
		var current = getMapPoint(this.getUserFighter().disposition.cellId);
		var dest = getMapPoint(cell)
		var line = getLine(current,dest);
		for(var i = 0;i<line.length;i++){
			if(!check(line[i])){
				return false;
			}
		}
	}
	return true;
}
exports.FightManager.prototype.getUserFighter = function(){
	return this.fighters[this.bot.data.characterInfos.contextualId];
};
exports.FightManager.prototype.isOnCaC = function(){
	for (var i in this.fighters){
		if(i == this.bot.data.characterInfos.contextualId) continue;
		var distance = this.bot.data.mapManager.getDistance(this.getUserFighter().disposition.cellId,this.fighters[i].disposition.cellId);
		if (distance == 1)
			return true;
	}
	return false
};
//Gets in th range of a spell , returns true if done , false if not .
exports.FightManager.prototype.getCellForIntelligentMove = function(spell){
	var currentCellId = this.getUserFighter().disposition.cellId;
	var possiblePoints = getShapeRing(getMapPoint(currentCellId).x,getMapPoint(currentCellId).y,this.getUserFighter().stats.movementPoints);
	var cells = {};
	for(var i =0;i<possiblePoints.length;i++){//Remplissage d'un tableau contenant les cellules possible à atteindre avec les pm actuels du bot
		cells[getCellId(possiblePoints[i][0],possiblePoints[i][1])]= true;
	}
	for(var i in cells){//On supprime les cellules qu'on peut pas cast depuis .
		if(!this.canCast(spell.id,spell.type,i) || !this.cellIsFree(i)) delete cells[i];
	}
	if(cells.length == 0) return false; //Impossible de se trouver dans la po du sort .
	cells = Object.keys(cells);
	var getDistance = this.bot.data.mapManager.getDistance;
	var closest = null;
 	var minDist = null;
 	for(var i in cells[i]){
 		var newDist = getDistance(currentCellId,cells[i]);
 		if(!minDist) minDist = newDist;
 		if(minDist>newDist){
 			minDist = newDist;
 			closest = cells[i]
 		}
 	}
 	if(!closest) return false; //normalement ceci ne doit jamais arriver mais on sait jamais ^^'
 	return closest;
}