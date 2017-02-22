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
		console.log("spells : ");
		console.dir(Object.keys(this.bot.data.userConfig.fight.spells));
		console.dir(this.bot.data.userConfig.fight.spells);
		this.hasAttackedActor = false;
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
	console.log("[FIGHT] On fonce au CaC !")
	this.move(this.bot.data.fightManager.getNearsetFighter(0).disposition.cellId , callBack);	
}

exports.Fight.prototype.flee = function(callBack){//Faire ka fonction flee() pour se replier .
	var currentCellId = this.bot.data.fightManager.getUserFighter().disposition.cellId;
	var point = getMapPoint(currentCellId)
	console.log("Map point : ")
	console.dir(point);
	var possiblePoints = getShapeRing(point.x,point.y,0,this.bot.data.fightManager.getUserFighter().stats.movementPoints);
	var cells = {};
	for(var i =0;i<possiblePoints.length;i++){//Remplissage d'un tableau contenant les cellules possible à atteindre avec les pm actuels du bot
		var cellId = getCellId(possiblePoints[i][0],possiblePoints[i][1]);
		if(!cellId || !this.bot.data.fightManager.cellIsFree(cellId)) continue;
		cells[cellId]= true;
	}
	cells = Object.keys(cells);
	console.log("Possible cells to flee to : ");
	console.log(cells);
	var getDistance = this.bot.data.mapManager.getDistance;
	var reference = this.bot.data.fightManager.getNearsetFighter(0).disposition.cellId;
	if(!reference) reference = currentCellId;
	console.log("Reference for fleeing set to : " + reference);
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
	var maxMp = this.bot.data.fightManager.getUserFighter().stats.movementPoints;
	var currentCellId = this.bot.data.fightManager.getUserFighter().disposition.cellId;
	if(!cellId || this.bot.data.context == "ROLEPLAY"){
		console.log("[FIGHT] Movement aborted : " + this.bot.data.context +'/'+ cellId);
		return callBack(false);
	}
	pathfinding.fillPathGrid(this.bot.data.mapManager.map,this.bot.data.mapManager.mapId);
	var keyMouvements = pathfinding.getPath(currentCellId,cellId,this.bot.data.fightManager.getOccupiedCells(),false);
	keyMouvements = keyMouvements.splice(0,maxMp+1);//maxMP+1 car la premiére cell du path corespond a ma cellId
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
	if(!this.fightContextInitialized) return console.log("Fin du combat , arrêt du traitement de la pile .");
	var self = this;
	if(self.bot.data.userConfig.fight.spells.length <=0){
		self.bot.logger.log("[FIGHT] Aucun sort dans la pile !");
		return callBack();
	}
	if(step >= self.bot.data.userConfig.fight.spells.length){//C'est bon , on a parcouru tout les sorts .
		console.log("[FIGHT] Fin du traitement de la pile .");
		return callBack();
	}
	console.log("[FIGHT] Step : " + step);
	var spell = self.bot.data.userConfig.fight.spells[step];
	console.log("[FIGHT] processing spell type : " + Number(spell.type));
	switch(Number(spell.type)){
		case 2 ://sur moi
			console.log("[FIGHT] Possible de lancer le sort sur moi ?")
			if(self.bot.data.fightManager.canCastThisSpell(spell.id)){
				console.log("[FIGHT] Oui .")
				self.castSpell(spell.id,self.bot.data.fightManager.fighters[self.bot.data.characterInfos.id].disposition.cellId,function(success){
					if(!success)	whatNext(false, step);
					else whatNext(self.bot.data.fightManager.canCastThisSpell(spell.id) , step);
				});
				return true;
			}
			else{
				console.log("[FIGHT] Non .")
				return whatNext(false,step);
			}
			break;
		case 1://sur moi au CaC , pas beosin de tenir en compte la tactique parce si on rush au CàC => perso agressif .
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
			console.log("[FIGHT] Possible d'attaquer un ennemi ? ")
			var spellCell = self.bot.data.fightManager.canCast(spell.id,spell.type);
			if(spellCell){
				console.log("oui .");
				self.castSpell(spell.id,spellCell,function(success){
					if(!success)	whatNext(false, step);
					else whatNext(self.bot.data.fightManager.canCastThisSpell(spell.id) , step);
				});
				return;
			}
			else{
				console.log("[FIGHT] Trying to get in spell range .");//Brace your mind 
				this.getInSpellRange(spell , (result)=>{//On se rapproche intelligemment
					if(result) {//Si reussi on cast
						self.castSpell(spell.id,spellCell,function(success){
						if(!success) whatNext(false, step);
						else whatNext(self.bot.data.fightManager.canCastThisSpell(spell.id) , step);
						});
					}
					else whatNext(false , step);//Si pas reussi on passe au sort suivant 
				})
				console.log("[FIGHT] Non , on passe au sort suivant .");
				return;
			} 
			break;
		default :
			console.log("[FIGHT] les sorts de type " + spell.type + " ne sont pas encore gérés .");
			break;
			
	}
	function whatNext(RepeatLastStep,step){
		step = Number(step);
		if(RepeatLastStep){
			console.log("On relance le même sort .")
			self.processPile(step,callBack);
		}
		else{
			console.log("On passe au sort suivant .")
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
exports.Fight.prototype.finishTurn = function(){//TODO voir s'il y a d'autres IA possibles
try
	{console.log("Finalisation du tour avec la tactique : " + this.bot.data.userConfig.fight.mode);
		switch(this.bot.data.userConfig.fight.mode){//tactique
			case 0 ://agressive
				this.sink(()=>this.endTurn());//sans parentheses , plus sexy ;) 
				break;
			case 1://Fuyarde
				if(this.hasAttackedActor)  this.flee(()=>this.endTurn());
				else this.sink(()=>this.endTurn());
				break;
			default : 
				this.endTurn();
				break;
		}}
		catch(e){console.log(e)}
}
//Finis le tour .
exports.Fight.prototype.endTurn = function(){
	this.bot.connection.sendMessage("GameFightTurnFinishMessage");
}
exports.Fight.prototype.getInSpellRange = function(spell, cb){
	var cell = this.bot.data.fightManager.getCellForIntelligentMove(spell);
	if(!cell) return cb(false);
	this.move(cell , cb);
}