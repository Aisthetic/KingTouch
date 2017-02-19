//ia de test pour ecaflip
exports.Ia = function(bot){
	console.log("[Ia]Default loaded !");
	this.bot = bot;
	this.turn;
}

exports.Ia.prototype.processPlacement = function(){
	this.turn = 0;
	setTimeout(()=>{this.bot.fight.fightReady()},1000);//pas encors fais les placements
}
exports.Ia.prototype.processTurn = function(){
	if(this.turn == 0){
		this.bot.fight.processPile(5,true,(success)=>{//d´abbord on se boost et on invocke 
			this.bot.fight.processPile(2,true,(success)=>{
				this.bot.logger.log("IA on se raproche");
				result = this.bot.fight.move({wantCac:true},(r)=>{
					this.bot.fight.endTurn();
				});
			});
		});
	}
	else{
		this.bot.fight.processPile(0,true,(success)=>{//puis on  voie si on peut attaquer
			if(success == true){//si on a reussit a cast on fini son tour
				this.bot.logger.log("IA on a fini");
				this.bot.fight.endTurn();
			}
			else{//si non on se raproche
				this.bot.logger.log("IA on se raproche");
				result = this.bot.fight.move({wantCac:true},(r)=>{
					this.bot.fight.endTurn();
				});
			}
		});
	}
	this.turn++;
}