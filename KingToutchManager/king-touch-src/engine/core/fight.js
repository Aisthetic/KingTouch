var pathfinding = require("./utils/pathfinding.js");
var processKeyMovement = require("./../frames/game/player/fight/movementFrame.js").processKeyMovement;
var processFightContextFrame = require("./../frames/game/player/fight/fightContextFrame.js").processFightContextFrame;
var processCastSpell = require("./../frames/game/player/fight/castSpellFrame.js").processCastSpell;
var getMapPoint = pathfinding.getMapPoint;
var getShapeRing = require("./../core/utils/spellShape.js").shapeRing;

var getCellId = pathfinding.getCellId;
var Ia = {
	"default":require("./ia/default.js").Ia,
	"sacri":require("./ia/sacri.js").Ia,
}

exports.Fight = function(bot){
    this.selectedIa = "default";
    this.hasAttackedActor = false;//pour ne pas s'enfuir dans tout les cas 
	this.fightContextInitialized = false;
	this.forceEndTurn = false;
	this.bot = bot;
	this.bot.data.fightManager.dispatcher.on("start", ()=>{
		this.fightContextInitialized=true;
		this.fightReady();//todo gérer les placements
	});
	this.bot.data.mapManager.dispatcher.on("loaded", (map)=>{
		pathfinding.fillPathGrid(map);
	})
	this.bot.data.fightManager.dispatcher.on("end", ()=>{
		this.fightContextInitialized=false;
	});
	this.bot.data.fightManager.dispatcher.on("turnEnd", (id)=>{
		console.log('---------------Fin du tour---------------');
		this.forceEndTurn = true;
	});
	this.bot.data.fightManager.dispatcher.on("turnStart", ()=>{
		console.log("Debut du tour !");
		this.hasAttackedActor = false;
		this.forceEndTurn = false;
		try{this.processPile(Object.keys(this.bot.data.userConfig.fight.spells)[0] ,()=>{this.finishTurn()});//plus simple ;)
		}catch(e){console.log(e)}
	});
	processFightContextFrame(this.bot);
}

exports.Fight.prototype.fightReady = function(){
	this.bot.connection.sendMessage("GameFightReadyMessage",{isReady:true});
}

//la fonctions a éte refais a la va vitte je trouvais pas ce putain de bug
//La fonction ne fait que rush pourquoi l'appeler move ? plutôt sink .
exports.Fight.prototype.sink = function(callBack){//Faire ka fonction flee() pour se replier .
	if(this.bot.data.fightManager.isOnCaC()) return callBack(true);
	this.move(this.bot.data.fightManager.getNearsetFighter(0).disposition.cellId , callBack);	
}

exports.Fight.prototype.flee = function(callBack){//Faire ka fonction flee() pour se replier .
	var currentCellId = this.bot.data.fightManager.getUserFighter().disposition.cellId;
	var point = getMapPoint(currentCellId)
	var possiblePoints = getShapeRing(point.x,point.y,0,this.bot.data.fightManager.getUserFighter().stats.movementPoints);
	var cells = {};
	for(var i =0;i<possiblePoints.length;i++){//Remplissage d'un tableau contenant les cellules possible à atteindre avec les pm actuels du bot
		var cellId = getCellId(possiblePoints[i][0],possiblePoints[i][1]);
		if(!cellId || !this.bot.data.fightManager.cellIsFree(cellId)) continue;
		cells[cellId]= true;
	}
	cells = Object.keys(cells);
	var getDistance = this.bot.data.mapManager.getDistance;
	var enemieTeamId = 0;
	if(this.bot.data.fightManager.getUserFighter().teamId == enemieTeamId) enemieTeamId = 1;
	var reference = this.bot.data.fightManager.getFightersByDistance(enemieTeamId)[0].disposition.cellId;
	if(!reference) reference = currentCellId;
	var farthest = currentCellId;
 	var maxDist = getDistance(reference,currentCellId);
 	for(var i in cells){
 		var newDist = getDistance(reference,cells[i]);
 		if(!maxDist) maxDist = newDist;
 		if(!farthest) farthest = cells[i];
 		if(maxDist<newDist){
 			maxDist = newDist;
 			farthest = cells[i]
 		}
 	}
 	console.log("Choosen cell to flee to : " + farthest);
 	if(!farthest) return callBack(false); //normalement ceci ne doit jamais arriver mais on sait jamais ^^'
	this.move(farthest, callBack);	
}
//Si la cellule est trop loin , le bot se rapproche de celle-ci sur le max du pm
exports.Fight.prototype.move = function(cellId , callBack){
	if(cellId == this.bot.data.fightManager.getUserFighter().disposition.cellId) return callBack(true);
	var maxMp = this.bot.data.fightManager.getUserFighter().stats.movementPoints;
	var currentCellId = this.bot.data.fightManager.getUserFighter().disposition.cellId;
	if(!cellId || this.bot.data.context == "ROLEPLAY"){
		console.log("[FIGHT] Movement aborted : " + this.bot.data.context +'/'+ cellId);
		return callBack(false);
	}
	pathfinding.fillPathGrid(this.bot.data.mapManager.map,this.bot.data.mapManager.mapId);
	var keyMouvements = pathfinding.getPath(currentCellId,cellId,this.bot.data.fightManager.getOccupiedCells(),false).splice(0,maxMp+1);
	console.log(keyMouvements);
	processKeyMovement(this.bot,keyMouvements,(result)=>{
		if(result)this.bot.data.fightManager.getUserFighter().stats.movementPoints -= maxMp;
		callBack(result);
	},false);
}


