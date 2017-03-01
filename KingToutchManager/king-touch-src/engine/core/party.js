var eventEmitter = require("events").EventEmitter;

exports.Party = function(bot){
    this.name = "";
    this.isFollower = null;
    this.isSet = false;
    this.bot = bot;
    this.dispatcher = new eventEmitter();
    
    this.isWaitingForFollowersMove = false;
    
    this.queue = {};//all pending actions stored here
}

exports.Party.prototype.set = function(name,isFollower){
    this.name= name;
    this.isFollower = isFollower;
    this.isSet = true;
    if(isFollower){
        console.log("*********** Party updated as follower ***********");
        //declare here all followers variable
        this.guruPosition = null;
        
        
        this.registerAsFollower();
    }
    else{
        console.log("*********** Party updated as cheff ***********");
        this.registerAsGuru();
    }
}

exports.Party.prototype.receive = function(message){
    console.log("******** Party message received *********");
    this.dispatcher.emit(message.call,message.data);
    
    console.log(JSON.stringify(message));
    
}

exports.Party.prototype.sendToAll = function(call,data){
    if(this.isSet === false){
        return console.log("Can't send packet to party, party not set !");
    }
    this.dispatcher.emit("send-to-all",{call:call, data:data });
}

exports.Party.prototype.sendToGuru = function(call,data){
    this.dispatcher.emit("send-to-guru",{call:call, data:data });
}

exports.Party.prototype.sendTo = function(dest,call,data){
    this.dispatcher.emit("send-to",{call:call,dest:dest, data:data });
}

exports.Party.prototype.registerAsFollower = function(){
    this.dispatcher.on("guru-position-updated",(m) => {
        this.guruPosition = m;
        console.log("**************** Guru position updated to "+JSON.stringify(m)+" ****************");
    });
    
    this.dispatcher.on("guru-call-followers",(m)=>{
        console.log("**************** Guru request for follower ******************");
        if(this.bot.data.mapManager.mapId == this.guruPosition){
            console.log("We'r already in the same position");
        }
        else{
            if(m.action != "undefined"){
                if(m.action.mapId == this.bot.data.mapManager.mapId){
                    console.log("Guru send action trying to perform it ...");
                    
                    this.dispatcher.emit("exec-move",m.action);
                    
                }
                else{
                    console.log("Can't perform guru action ! request for guru trajet ...");
                    this.sendToGuru("trajet-request");
                    this.sendToGuru("follower-lost");
                }
            }
            console.log("Guru is'nt in te same locaction, checking for neigbors maps ...");
        }
    });
}


exports.Party.prototype.registerAsGuru = function(){
    this.dispatcher.on("follower-position-updated",(m)=>{
        
    });
    this.dispatcher.on("follower-ready",(m)=>{
        if(m.position == this.bot.data.mapManager.mapId){
            console.log("Follower ready !");
        }
        else{
            console.log("Follower is'nt in the same map !");
        }
    });
}

exports.Party.prototype.waitForFollowers = function(callBack){
    
}

exports.Party.prototype.queueIsEmpty = function(){
    for(var i in this.queue){
        return false;
    }
    return true;
}