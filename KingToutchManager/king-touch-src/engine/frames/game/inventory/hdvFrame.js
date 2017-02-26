var EventWrapper = require("event-wrapper");
var bot;

exports.openHdv = function(bot_,hasBuyer,callBack){//todo peutetre qu'on recoie des erreur en combat ou quoi
    bot=bot_;
    wrap = EventWrapper(bot.connection.dispatcher,(err,result)=>{
        if(err == null){
            console.log("Receive hdv categories infos ...");
            callBack(result);
        }
        else{
            console.trace(err);
        }
    });
    
    wrap("ExchangeStartedBidBuyerMessage",(m)=>{
        wrap.done(null,m);
    });
    wrap("ExchangeStartedBidSellerMessage",(m)=>{
        wrap.done(null,m);
    });
    
    if(hasBuyer === true){
        console.log("Opening hdv has buyer ...");
        bot.connection.sendMessage("NpcGenericActionRequestMessage",{npcId: 0, npcActionId: 6, npcMapId: bot.data.mapManager.mapId});
    }
    else{
        console.log("Opening hdv has seller ...");
        bot.connection.sendMessage("NpcGenericActionRequestMessage",{npcId: 0, npcActionId: 5, npcMapId: bot.data.mapManager.mapId});
    }
}

exports.openType = function(type,callBack){
    checkOpened();
    wrap = EventWrapper(bot.connection.dispatcher,(err,result)=>{
        if(err != null){
            console.trace(err);
        }
        callBack(result);
    });
    
    wrap("ExchangeTypesExchangerDescriptionForUserMessage",(m)=>{
        console.log("Categorie opened !");
        wrap.done(null,m.typeDescription);
    });
    bot.connection.sendMessage("ExchangeBidHouseTypeMessage",{type: type});
}

exports.getItemDescriptions = function(objectGID,callBack){
    checkOpened();
    wrap = EventWrapper(bot.connection.dispatcher,(err,result)=>{
        if(err != null){
            console.trace(err);
        }
        callBack(result);
    });
    
    wrap("ExchangeTypesItemsExchangerDescriptionForUserMessage",(m)=>{
        console.log("Item description recived !");
        wrap.done(null,m);
    });
    
    wrap("BasicNoOperationMessage",(m)=>{
       console.log("No operation received !");
        // wrap.done("Cant find item !",null);
    });

    bot.connection.sendMessage("ExchangeBidHouseListMessage",{id: objectGID});
    bot.connection.sendMessage("ExchangeBidHousePriceMessage",{genId: objectGID});
}

exports.closeHdv = function(){
    bot.connection.sendMessage("LeaveDialogRequestMessage");
    bot=null;
}

exports.removeItem = function(obj, callBack){
    wrap = EventWrapper(bot.connection.dispatcher,(result)=>{
        callBack(result);
    });
    
    wrap("ExchangeBidHouseItemRemoveOkMessage",()=>{
        wrap.done(true);
    });
    
    bot.connection.sendMessage("ExchangeObjectMoveMessage",{objectUID: obj.objectUID, quantity: obj.quantity - (obj.quantity * 2), price: obj.objectPrice})
}

exports.sellItem = function(objectUID,quantity,price,callBack){
    wrap = EventWrapper(bot.connection.dispatcher,(result)=>{
        callBack(result);
    });
    
    var result = false;
    
    wrap("ExchangeBidHouseItemAddOkMessage",(m)=>{
        console.log("Item describ received !");
        result = true;
        wrap.done();
    });
    
    wrap("BasicNoOperationMessage",(m)=>{
     //   wrap.done(result);
        console.log("No operation received !");
    });
    
    bot.connection.sendMessage("ExchangeObjectMovePricedMessage",{ objectUID: objectUID, quantity: quantity, price: price });
}


function checkOpened(){
    if(typeof bot == "undefined"){ 
        console.trace("Hdv not opened !");
        return false;
    }
    return true;
}