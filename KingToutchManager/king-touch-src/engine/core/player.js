var pathfinding = require("./utils/pathfinding.js");
var processKeyMovement = require("./../frames/game/player/movementFrame.js").processKeyMovement;
var processUseInteractive = require("./../frames/game/player/useInteractiveFrame.js").processUseInteractive;
var processUpgradeCharacteristic = require("./../frames/game/player/upgradeCharacteristicFrame.js").processUprgradeCharacteristic;
var delayManager = require("./../managers/delayManager.js");


exports.Player = function(bot){
	this.bot = bot;
    this.blackList = [];
}
//gotoNeigborMap(cellid) or gotoNeigborMap(cellId,dir) if cellid is -1 get a random cellid
exports.Player.prototype.gotoNeighbourMap = function(cellId,dir){
	var self = this;
	if(cellId == -1){
		cellId = self.bot.data.mapManager.getRandomCellId(dir);
	}
	else if (typeof dir == "undefined"){
		dir = self.bot.data.mapManager.getChangeMapFlag(cellId);
	}
	self.move(function(){
		self.bot.connection.sendMessage("ChangeMapMessage",{mapId : self.bot.data.mapManager.getNeighbourId(dir)});
	},cellId,true);

}
exports.Player.prototype.move = function(cb,cellId, allowDiagonals, stopNextToTarget){//seulement cellid est obligatoire
	pathfinding.fillPathGrid(this.bot.data.mapManager.map,this.bot.data.mapManager.mapId);
	var currentCellId = this.bot.data.actorsManager.actors[this.bot.data.characterInfos.id].disposition.cellId;
	console.log("Calculating path...");
	var keyMouvements = pathfinding.getPath(currentCellId,cellId,{},true);//this.bot.data.actorsManager.getOccupiedCells(),true);
	console.log("Processing key movements !");
	processKeyMovement(this.bot,keyMouvements,function(result){
		console.log("Key movements proccesed !");
		if(result){
			console.log("Movement ok ");
		}
		else{
			console.log("No movement")
		}
		cb(result);
	});
}
exports.Player.prototype.useInteractive = function(id,skill,cellId,cb,waitForeUse){
	var self=this;
	pathfinding.fillPathGrid(self.bot.data.mapManager.map,self.bot.data.mapManager.mapId);
	var currentCellId = this.bot.data.actorsManager.actors[this.bot.data.characterInfos.id].disposition.cellId;
	var element = this.bot.data.mapManager.statedes[id];
	if(typeof element == "undefined" && typeof cellId == "undefined"){
		cb(false);
		return false;
	}
	var keyMouvements;
	if(typeof cellId == "undefined" || cellId < 0){
  		keyMouvements = pathfinding.getPath(currentCellId,element.elementCellId,this.bot.data.actorsManager.getOccupiedCells(),true,true);
 		if(keyMouvements[keyMouvements.length -1] == element.elementCellId){ 
 			keyMouvements.pop();
 		}//dans le cas ou le bot est deja sur une cellule adjaçante .
	}
	else{//au cas ou la map est full
		keyMouvements = pathfinding.getPath(currentCellId,cellId,this.bot.data.actorsManager.getOccupiedCells(),true);
	}
	processUseInteractive(self.bot,id,skill,keyMouvements,cb,waitForeUse);
}
//si lataque echoue la fonction essaye tout les monstre dispo (chaque fois qu´une attaque echou le monstre est blacklist)
//actor
var failAtemp = 0;
//actor.contextualId
//actor.disposition.cellId
exports.Player.prototype.attackBestAvaibleFighter = function(noFightCallBack){
    if(failAtemp > 15){
        console.log("********fatal le combat fais des follie on reconnecte *********");
        this.bot.reconnect(this.bot);
    }
	var self=this;
	pathfinding.fillPathGrid(self.bot.data.mapManager.map,self.bot.data.mapManager.mapId);
	var selectedFights = [];
    var selectedFightIndex;
	for(var f in self.bot.data.actorsManager.fights){
		var fight = self.bot.data.actorsManager.fights[f];
		var fightLevel = fight.staticInfos.mainCreatureLightInfos.staticInfos.level;
		for(var i in fight.staticInfos.underlings){
			fightLevel += fight.staticInfos.underlings[i].staticInfos.level;
		}
		var fighterCount = fight.staticInfos.underlings.length;
		if(fighterCount < self.bot.data.userConfig.fight.maxFighter && fighterCount+1 > self.bot.data.userConfig.fight.minFighter && fightLevel <= self.bot.data.userConfig.fight.maxLevel && fightLevel >= self.bot.data.userConfig.fight.minLevel){
			var blackListed = false;
			for(var i = 0;i<this.blackList.length;i++){
				if(this.blackList[i].contextualId == fight.contextualId){
					blackListed=true;
				}
			}
			if(!blackListed && typeof fight.disposition.cellId != "undefined"){
				ret=true;
				selectedFights.push(fight);
				break;
			}
		}
	}
	if(selectedFights.length == 0){
        failAtemp=0;
		 noFightCallBack();
	}
	else{
        selectedFightIndex = Math.floor((Math.random() * selectedFights.length));
		attack(function(result){
			if(result == 0){
                failAtemp++;
				self.bot.logger.log("[Player]Le combat n´a pas commencer...");
				self.blackList.push(selectedFights[selectedFightIndex])
				self.attackBestAvaibleFighter(noFightCallBack);
			}
            else{
                failAtemp = 0;
            }
		});
	}
	
	var fightStartingTimeout;
    
	function attack(cb){
        fightStartingTimeout = setTimeout(()=>{
            console.log("[Trjet]Le combat n'a pas commencer, on le blackliste ce petit con !");
            cb(0);
        },10000);
		var currentCellId = self.bot.data.actorsManager.actors[self.bot.data.characterInfos.id].disposition.cellId;
		var fighterUpdatedCellId = selectedFights[selectedFightIndex].disposition.cellId;
		self.bot.logger.log("[Trajet]Attack monsters (cell : "+fighterUpdatedCellId+")");
		if(self.bot.data.mapManager.getDistance(currentCellId,fighterUpdatedCellId) <= 2){
			console.log("Le fight est trop proche on tente la petite soluce ^^");
			keyMouvements=[currentCellId,fighterUpdatedCellId];
		}
		else{
			var keyMouvements = pathfinding.getPath(currentCellId,fighterUpdatedCellId,self.bot.data.actorsManager.getOccupiedCells(),true);
	    }
		require("./../frames/game/player/attackActorFrame.js").processAttackActor(self.bot,keyMouvements, (r)=>{
            clearTimeout(fightStartingTimeout);
            cb(r);
        });
	}
}

