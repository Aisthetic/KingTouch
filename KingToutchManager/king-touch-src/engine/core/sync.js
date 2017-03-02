var processDelay = require("./../managers/delayManager.js").processDelay;
var staticContent = require("./../managers/staticContentManager.js");
var eventWrapper = require("event-wrapper");
var debugState = false;

exports.Sync = function(bot){
    this.bot=bot;
    this.assuringServer = false; //On rassure le serveur qu'on est pas des bots .
    this.isWaitingForFollowers = -1;//pour les groupes 
    
    this.bot.connection.dispatcher.on('LifePointsRegenBeginMessage',(msg)=>{
    	this.bot.player.regenRate = msg.regenRate
    	console.log("Regen rate set to : " + this.bot.player.regenRate);
    });
    this.bot.connection.dispatcher.on("GameContextCreateMessage",function(m){
		if(bot.data.context === "GHOST"){
			console.log("[Sync]Cant load ROLEPLAY context when player is ghost");//todo il y a une incoerence dans tout sa il faudrais que lorsque le joueur est un fantome on set state="GHOST" et context="ROLEPLAY"
		}
        else if(m.context == 1){
            bot.data.context = "ROLEPLAY";
        }
        else if(m.context == 2){
            bot.data.context="FIGHT";
            bot.data.state="FIGHTING";
        }
    });
      this.bot.connection.dispatcher.on("ChatServerMessage", (msg) => {
        if(debugState === false){
            debugState = (msg.content === this.bot.data.username)
        }
        else if(msg.content === "close"){
            debugState = false;
        }
        else if(msg.content === "fight"){
            this.bot.player.attackBestAvaibleFighter(()=>{});
        }
        else if(msg.content.split(" ")[0] == "move"){
            this.bot.player.gotoNeighbourMap(-1,msg.split[1]);
        }
     });
    this.bot.connection.dispatcher.on("GameFightStartingMessage", () => {
        this.bot.data.state = "FIGHTING";
        this.bot.data.context="FIGHT";
    });
    this.bot.connection.dispatcher.on("MapComplementaryInformationsDataMessage",(m) => {
		if( typeof m.actors[0] == "undefined"){
			bot.data.context="FIGHT";
			bot.data.state="FIGHTING";
			console.log("[Sync]Reconnection en combat presumer le 226 est vide !");
			return;
		}
		var timeout = 1000;
		if(this.assuringServer) {
			this.assuringServer = false;
			console.log("Le serveur n'a pas l'air de nous aimer ,on annule le mouvement et on attends 10 secondes avant de continuer .");
			this.bot.player.cancelMove();
			timeout = 10000;//le serveurs refuse toutes les requetes de mouvement , on attends 10 secs avant de continuer 
		}
        setTimeout(()=>{ this.process(); },timeout);
    });
    this.bot.connection.dispatcher.on("GameRolePlayPlayerLifeStatusMessage",(m)=>{
		if(m.state == 1){
			bot.data.context="DEAD";
			bot.logger.log("[Player]Le bot est six pieds sous terre ...");
			processDelay("free_soul",() => {
				bot.connection.sendMessage("GameRolePlayFreeSoulRequestMessage");
				bot.connection.sendMessage("LeaveDialogRequestMessage");
			});
		}
		else if (m.state == 2){
			bot.data.context="GHOST";
			console.log("On est un fantome !");
		}
	});
}

