var pathfinding = require("./utils/pathfinding.js");
var processKeyMovement = require("./../frames/game/player/fight/movementFrame.js").processKeyMovement;
var processFightContextFrame = require("./../frames/game/player/fight/fightContextFrame.js").processFightContextFrame;
var processCastSpell = require("./../frames/game/player/fight/castSpellFrame.js").processCastSpell;
var getMapPoint = pathfinding.getMapPoint;
var getCellId = pathfinding.getCellId;
var Ia = {
	"default":require("./ia/default.js").Ia,
	"sacri":require("./ia/sacri.js").Ia,
}

exports.Fight = function(bot){
    this.selectedIa = "default";
	this.fightContextInitialized = false;
	this.bot = bot;
	this.bot.data.fightManager.dispatcher.on("start", ()=>{
		this.fightContextInitialized=true;
        if(this.selectedIa !=  this.bot.data.userConfig.fight.type){
            this.selectedIa = this.bot.data.userConfig.fight.type;
            console.log("[fight]Ia updated to "+this.selectedIa);
        }
		this.ia=new Ia[this.selectedIa](this.bot);
		this.ia.processPlacement();
	});
	this.bot.data.mapManager.dispatcher.on("loaded", (map)=>{
		pathfinding.fillPathGrid(map);
	})
	this.bot.data.fightManager.dispatcher.on("end", ()=>{
		this.fightContextInitialized=false;
	});
	this.bot.data.fightManager.dispatcher.on("turnStart", ()=>{
        if(typeof this.ia == "undefined"){
            this.ia = new Ia[this.bot.data.userConfig.fight.type](this.bot);
        }
		this.ia.processTurn();
	});
	processFightContextFrame(this.bot);
}
exports.Fight.prototype.fightReady = function(){
	this.bot.connection.sendMessage("GameFightReadyMessage",{isReady:true});
}
//la fonctions a éte refais a la va vitte je trouvais pas ce putain de bug
exports.Fight.prototype.move = function(data,callBack){
	var self=this;
	var maxMp = self.bot.data.fightManager.getUserFighter().stats.movementPoints;
	var currentCellId = self.bot.data.fightManager.getUserFighter().disposition.cellId;

	var cible = self.bot.data.fightManager.getNearsetFighter(0);
	var distance = self.bot.data.mapManager.getDistance(currentCellId,cible.disposition.cellId);
	if (typeof cible != "undefined"  && self.bot.data.mapManager.getDistance(currentCellId,cible.disposition.cellId) > 2 && maxMp > 0){//2 car getDistance compte la cellule current et arrivée
		if(distance-2 < maxMp){
			maxMp = distance-2;
		}
		pathfinding.fillPathGrid(this.bot.data.mapManager.map,this.bot.data.mapManager.mapId);
		var keyMouvements = pathfinding.getPath(currentCellId,cible.disposition.cellId,self.bot.data.fightManager.getOccupiedCells(cible.contextualId),false);
		keyMouvements = keyMouvements.splice(0,maxMp+1);//maxMP+1 car la premiére cell du path corespond a ma cellId
		console.log("Process key movements...");
		/*if(self.bot.data.context == "ROLEPLAY"){//euh what the kappa ? 
			console.log("Fight move canceled !");
			callBack(false);
			return;
		}*/
		processKeyMovement(self.bot,keyMouvements,function(result){
			console.log("Proceed!");
			self.bot.data.fightManager.getUserFighter().stats.movementPoints -= maxMp;
			callBack(result);
		},false);
	}
	else{
		callBack(false)
	}
}
//spellType 0 = une attaque, 1 = un boost sur moi, 2 = un bost sur les alliée
//spellType peut etre un array... IMPORTANT la fonction bug avec les array
exports.Fight.prototype.processPile = function(spellType,repeat,callBack){
	var self = this;
	if(self.bot.data.userConfig.fight.spells.length <=0){
		self.bot.logger.log("Aucun sort dans la pile !");
	}
	//on voie si on peut cast un des spells de la pile
	for(var i = 0; i< self.bot.data.userConfig.fight.spells.length;i++){
		var spell = self.bot.data.userConfig.fight.spells[i];
		if(spell.type == spellType){
			switch(spellType){
				case 2://sur moi
					if(self.bot.data.fightManager.canCastThisSpell(spell.id)){
						self.castSpell(spell.id,self.bot.data.fightManager.fighters[self.bot.data.characterInfos.id].disposition.cellId,function(success){
							whatNext(success);
						});
						return true;
					}
				break;
				case 6://sur moi a proximite des ennemies
					if(self.bot.data.fightManager.canCastThisSpell(spell.id) == true && self.bot.data.fightManager.fightersInRange(self.bot.data.fightManager.fighters[self.bot.data.characterInfos.id].disposition.cellId,1) == true){
                        console.log("on cast diso");
						self.castSpell(spell.id,self.bot.data.fightManager.fighters[self.bot.data.characterInfos.id].disposition.cellId,(success)=>{
							whatNext(success);
						});
						return true;
					}
				break;
				default ://0 sur les ennemies,5 invocations 
					var spellCell = self.bot.data.fightManager.canCast(spell.id,spell.type);
					if(spellCell != -1){
						self.castSpell(spell.id,spellCell,function(success){
							whatNext(success);
						});
						return true;
					}
				break;
			}
		}
	}
	function whatNext(success){
		if(success && repeat){
			self.processPile(spellType,repeat,callBack);
		}
		else{
			callBack(repeat);
		}
	}
	callBack(false);
}

exports.Fight.prototype.castSpell = function(spellId,cellId,callBack){
	this.bot.logger.log("Casting spell : "+this.bot.data.fightManager.spells[spellId].nameId+ " on cell : "+cellId);
	processCastSpell(this.bot,{cellId:cellId,spellId:spellId},function(error){
		if(typeof error == "undefined"){
			callBack(true);
		}
		else{
			callBack(false);
		}
	});
}
exports.Fight.prototype.endTurn = function(){
	this.bot.connection.sendMessage("GameFightTurnFinishMessage");
}
