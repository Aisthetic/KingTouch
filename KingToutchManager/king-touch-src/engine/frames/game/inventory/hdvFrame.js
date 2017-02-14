var EventWrapper = require("event-wrapper");
var bot;

exports.openHdv = function(bot_,hasBuyer,callBack){//todo peutetre qu'on recoie des erreur en combat ou quoi
    bot=bot_;
    wrap = EventWrapper(bot.connection.dispatcher,(err,result)=>{
        if(typeof err == "undefined"){
            console.log("Receive hdv categories infos ...");
            callBack(result);
        }
        else{
            console.trace(err);
        }
    });
    
    wrap("ExchangeStartedBidBuyerMessage",(m)=>{
        wrap.done(null,m.objectsInfos);
    });
    wrap("ExchangeStartedBidSellerMessage",(m)=>{
        wrap.done(null,m.types);
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
        if(typeof err != "undefined"){
            console.trace(err);
        }
        callBack(result);
    });
    
    wrap("ExchangeTypesExchangerDescriptionForUserMessage",(m)=>{
        wrap.done(null,m.typeDescription);
    });
    
    bot.connection.sendMessage("ExchangeBidHouseTypeMessage",{type: type});
}

exports.getItemDescriptions = function(objectGID,callback){
    checkOpened();
    wrap = EventWrapper(bot.connection.dispatcher,(err,result)=>{
        if(typeof err != "undefined"){
            console.trace(err);
        }
        callBack(result);
    });
    
    wrap("ExchangeTypesItemsExchangerDescriptionForUserMessage",(m)=>{
        console.log("Item price recived !");
        wrap.done(null,itemTypeDescriptions);
    });
    
    wrap("BasicNoOperationMessage",(m)=>{
        wrap.done("Cant find item !",null);
    });

    bot.connection.sendMessage("ExchangeBidHouseListMessage",{id: objectGID});
    bot.connection.sendMessage("ExchangeBidHousePriceMessage",{genId: objectGID});
}

exports.closeHdv = function(){
    bot.connection.sendMessage("LeaveDialogRequestMessage");
    bot=null;
}

exports.sellItem = function(objectUID,quantity,price,callBack){
    wrap = EventWrapper(bot.connection.dispatcher,(result)=>{
        callBack(result);
    });
    
    var result = false;
    
    wrap("ExchangeBidHouseItemAddOkMessage",(m)=>{
        result = true;
    });
    
    wrap("BasicNoOperationMessage",(m)=>{
        wrap.done(result);
    });
    
    bot.connection.sendMessage("ExchangeObjectMovePricedMessage",{ objectUID: objectUID, quantity: quantity, price: price });
}


function checkOpened(){
    if(typeof bot != "undefined"){ 
        console.trace("Hdv not opened !");
    }
}