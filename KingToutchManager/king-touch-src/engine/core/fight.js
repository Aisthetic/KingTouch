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
        /*if(this.selectedIa !=  this.bot.data.userConfig.fight.type){
            this.selectedIa = this.bot.data.userConfig.fight.type;
            console.log("[fight]Ia updated to "+this.selectedIa);
        }
		this.ia=new Ia[this.selectedIa](this.bot);
		this.ia.processPlacement();*/
		this.fightReady();
	});
	this.bot.data.mapManager.dispatcher.on("loaded", (map)=>{
		pathfinding.fillPathGrid(map);
	})
	this.bot.data.fightManager.dispatcher.on("end", ()=>{
		this.fightContextInitialized=false;
	});
	this.bot.data.fightManager.dispatcher.on("turnStart", ()=>{
        /*if(typeof this.ia == "undefined"){
            this.ia = new Ia[this.bot.data.userConfig.fight.type](this.bot);
        }
		this.ia.processTurn();*/
		console.log("Debut du tour !");
		console.log("steps : " + Object.keys(this.bot.data.userConfig.fight.spells));
		try{this.processPile(Object.keys(this.bot.data.userConfig.fight.spells)[0] , ()=>{this.endTurn()});//plus simple ;)
		}catch(e){console.log(e)}
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
		if(self.bot.data.context == "ROLEPLAY"){
			console.log("Fight move canceled !");
			callBack(false);
			return;
		}
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


/*//spellType 0 = une attaque, 1 = un boost sur moi, 2 = un bost sur les alliée
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
*/


/*Explication de fonctionnement : La fonction va cast les sorts de la pile un par un , à chaque fois que l'on appelle la fonction et 
si on peut relancer le même sort , on appelle encore la fonction et elle va commencer à traiter la pile de le index donné , notamment 
celui du sort qu'on vient cast , si on peut pas le cast , on appelle cette fois la fonction avec le next index . 
de plus avec cette fonction on aura plus de classes IA , on process direct la pile au debug du tour */
exports.Fight.prototype.processPile = function(step , callBack){//TODO Ajouter repeat pour voir les spells qu'il faut repeter ou pas .
	if(typeof step == "undefined" || step < 0) step = 0;// un truc du genre self.bot.data.userConfig.fight.spells[i].repeatable = false ou true
	var self = this;
	if(self.bot.data.userConfig.fight.spells.length <=0){
		self.bot.logger.log("Aucun sort dans la pile !");
	}
	if(step >= self.bot.data.userConfig.fight.spells.length)//C'est bon , on a parcouru tout les sorts .
	{
		console.log("Fin du traitement de la pile .");
		callBack();
		return;
	}
	var spell = self.bot.data.userConfig.fight.spells[Object.keys(self.bot.data.userConfig.fight.spells)[step]];//du mindFuck xD
	console.log("processing spell type : " + Number(spell.type));
	switch(Number(spell.type)){
		case 2 ://sur moi
			console.log("Possible de lancer le sort sur soi ?")
			if(self.bot.data.fightManager.canCastThisSpell(spell.id)){
				console.log("Oui .")
				self.castSpell(spell.id,self.bot.data.fightManager.fighters[self.bot.data.characterInfos.id].disposition.cellId,function(success){
					if(!success)	whatNext(false, step);
					else whatNext(self.bot.data.fightManager.canCastThisSpell(spell.id) , step);
				});
				return true;
			}
			else{
				console.log("Non .")
				return whatNext(false,step);
			}
			break;
		case 6://sur moi au CaC
			if(!self.bot.data.fightManager.isOnCaC()){
				console.log("On fonce au CaC !")
				self.move(null,function(){
					if(self.bot.data.fightManager.canCastThisSpell(spell.id) && self.bot.data.fightManager.isOnCaC()){
						self.castSpell(spell.id,self.bot.data.fightManager.fighters[self.bot.data.characterInfos.id].disposition.cellId,function(success){
							if(!success)	whatNext(false, step);
							else whatNext(self.bot.data.fightManager.canCastThisSpell(spell.id) , step);
						});
					}
					else{whatNext(false,step);}
				});
				return;
			}
			else{
				if(self.bot.data.fightManager.canCastThisSpell(spell.id)){
						self.castSpell(spell.id,self.bot.data.fightManager.fighters[self.bot.data.characterInfos.id].disposition.cellId,function(success){
							if(!success)	whatNext(false, step);
							else whatNext(self.bot.data.fightManager.canCastThisSpell(spell.id) , step);
						});
						return;
				}
				else{return whatNext(false,step);}
			}
			break;
		default ://0 sur les ennemies,5 invocations 
			console.log("Maybe default ? ")
			var spellCell = self.bot.data.fightManager.canCast(spell.id,spell.type);
			if(spellCell != -1){
				console.log("Attaque sur les ennemis .");
				self.castSpell(spell.id,spellCell,function(success){
					if(!success)	whatNext(false, step);
					else whatNext(self.bot.data.fightManager.canCastThisSpell(spell.id) , step);
				});
				return;
			}
			else return whatNext(false , step)
			break;
	}
	function whatNext(RepeatLastStep,step){
		if(RepeatLastStep){
			console.log("On relance le même sort .")
			self.processPile(step,callBack);
		}
		else{
			console.log("On passe au sort suivant .")
			self.processPile(step + 1,callBack);
		}
	}
	console.log("WTF , la fonction est censée ne jamais arriver à cette ligne ...");
};

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
exports.Fight.prototype.endTurn = function(){//TODO Ajouter une action finale avant de finir le cbt (genre fuir ou je sais pas)
	this.bot.connection.sendMessage("GameFightTurnFinishMessage");
}
