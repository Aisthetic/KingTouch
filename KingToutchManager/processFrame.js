var EventEmitter = require("events").EventEmitter;
var cp = require('child_process');

exports.ProcessFrame = function(process,accompt,connection,reloadingFunction,rescure,groupe,isFollower){
    this.connection = connection;
    this.loaded = false;
	this.dispatcher = new EventEmitter();
	this.process=process;
    this.accompt=accompt;
    this.groupe = groupe;
    this.isFollower = isFollower;
    
    this.process.on('message',(error)=>{
        console.trace(error);
        console.log("********** Child process handle error, reloading ("+accompt.username+") ! **********");
        reloadingFunction(accompt);
    });
    
    if(rescure){
        console.log("*********** trying to rescure client ... **********");
        this.process.send(accompt.username);//send rescure request to created child process
    }
}


exports.ProcessFrame.prototype.loadSocket = function(processConnection){
    this.processConnection = processConnection;
    this.loaded = true;
    this.processConnection.on("message",(data)=>{
        m = JSON.parse(data);
       if(typeof(m.call) != "undefined"){
           this.dispatcher.emit(m.call,m.data);
       } 
       else{ 
            console.log("Undefined ui message : "+m);
       }
    });
    this.processConnection.on("close",(e)=>{
        console.log("Process closed connection !!!");
        this.loaded = false;
    });
	this.send("load-accompt",this.accompt);
    this.dispatcher.on("accompt-loaded",(m)=>{
        if(typeof this.groupe != "undefined"){
            this.send("set-groupe",{name: this.groupe,isFollower: this.isFollower});
        }
        m.accompt = this.accompt.username;
        this.connection.send("load-client",m);
    });

}

exports.ProcessFrame.prototype.send = function(call,data){
    if(this.loaded === true){
	   this.processConnection.send(JSON.stringify({ call : call, data : data }));
    }
    else{
        console.log("****** Not loaded, request main to do something ******");
        exports.emit("add-to-process-queue",{call:call,data:data});
    }
}

exports.ProcessFrame.prototype.close = function(callBack){
    this.connection.send("accompt-"+this.accompt.username,{call:"unload"});
    callBack();
}

exports.ProcessFrame.prototype.kill = function(){
    this.process.kill();
}