var cp = require('child_process');
var eventWrapper = require("event-wrapper");
var processFrame = require("./processFrame.js").ProcessFrame;
var connection = require("./server.js");
var webSocket = require("ws");

var botClientServer = new webSocket.Server({
  port: 8082
});
botClientServer.on('connection', function connection(acceptedClient) {
    acceptedClient.on('message',recv);
    function recv(message) {
        var packet = JSON.parse(message);
        if(packet.call == "connect-process"){
            for(var i in onlineProcess){
                if(onlineProcess[i].loaded == false){
                    onlineProcess[i].loadSocket(acceptedClient);
                    registerBotProcess(onlineProcess[i].accompt.username);
                    acceptedClient.removeEventListener('message',recv);
                    console.log("Internal com initialized for "+onlineProcess[i].accompt.username);
                }
            }
        }
      }
});


var updateRequestCount = 0;
var globalState = {};
var onlineProcess = {};
acceptConnection();

function acceptConnection(){
	connection.on("client-connected",()=>{
		connection.emit("global-update-request");
	});
	connection.on("load",(m)=>{
		createBotProcess(m.accompt);
	});
	connection.on("unload",(m)=>{
		
	});
	connection.on("global-update-request",()=>{
		console.log("Process update global request ...");
		updateRequestCount = 0;
		globalState={};
		for(var i in onlineProcess){
			console.log("Request for bot infos ["+i+"] ...");
			onlineProcess[i].send("global-state-request");
            let wrap = eventWrapper(onlineProcess[i].dispatcher,()=>{
                console.log("Client updated !");
            });
            wrap("state-update",(m)=>{
				globalState[m.accompt]=m;
				updateRequestCount--;
				
				if(updateRequestCount <= 0){
					connection.send("global-update",globalState);
				}
                
                wrap.done();
			});
			updateRequestCount++;
		}
	});
	connection.listen();
}

function createBotProcess(accompt){
    var user = accompt.username;
    console.log("********* Loading bot process ... **********");
	var createdProcess = cp.fork(__dirname + '/king-touch-src/main.js');
	onlineProcess[user] = new processFrame(createdProcess,accompt,connection,reloadBotProcess,false);
}

function reloadBotProcess(accompt){
    user = accompt.username;
    console.log("********** Process frame request for reloading ... ***********");
    onlineProcess[user] = null;
    var newProcess = cp.fork(__dirname + '/king-touch-src/main.js');
    onlineProcess[user] = new processFrame(newProcess,accompt,connection,reloadBotProcess,true);
}

function registerBotProcess(user){
    onlineProcess[user].dispatcher.on("ui-message",(m)=>{
		connection.send("accompt-"+user, m);
    });
    
    var oldListeners = connection.listeners("accompt-"+user);
    for(var i = 0;i < oldListeners;i ++){
        connection.removeEventListener("accompt-"+user,oldListeners[i]);
    }
    
    connection.on("accompt-"+user,(m)=>{
        console.log("UI message "+JSON.stringify(m));
        onlineProcess[user].send(m.call, m.data);
    });
}