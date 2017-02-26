var EventEmitter = require("events").EventEmitter;

exports.SimpleClient = function(socket){
    this.socket = socket;
    this.dispatcher = new EventEmitter();
    this.connected = true;
    
    this.socket.on('message',(data)=>{
        var msg;
        try{
            msg = JSON.parse(data);
            if(typeof msg.call != "undefined"){
            }
            else{
                console.log("Undefined packet identifier "+data);
                return;
            }
        }
        catch(e){
            console.log("Can't read packet !"+data);
        }
        if(typeof msg != "undefined"){
            return this.dispatcher.emit(msg.call,msg.data);
        }
    });
}

exports.SimpleClient.prototype.on = function(call,callBack){
    this.dispatcher.on(call,callBack);
}

exports.SimpleClient.prototype.removeEventListener = function(call,callBack){
    this.dispatcher.removeEventListener(call,callBack);
}

exports.SimpleClient.prototype.close = function(){
    this.socket.close();
    this.dispatcher.emit("close");
}

exports.SimpleClient.prototype.send = function(call,data){
    if(this.connected === true){
        try{
            this.socket.send(JSON.stringify({call: call,data: data}));
        }
        catch(e){
            this.connected=false;
            console.log("Client disconnected !");
            this.dispatcher.emit("close");
        }
    }
}