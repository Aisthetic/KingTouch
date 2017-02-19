var processObjectUse = require("./../frames/game/inventory/objectUseFrame.js").processObjectUse;
var processDeleteObject = require("./../frames/game/inventory/deleteObjectFrame.js").processDeleteObject;
var staticContentManager = require("./staticContentManager");
var EventEmitter = require("events").EventEmitter;

exports.InventoryManager = function(bot){
    this.bot = bot;
    this.objects = {};
    this.regenObjects = {};
    this.pods = 0;
    this.maxPods =1;
    this.kamas = 0;
    this.dispatcher = new EventEmitter();

    bot.connection.dispatcher.on("InventoryWeightMessage",(m)=>{
        this.pods=m.weight;
        this.maxPods=m.weightMax;
        this.checkOverload();
    });
    bot.connection.dispatcher.on("InventoryContentMessage",(m)=>{
        this.kamas=m.kamas;
        this.objects = {};
        this.regenObjects = {};
        for(var i = 0; i<m.objects.length;i++){//on cherche dans l´inventaire des objet utilisable pour la regen
            var o = m.objects[i];
            this.objects[o.objectUID] = o;
            for(var x = 0;x<o.effects.length;x++){
                var f = o.effects[x];
                if(f._type == "ObjectEffectInteger" && f.actionId == "110")//objet qui donne de la vie
                {
                    this.regenObjects[o.objectUID] = f.value;
                    this.bot.logger.log("[Inventory]Object : "+o.objectUID+" selected for regen !");
                }
            }
        }
        
        this.loadObjectsInfos();
    });
    bot.connection.dispatcher.on("ObjectAddedMessage",(m)=>{
		try{
			this.objects[m.object.objectUID] = m.object;
            loadObjectsInfos();
		}
		catch(e){
			console.log("[InventoryManager]Can't find object for add : "+JSON.stringify(m));
		}
    });
    bot.connection.dispatcher.on("ObjectQuantityMessage",(m)=>{
		try{
			this.objects[m.objectUID].quantity = m.quantity;
		}
		catch(e){
			console.log("[InventoryManager]Can't find object for quantity : "+JSON.stringify(m));
		}
    });
}
exports.InventoryManager.prototype.processRegen = function(cb){//todo debug, la fonction rique de bugger avec des objet au effets multiple et si on a plusieurs objet en petite quantité
    if(this.regenObjects.length <= 0){
        this.bot.logger.log("[Inventory]No usable object found !");
        return false;
    }
    for(var i in this.regenObjects){
        if(this.objects[i].quantity > 15){//on verifie pas plus que sa la quantité ou les pv le server le fait pour nous ^^
            processObjectUse(i,this.bot.data.userConfig.regen.maxObjectUse,this.bot.connection,cb);
            return true;
        }
    }
    this.bot.logger.log("[inventory]Bad quantity for object regen !");
    return false;
}
exports.InventoryManager.prototype.checkOverload = function(){//todo destruction ou retour en bank
    if (this.pods >= (this.maxPods-10)){
        this.bot.data.state="OVERLOAD";
        this.bot.logger.log("[Inventory]Full pods !");
        return true;
    }
    return false;
}
exports.InventoryManager.prototype.destroyForOverload = function(callBack,podsToClear){//detruit l'objet le plus abondant en quantiter sufisante pour pouvoire bouger
    if(typeof podsToClear == "undefined"){ podsToClear = 30; }
    var diff = this.pods - (this.maxPods-20);
    console.log("Destruction d'objets pour bouger (overload : "+diff+") ...");
    if(diff >= 0){
        diff += 10;
        var max = 0;
        var selected = 0;
        for(var i in this.objects){
            var obj = this.objects[i];
            var w = obj.quantity*obj.static.realWeight
            if(w > max && destroyable(obj)){
                selected=i;
                max = w;
            }
        }
        
        if(selected == 0){
            console.log("Ouloulou c'est quoi ce bordel ^^'");
            return
        }
        
        if(typeof this.objects[selected].static == "undefined"){
            console.log("[InventoryManager]Destruction annuler, les objets ne sonts pas charger !");
            this.dispatcher.on("itemsInfosLoaded",()=>{
                console.log("[InventoryManager]Objets charger, on commence la destruction ...");
                this.destroyForOverload(callBack);
            });
        }
        let poid = this.objects[selected].static.realWeight;
        var count = Math.floor(podsToClear * poid);
        
        if(count > selected.quantity){
            count=selected.quantity;
        }
        console.log(" "+count);
        processDeleteObject(this.bot,selected,count,()=>{
           console.log("Destruction ok !");
            callBack();
        });
    }
    else{
        console.log("Destruction annuler on a asser de pods !")
    }
    
    function destroyable(obj){
        for(var i in this.regenObjects){
            if(i == obj.objectUID){
                return false;
            }
        }
        return true;
    }
}
exports.InventoryManager.prototype.freeInventory = function(){
    var info = staticContentManager.getBankInfos();
    if(staticContentManager.isBankIndoor(this.bot.data.mapManager.mapId) === false){
        console.log("Impossible de vider sons inventaire, on est pas dans une bank")
        return false;
    }
    else{
           
    }
}

exports.InventoryManager.prototype.loadObjectsInfos = function(){
    var ids = [];
    for(var i in this.objects){
        var obj = this.objects[i];
        if(typeof obj.static == "undefined"){
            ids.push(obj.objectGID);
        }
    }
    
    staticContentManager.getItemsInfos(ids,(result)=>{
        for(var i in result){
            var itemInfo = result[i];
            for(var x in this.objects){
                if(this.objects[x].objectGID == i){
                    this.objects[x].static = itemInfo;
                }
            }
        }
        console.log("[InventoryManager]Items infos loaded !");
        this.dispatcher.emit("itemsInfosLoaded");
    });
}