/*Explication de fonctionnement : La fonction va cast les sorts de la pile un par un , à chaque fois que l'on appelle la fonction et 
si on peut relancer le même sort , on appelle encore la fonction et elle va commencer à traiter la pile de le index donné , notamment 
celui du sort qu'on vient cast , si on peut pas le cast , on appelle cette fois la fonction avec le next index . 
de plus avec cette fonction on aura plus de classes IA , on process direct la pile au debug du tour */
exports.Fight.prototype.processPile = function(step , callBack){//TODO Ajouter repeat pour voir les spells qu'il faut repeter ou pas .
	if(typeof step == "undefined" || step < 0) step = 0;// un truc du genre self.bot.data.userConfig.fight.spells[i].repeatable = false ou true
	if(this.forceEndTurn) return this.endTurn(); 
	var self = this;
	if(self.bot.data.userConfig.fight.spells.length <=0){
		self.bot.logger.log("[FIGHT] Aucun sort dans la pile !");
		return callBack();
	}
	if(step >= self.bot.data.userConfig.fight.spells.length){//C'est bon , on a parcouru tout les sorts .
		return callBack();
	}
	var spell = self.bot.data.userConfig.fight.spells[step];
	console.log("[FIGHT] processing spell type : " + Number(spell.type));
	switch(Number(spell.type)){
		case 1 ://sur moi
			if(self.bot.data.fightManager.canCastThisSpell(spell.id)){
				self.castSpell(spell.id,self.bot.data.fightManager.fighters[self.bot.data.characterInfos.id].disposition.cellId,function(success){
					if(!success)	whatNext(false, step);
					else whatNext(self.bot.data.fightManager.canCastThisSpell(spell.id) , step);
				});
				return true;
			}
			else{
				return whatNext(false,step);
			}
			break;
		case 3://sur moi au CaC , pas beosin de tenir en compte la tactique parce si on rush au CàC => perso agressif .
			if(!self.bot.data.fightManager.isOnCaC()){
				self.sink(()=>{
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
		case 0://sur les ennemis.
			var spellCell = self.bot.data.fightManager.canCast(spell.id,spell.type);
			if(spellCell){
				self.castSpell(spell.id,spellCell,function(success){
					if(!success)	whatNext(false, step);
					else whatNext(self.bot.data.fightManager.canCastThisSpell(spell.id) , step);
				});
				return;
			}
			else if (this.bot.data.fightManager.canCastThisSpell(spell.id)){
				this.getInSpellRange(spell , (result)=>{//On se rapproche intelligemment
					if(result) {//Si reussi on cast
						self.castSpell(spell.id,spellCell,function(success){
						if(!success) whatNext(false, step);
						else whatNext(self.bot.data.fightManager.canCastThisSpell(spell.id) , step);
						});
					}
					else whatNext(false , step);//Si pas reussi on passe au sort suivant 
				})
				return;
			} 
			else return whatNext(false , step);
			break;
		default ://todo gérer les invocations .
			console.log("[FIGHT] les sorts de type " + spell.type + " ne sont pas encore gérés .");
			break;
			
	}
	function whatNext(RepeatLastStep,step){
		step = Number(step);
		if(RepeatLastStep){
			self.processPile(step,callBack);
		}
		else{
			self.processPile(step + 1,callBack);
		}
	}
	console.log("[FIGHT] WTF , la fonction est censée ne jamais arriver à cette ligne ...");
};

exports.Fight.prototype.castSpell = function(spellId,cellId,callBack){
	this.bot.logger.log("Casting spell : "+this.bot.data.fightManager.spells[spellId].nameId+ " on cell : "+cellId);
	if(cellId != this.bot.data.fightManager.getUserFighter().disposition.cellId) this.hasAttackedActor = true;//Le bot a cast le spell sur un  X appartenant à {ennemis ; alliés}\{moi} un peu de maths :3 
	processCastSpell(this.bot,{cellId:cellId,spellId:spellId},function(error){
		if(typeof error == "undefined"){
			callBack(true);
		}
		else{
			callBack(false);
		}
	});
}

//Ajoute un peu de sauce avant de présenter le plat ;) 
exports.Fight.prototype.finishTurn = function(){//TODO voir s'il y a d'autres IA de finition possibles
	switch(this.bot.data.userConfig.fight.mode){//tactique
		case 0 ://agressive
			this.sink(()=>this.endTurn()); 
			break;
		case 1://Fuyarde
			if(this.hasAttackedActor)  this.flee(()=>this.endTurn());
			else this.sink(()=>this.endTurn());
			break;
		default : 
			this.endTurn();
			break;
	}
}
//Finis le tour .
exports.Fight.prototype.endTurn = function(){
	this.bot.connection.sendMessage("GameFightTurnFinishMessage");
}
exports.Fight.prototype.getInSpellRange = function(spell, cb){
	var cell = this.bot.data.fightManager.getCellForIntelligentMove(spell);
	if(!cell) console.log("Aucune cellule magique :x ."); return cb(false);
	this.move(cell , cb);
}
exports.Fight.prototype.stillInFight = function(){//TODO Il se peut que j'aie oublié quelques verifs ...
	if(this.bot.data.fightManager.getTeam(0).length > 0 && this.bot.data.fightManager.getTeam(1).length > 0) return true;
	return false;
}