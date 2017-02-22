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
    var success = false;
    
    this.bot.fight.processPile(5,true,(success)=>{//d´abbord on se boost et on invocke 
        this.bot.fight.processPile(2,true,(success)=>{
            this.bot.fight.processPile(0,true,(r)=>{// on voie si on peut faire un attaque de masse
                if(r) {success = true;}
                this.bot.fight.processPile(0,true,(r)=>{//une attaque normale
                    if(r) {success = true;}

                    var wantCac;
                    if(success === true && this.bot.data.userConfig.fight.mode == 0){
                        this.bot.logger.log("IA on se raproche ...")
                        wantCac = true;
                    }
                    else{
                        this.bot.logger.log("IA on fuis ...");
                        wantCac = false;
                    }
                    this.bot.fight.move({wantCac:wantCac},(r)=>{
                        this.bot.fight.endTurn();
                    });
                });
            });
        });
    });
}
