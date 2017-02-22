//ia sacri
exports.Ia = function(bot){
	console.log("[Ia]Sacri loaded !");
	this.bot = bot;
	this.turn;
}

exports.Ia.prototype.processPlacement = function(){
	this.turn = 0;
	setTimeout(()=>{this.bot.fight.fightReady()},1000);//pas encors fais les placements
}
exports.Ia.prototype.processTurn = function(){
	this.bot.fight.processPile(5,true,(success)=>{//d´abbord on se boost et on invocke 
		this.bot.fight.processPile(2,true,(success)=>{
			this.bot.logger.log("IA on se raproche");
			result = this.bot.fight.move({wantCac:true},(r)=>{//on se raproche
				this.bot.fight.processPile(6,true,(success)=>{//on fais disolution
					this.bot.fight.processPile(0,true,(success)=>{//si on peut pas on voie si on a un sort d'ataque
						this.bot.fight.endTurn();
					});
				});
			});
		});
	});
}