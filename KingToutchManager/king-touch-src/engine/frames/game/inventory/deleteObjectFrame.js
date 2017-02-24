var eventWrapper = require("event-wrapper");

exports.processDeleteObject = function(bot,uid,count,callBack){
    var wrap = eventWrapper(bot.connection.dispatcher,(result)=>{
       callBack(result); 
    });
    var result = false;
    wrap("ObjectDeletedMessage",(m)=>{
        if(m.objectUID == uid){
            wrap.done(true)
        }
    });
    wrap("BasicNoOperationMessage",(m)=>{
        if(!result){
            console.log("[ProcessDeleteObjectFrame]Failed !");
            wrap.done(false);
        }
    });
    
    console.log("[ProcessDeleteObjectFrame]Request for delete "+uid+" x "+count);
    bot.connection.sendMessage("ObjectDeleteMessage", {objectUID: uid, quantity: count});
}