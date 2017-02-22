var hdvFrame = require("./../frames/game/inventory/hdvFrame.js");

exports.ExchangeManager = function(bot){
    this.bot = bot;
}
exports.ExchangeManager.prototype.canSellInventory = function(){
    return false;//todo
}

exports.ExchangeManager.prototype.sellInventory = function(config){
    if(this.bot.data.context != "ROLEPLAY"){
        console.log("**Inventory sell canceled, we'arent in roleplay conext !**");
        return;
    }
    console.log("**Selling inventory for "+config.length+" items**");
    
}

exports.ExchangeManager.prototype.getItemPrice = function(item){
    
}