//check life with userconfg settings, return -1 if no need regen, return number of life points to regen
exports.Player.prototype.checkLife = function(){
	var unite = this.bot.data.actorsManager.userActorStats.maxLifePoints / 100;
	var current = this.bot.data.actorsManager.userActorStats.lifePoints / unite;
 	if(current < this.bot.data.userConfig.regen.regenBegin){
		return false;
	}
	return true;
}
exports.Player.prototype.processRegen = function(life,callBack){
    if(this.bot.data.context != "ROLEPLAY"){
        console.log("[Player]Regen annuler, on est pas en roleplay !");
        return;
    }
    if(typeof this.bot.data.actorsManager.actors[this.bot.data.characterInfos.id] == "undefined"){
        console.log("[Player]Regen annuler, combat presumer !");
        return;
    }
	this.bot.logger.log("[Player]Debut de la regeneration pour " + life + "pdv");
    this.bot.data.state = "regen";
    setTimeout(()=>{	
         this.bot.connection.sendMessage("EmotePlayRequestMessage",{emoteId: 1});  
    },3000);
    this.bot.data.actorsManager.userActorStats.lifePoints += life;//todo faut faire sa bien
	setTimeout(callBack,(life*getRegenRate())+2500);
}

exports.Player.prototype.upgradeCharacteristic = function(characteristic, callBack){
    console.log("Upgrading characteristic id "+characteristic);
    var stats = this.bot.data.actorsManager.userActorStats;
    var breed = this.bot.data.breedInfos;
    var updatedStatsPoints = stats.statsPoints;
    var statsPointsToUpdate = 0;
    var count = 0;
    var bot = this.bot;
    
    if(characteristic === 11){//11=vie
         updateBlock(breed.statsPointsForVitality,stats.vitality.base);
    }
    else if(characteristic === 12){
         updateBlock(breed.statsPointsForIntelligence,stats.wisdom.base);
    }
    else if(characteristic === 10){
         updateBlock(breed.statsPointsForStrength,stats.strength.base);
    }
    else if(characteristic === 15){
          updateBlock(breed.statsPointsForIntelligence,stats.intelligence.base);
    }
    else if(characteristic === 13){
          updateBlock(breed.statsPointsForChance,stats.chance.base);  
    }
    else if(characteristic === 14){
         updateBlock(breed.statsPointsForAgility,stats.agility.base);        
    }
    


    function updateBlock(paliers,base){
        for(var i = 0;i<paliers.length;i++){
            var pal = paliers[i];
            var next = paliers[i+1];
            if((i === paliers.length-1 || (base+statsPointsToUpdate) < next[0] ) && updatedStatsPoints >= pal[1]){
                updatedStatsPoints -= pal[1];
                count+= pal[1];
                statsPointsToUpdate += 1;
                updateBlock(paliers,base);
                return;
            }
        }
        console.log("Request server for adding "+statsPointsToUpdate +"stats point ("+characteristic+", "+count+")");
        processUpgradeCharacteristic(bot,characteristic,count,(result)=>{
            if(result){
                console.log("Upgrade characteristic success !");
            }
            else 
            {
                console.log("Cant upgrade characteristics !")
            }
            callBack();
        });
    }
    
}

exports.Player.prototype.canUpgradeCharacteristic = function(characteristic){
    var stats = this.bot.data.actorsManager.userActorStats;
    var breed = this.bot.data.breedInfos;
    
    if(characteristic === 11 && stats.statsPoints > 0){//11=vie
        return true;   
    }
    else if(characteristic === 12){
        return canUpdate(breed.statsPointsForIntelligence,stats.wisdom.base);
    }
    else if(characteristic === 10){
        return canUpdate(breed.statsPointsForStrength,stats.strength.base);
    }
    else if(characteristic === 15){
         return canUpdate(breed.statsPointsForIntelligence,stats.intelligence.base);
    }
    else if(characteristic === 13){
         return canUpdate(breed.statsPointsForChance,stats.chance.base);  
    }
    else if(characteristic === 14){
        return canUpdate(breed.statsPointsForAgility,stats.agility.base);        
    }
    
    function canUpdate(paliers,base){
        console.log(paliers);
        console.log(base);
        for(var i = 0;i<paliers.length;i++){
            if(i == paliers.length-1 || paliers[i+1][0] > base){
                console.log(paliers[i]);
                return paliers[i][1] <= stats.statsPoints;
            }
        }
    }
    
    return false;
}

function getRegenRate(){
	return 1000;//todo verifier que c´est correcte
}
    
