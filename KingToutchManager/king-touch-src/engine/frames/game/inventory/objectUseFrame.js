var EventWrapper = require("event-wrapper");
exports.processObjectUse = function(id,count,connection,callback){
    wrap = EventWrapper(connection.dispatcher,function(){
        callback();
    });
    wrap("BasicNoOperationMessage",function(m){
        wrap.done();
    });
    connection.sendMessage("ObjectUseMultipleMessage",{objectUID: id, quantity: count});
}
