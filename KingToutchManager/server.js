const KING_TOUCH_SERVER = "ws://localhost:8081/";

var clientFail = 0;
var maxClientFail = 15;

var EventEmitter = require("events").EventEmitter;
var httpServer;
var WebSocketServer = require('ws').Server;
var WebSocket = require('ws');
var dispatcher = new EventEmitter();
var currentUIClient;
var currentClientConnected = false;
var accomptsManager = require("./accomptsManager.js");


exports = module.exports = dispatcher;
exports.listen = function(){
	wss = new WebSocketServer({ port:5555 });
	wss.on('connection', function connection(ws) {
        if(clientFail > maxClientFail){
            ws.send(JSON.stringify({call : "bot-stunt",data:{reason:"Votre bot a ete bloquer, il semble que vous subisiez une attaque !"}}));
            ws.close();
            return;
        }
		currentClientConnected=true;
		if(typeof currentUIClient != "undefined"){
			currentUIClient.close();
			currentUIClient=null;
		}
		currentUIClient=ws;
        processIdentification();
    });
}
exports.send = function(call,data){
	if(!currentClientConnected){return}

	try{
		sendNoSecure(call,data);
	}catch(e){
		console.log("Client disconnected !");
		currentClientConnected = false;
	}
}

function sendNoSecure(call,data){
	currentUIClient.send(JSON.stringify({call:call,data:data}));
}
function originIsAllowed(origin) {
  return true;
}

function processIdentification(){
    currentUIClient.on('message', incoming);
    console.log("UI client accepted ! ");

    function incoming(d) {
        if(clientFail > maxClientFail){
            exports.send("bot-stunt",{reason: "Votre bot a ete bloquer, il semble que vous subisiez une attaque !"});
            currentUIClient.close();
            return;
        }
        var message = JSON.parse(d);
        if(typeof message.call != "undefined"){
            console.log(message.call);
            if(message.call === "register-request"){
                 accomptsManager.getUserKey((result,key)=>{
                    if(result === false){
                        requestRegisterToServer(message.data,(result,reason)=>{
                             if(result === true){
                                 clientFail = 0;
                                 exports.send("register-success");
                             }
                             else{
                                 clientFail++;
                                 exports.send("register-failed",{reason: reason});
                             }
                         });
                    }
                    else{
                        clientFail++;
                        exports.send("register-failed",{reason: "Le bot est deja activer !"});
                    }
                 });
            }
            else if(message.call === "identification-request"){
                accomptsManager.getUserKey((result,key)=>{
                    if(result === false){
                        clientFail++;
                        return exports.send("identification-failed",{reason: "Le bot n'est pas activer, entrer une cle d'activation !"})
                    }
                    else{
                      requestIdentificationToServer(message.data,(result,reason)=>{
                        if(result === true){
                            currentUIClient.removeEventListener('message',incoming);
                            listenConnection();
                            exports.send("identification-success");
                        }
                        else{
                            clientFail++;
                            exports.send("identification-failed",{reason: reason});
                        }
                      });
                    }
                });
            }
            else{
                exports.send("protocol-required",{ required: "identification-request" });
            }
        }
        else{
            console.log("UI server receive undefined packet !" + message);
        }
    }
}

function requestRegisterToServer(infos,callBack){
    console.log("Demande d'enregistrement du client, on verifie sa sur le server ...");
    var ktSocket = new WebSocket(KING_TOUCH_SERVER);
    ktSocket.on("open",()=>{
        console.log("Connected to global server, sending register request ...");
        sendKt("register-request",infos);
    });
    ktSocket.on('message', (data)=>{
        var m = JSON.parse(data);
        switch(m.call){
            case "register-success":
                clientFail = 0;
                ktSocket.close();
                console.log("Le serveur accepte l'utilisateur principale (key : "+m.data.key+") !");
                accomptsManager.setUserKey(m.data.key,()=>{
                    exports.send("register-success");
                });
            break;
            case "register-failed":
                console.log("Server refuse subscription reason : "+m.data.reason);
                ktSocket.close();
                exports.send("register-failed",m.data);
            break;
        }
    });
    function sendKt(call,data){
        try{
        ktSocket.send(JSON.stringify({call: call,data: data}));
        }
        catch(e){
            console.log("Server close connection !");
            exports.send("register-failed","Le server ne repond pas !");
        }
    }
}


function requestIdentificationToServer(accompt,callBack){
    console.log("Identification request : " + JSON.stringify(accompt));
    
    ktSocket = new WebSocket(KING_TOUCH_SERVER);
    ktSocket.on("open",()=>{
        console.log("Connected to global server, sending identification request ...");
        setTimeout(()=>{sendKt("identification-request",accompt);},100);
    });
    ktSocket.on("close",()=>{
        ktSocket= null;
        callBack(false,"Le server ne repond pas !");
    });
	ktSocket.on('message', (data)=>{
        var m = JSON.parse(data);
        switch(m.call){
            case "identification-success":
                accomptsManager.getUserKey((result,key)=>{
                    if(result === true){
                        console.log(key);
                        console.log(m.data.key);
                        if(key == m.data.key){
                            console.log("Identification success !");
                            callBack(true);
                        }
                        else{
                            console.log("Bad accompt !");
                            callBack(false,"Le bot n'a pas ete activer avec votre compte !");
                        }
                    }
                    else{
                        console.log("No activated accompt !");
                        callBack(false,"Ce bot n'est pas activer !");
                    }
                });
            break;
            case "identification-failed":
                ktSocket=null;
                console.log("Identification failed !");
                callBack(false,m.data.reason);
            break;
        }
	});
    function sendKt(call,data){
        try{
        ktSocket.send(JSON.stringify({call: call,data: data}));
        }
        catch(e){
            console.log("Ktsocket closed !");
            callBack(false,"Le server refuse la connection !");
        }
    }
}



function listenConnection(){
    currentUIClient.on('message', function incoming(d) {
        var message = JSON.parse(d);
        if(typeof message.call != "undefined"){
            exports.emit(message.call,message.data);
        }
        else{
            console.log("UI server receive undefined packet !" + message);
        }
    });
    exports.emit("client-connected");
    console.log("UI client accepted !");
}