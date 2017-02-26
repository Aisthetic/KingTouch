var hdvFrame = require("./../frames/game/inventory/hdvFrame.js");

exports.ExchangeManager = function(bot){
    this.bot = bot;
}
exports.ExchangeManager.prototype.canSellInventory = function(){
    console.log("Looking for sellable objects ...");
    var sellableList = [];
    for(var i = 0; i < this.bot.data.userConfig.inventory.sellList.length; i++){
        var pat = this.bot.data.userConfig.inventory.sellList[i];
        console.log("Looking for "+pat.objectId+" in inventory ...");
        console.log(JSON.stringify(pat));
        if(typeof this.bot.data.inventoryManager.objects[pat.objectId] != "undefined"){
             console.log(pat.objectId + " finded (UID) !");
            sellableList.push(this.bot.data.inventoryManager.objects[pat.objectId]);
            sellableList[sellableList.length-1].config = this.bot.data.userConfig.inventory.sellList[i];
        }
        else{
            console.log("Can't find object by UID, looking for GID ...");
            for(var j in this.bot.data.inventoryManager.objects){
                var o = this.bot.data.inventoryManager.objects[j];
                if(o.objectGID === pat.objectGID){
                    sellableList.push(o);
                    sellableList[sellableList.length-1].config = this.bot.data.userConfig.inventory.sellList[i];
                    console.log(pat.objectGID+" finded (GID) !")
                    break;
                }
            }
        }
    }
    
    if(sellableList.length === 0){
        return false;
    }
    else{
        return sellableList;
    }
}

exports.ExchangeManager.prototype.sellInventory = function(callBack,objects,x){
    if(this.bot.data.context != "ROLEPLAY"){
        console.log("**Inventory sell canceled, we'arent in roleplay conext !**");
        return;
    }    
    if(typeof x == "undefined"){
        x=0;
    }
    if(typeof objects[x] == "undefined"){
        console.log("Tout les objets on ete vendu !");
        return callBack();
    }
    console.log("**Selling inventory "+x+" of "+objects.length+" items**");
    
    this.sellItem(objects,x,()=>{
        if(x+1<objects.length){
            x++;
            this.sellInventory(callBack,objects,x);
        }
        else{
            console.log("All item selled !");
            callBack();
        }
    });
    
}

exports.ExchangeManager.prototype.removeAllItem = function(callBack){
    console.log("On retire tout les objets de l'hdv ...");
    
    hdvFrame.openHdv(this.bot,false,(result)=>{
        console.log(result.objectsInfos.length+ " slots a retirer !");
        setTimeout(()=>{
            removeAll(0,result.objectsInfos,()=>{
                hdvFrame.close();
                console.log("Tout les objets on ete retirer !");
                callBack();
            });
        },100);
    });
    
    function removeAll(index,objects,cb){
        console.log("On retire l'objet ("+index+" sur "+objects.length+")")
        if(index < objects.length){
            setTimeout(()=>{
                hdvFrame.removeItem(objects[index],()=>{
                    console.log("Objet retirer, on passe au suivant ...");
                    removeAll(index++,objects,cb);
                });
            },15);
        }
        else{
            console.log("Il ne reste plus d'objet a retirer !");
            cb();
        }
    }
}

exports.ExchangeManager.prototype.sellItem = function(objects,i,callBack){
    console.log("Selling "+objects[i].objectUID);
    var obj = objects[i];
    
    var divider = 1;
    if(obj.config.mode === 2){
        divider = 10;
    }
    else if(obj.config.mode === 3){
        divider = 100;
    }
    
    var slotCount = Math.floor(obj.quantity / divider);
    console.log("Trying to sell "+slotCount+" slot of "+divider+" (total avaible : "+obj.quantity+")");
    
    this.getItemPrice(obj,(result,price) => {
        if(result === false){
            console.log("Can't ger price of "+obj.objectUID);
            return callBack();
        }
        console.log("Start selling, price "+price);
        
        hdvFrame.openHdv(this.bot,false,(m)=>{
            
            var slotAvaible = m.sellerDescriptor.maxItemPerAccount - m.objectsInfos.length;
            slotAvaible -= 1;
            console.log("Slot avaible : "+slotAvaible);
            if(slotAvaible < slotCount){
                slotCount = slotAvaible;
            }
            
            var x = 0;
            repeatSell(obj,price,x,slotCount,this.bot,()=>{
                console.log("All slot of "+obj.static.nameId+" done !");
                hdvFrame.closeHdv();
            });
        });
    });
    
    
    function repeatSell(toSell,price,currentIndex,slotCount,bot,callBack){
        if(currentIndex < slotCount){
            
            var unit = price / 100;
            var taxPrice = Math.floor(unit*2)+1;
            if(bot.data.inventoryManager.kamas < taxPrice){
                console.log("Pas asser de kamas pour payer la tax de mise en vente ! (il nous en reste "+bot.data.inventoryManager.kamas+", il en faut "+taxPrice+")");
                callBack();
            }
            else{
                console.log("Tax de mise en vente : "+taxPrice -1);
                bot.data.inventoryManager.kamas -= (taxPrice - 1);
            }
            
            console.log("Request server for selling "+toSell.static.nameId+" for "+price+"K ...");
            hdvFrame.sellItem(obj.objectUID,divider,price,(sellSuccess)=>{
                console.log("Selling done !");
                setTimeout(()=>{repeatSell(toSell,price,currentIndex++,slotCount,bot,callBack)},20);
            });
        }
        else{
            return callBack();
        }
    }
}


exports.ExchangeManager.prototype.getItemPrice = function(item,callBack){//beaucoups de timeout mais le server refuse sans, il faut faire des test vori si on peut reduire les dellay   
    console.log(item);
    hdvFrame.openHdv(this.bot,true,(result)=>{
        console.log("Selecting object categorie ("+item.static.typeId+") !")
        setTimeout(()=>{
            hdvFrame.openType(item.static.typeId,()=>{
                console.log("Request for item price ...");
                setTimeout(()=>{
                    hdvFrame.getItemDescriptions(item.objectGID,(describ)=>{
                        let prices = describ.itemTypeDescriptions[0].prices;
                        console.log("Price received ! ("+JSON.stringify(prices)+")");  
                        hdvFrame.closeHdv();
                        setTimeout(()=>{callBack(true,prices[item.config.mode-1]);},100);
                    });
                },100);
            });
        },100);
    });
}