var eventEmitter = require("events").EventEmitter;

exports.Party = function(bot){
    this.name = "";
    this.isFollower = null;
    this.isSet = false;
    this.bot = bot;
    this.dispatcher = new eventEmitter();
    
    this.isWaitingForFollowersMove = false;
    this.isLost = false;
    
    this.queue = {};//all pending actions stored here
}

exports.Party.prototype.set = function(name,isFollower){
    this.name= name;
    this.isFollower = isFollower;
    this.isSet = true;
    this.isReady = false;
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
    console.log(JSON.stringify(message));
    this.dispatcher.emit(message.call,message.data);    
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

exports.Party.prototype.requestFollowersCount = function(callBack){
    this.dispatcher.on("followers-count",u);
    this.dispatcher.emit("followers-count-request");
    function u(count){
        this.dispatcher.removeEventListener("followers-count",u);
        callBack(count);
    }
}

exports.Party.prototype.registerAsFollower = function(){
    this.dispatcher.on("guru-position-updated",(m) => {
        this.guruPosition = m;
        console.log("**************** Guru position updated to "+JSON.stringify(m)+" ****************");
        
        if(this.bot.data.mapManager.mapId === this.guruPosition){
            console.log("We're on the same map !");
            this.sendToGuru("ready");
        } 
        else{
            console.log("We're not on the same map, request guru for trajet ...");
            this.sendToGuru("trajet-request",{sender:this.bot.data.accompt.username});
        }
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
                    isLost = true;
                    this.sendToGuru("trajet-request",{sender:this.bot.data.accompt.username});
                }
            }
            console.log("Guru is'nt in te same locaction, checking for neigbors maps ...");
        }
    });
    
    this.dispatcher.on("is-ready",()=>{
        this.sendToGuru("ready-state", {ready:this.isReady, sender:this.bot.data.accompt.username});
    });
    
    this.dispatcher.on("trajet-update",(m)=>{
        console.log("----- Receive guru trajet ! -----");
        
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
    this.dispatcher.on("trajet-request",(m)=>{
        console.log(m.sender+" request for trajet !");
        if(typeof this.bot.trajet.currentTrajet != "undefined"){
            console.log("---- Sending trajet to "+m.sender+" ----");
            this.sendTo(m.sender,"trajet-update",this.bot.trajet.currentTrajet);
        }
        else{
            console.log("---- No trajet loaded ! ----");
        }
    });
}

exports.Party.prototype.waitForFollowers = function(callBack){
    var i = 0;
    var pendingAccompts = [];
    var count = 0;
    this.dispatcher.on("ready-state",receiveState);
    this.requestFollowersCount((c)=>{
        console.log("********* Request to "+count+" follower(s) if is ready **********");
        count = c;
        this.sendToAll("is-ready");
    });
    
    function receiveState(m){
        if(m.ready){
            console.log("-----------"+m.sender+" is ready !")
        }
        else{
            console.log("-----------"+m.sender+" is not ready !");
            pendingAccompts.push(m);
        }
        i++;
        if(i === count){
            if(pendingAccompts.length === 0){
                console.log("************* All followers are ready ! ****************")
            }
            else{
                console.log("***************************************");
                console.log(pendingAccompts);
                console.log("are not ready !");
            }
        }
    }
}

exports.Party.prototype.queueIsEmpty = function(){
    for(var i in this.queue){
        return false;
    }
    return true;
}