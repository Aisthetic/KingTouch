var eventWrapper = require("event-wrapper");

exports.processDeleteObject = function(bot,uid,count,callBack){
    var wrap = eventWrapper(bot.connection.dispatcher,(result)=>{
       callBack(result); 
    });
    var result = false;
    wrap("ObjectDeletedMessage",(m)=>{
        if(m.objectUID == uid){
            result=true;
        }
    });
    wrap("BasicNoOperationMessage",(m)=>{
        if(result === false){
            console.log("[ProcessDeleteObjectFrame]Failed !");
        }
        callBack(result);
    });
    
    console.log("[ProcessDeleteObjectFrame]Request for delet "+uid+" x "+count);
    bot.connection.sendMessage("ObjectDeleteMessage", {objectUID: uid, quantity: count});
}