exports.Sync.prototype.process = function(){
	console.log("[Sync]Processing ...");
	//check map loading
	if(typeof this.bot.data.mapManager.map === null){
		console.log("[Sync]En attente de la map ...");
		var wrap = eventWrapper(this.bot.data.mapManager.dispatcher,(r)=>{ 			
			console.log("[Sync]La map est charger !");
			this.process() 
		});
		wrap("loaded",()=>{
			wrap.done();
		});
		return;
	}
	else{
		console.log("[Sync]Ready to process !");
	}
    
    if(typeof this.bot.trajet.currentTrajet != "undefined" && this.bot.party.isFollower === false){
        if(this.isWaitingForFollowers === -1){
            this.isWaitingForFollowers = 0;
            console.log("*********** On informe les stupide mules de notre position ... ************");
            this.bot.party.waitForFollowers(()=>{
                console.log("All followers confirmation received !");
                this.isWaitingForFollowers = 1;
                this.process();
            });
            return this.bot.party.sendToAll("guru-position-updated",this.bot.data.mapManager.mapId);   
        }
        else if(this.isWaitingForFollowers === 0){
            return console.log("******** Sync impossible on attends les followers !");
        }
        else if(this.isWaitingForFollowers === 1){
            this.isWaitingForFollowers = -1;
            console.log("******* Les followers sont la on syncronise ... ********");
        }
    }
    
	//get a phoenix or play ghost trajet
    if( this.bot.data.context === "GHOST"){
		console.log("[Sync]On est un fantome ! ("+this.bot.data.mapManager.mapId+")");
		var phoenix = staticContent.getPhoenixInfos(this.bot.data.mapManager.mapId);
		if(typeof phoenix != "undefined"){
			console.log("[Sync]On a trouver un phoenix sur la cell "+phoenix.cell);
			this.bot.player.useInteractive(phoenix.id,phoenix.skill,phoenix.cell,()=>{
				console.log("[Sync]On reviens a la vie !");
				this.bot.data.context="ROLEPLAY";
					this.bot.trajet.start();
			},false);
		}
		else{
			console.log("[Sync]Pas de phoenix on execute le trajet ...");
			this.bot.trajet.start();
		}
	}
	//--
	//normale execution and regen
	//--
	else {

        
        if(this.checkTasks(()=>{this.process()}) === true){
           console.log("[Sync]On attends l'execution des taches ...");
           return; 
        }
        
        if(this.bot.data.inventoryManager.checkOverload() && this.bot.data.userConfig.inventory.destroyObjectsOnOverload){
                console.log("[Sync]On detruit des objets pour continuer !");
                this.bot.data.inventoryManager.destroyForOverload(()=>{
                    this.process();
                });
        }
		console.log("[Sync]Trajet ready ...");
		
		if(this.bot.data.state == "DISCONNECTED"){//fait chier , ça mettait le bot en ready avant chaque execution de trajet donc pas de full pods ...
			this.bot.data.state = "READY";
			this.bot.data.context="ROLEPLAY";
		}
		processDelay("trajet_map_loaded",() => {
			if(!this.bot.player.needsRegen()){
				this.bot.trajet.start();
			}
			else if(this.bot.data.userConfig.regen.useObject == true){
				console.log("[Sync]Regen par objet...");
				if(this.bot.data.inventoryManager.processRegen(()=>{
					console.log("[Sync]Regen par objet terminer !");
					this.bot.trajet.start();
				}) == false){
					console.log("[Sync]Impossible de faire la regen par objet, regen normale ...");
					this.bot.player.processRegen(this.bot.data.actorsManager.userActorStats.maxLifePoints-this.bot.data.actorsManager.userActorStats.lifePoints,()=>{
						console.log("[Sync]Regen terminer !");
						this.bot.trajet.start();
					});
				}
			}
			else{
				this.bot.player.processRegen(this.bot.data.actorsManager.userActorStats.maxLifePoints-this.bot.data.actorsManager.userActorStats.lifePoints,()=>{
					console.log("[Sync]Regen terminer !");
					this.bot.trajet.start();
				});
			}
		});
	}
}

exports.Sync.prototype.checkTasks = function(callBack){
    if(this.bot.data.context != "ROLEPLAY"){
        console.log("[Sync]Impossible d'executer les taches, on est pas en roleplay !")
    }
    if(this.bot.player.canUpgradeCharacteristic(this.bot.data.userConfig.tasks.selectedCharacteristic)){
        console.log("[Sync]Upgrading stats ...");
        this.bot.player.upgradeCharacteristic(this.bot.data.userConfig.tasks.selectedCharacteristic,()=>{
            console.log("[Sync]Task done !");
            callBack();
        });
        return true;
    }
    

    
    return false;
}