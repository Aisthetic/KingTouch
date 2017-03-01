var worldDataSource = require("./worldDataSource.js");
var accomptsManager = require("./accomptsManager.js");
var processFrame = require("./processFrame.js").ProcessFrame;
var GroupeFrame = require("./groupeFrame.js").GroupeFrame;
var connection = require("./server.js");
var cp = require('child_process');
var eventWrapper = require("event-wrapper");
var webSocket = require("ws");

var updateRequestCount = 0;

var globalState = {};
var onlineProcess = {};
var onlineProcessQueues = {}
var groupes = {};

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

console.log("Waiting for global data source ..");

worldDataSource.init(()=>{
    console.log("Waiting for client !");
    acceptConnection();
});

function acceptConnection(){
	connection.on("client-connected",()=>{
		connection.emit("global-update-request");
	});
	connection.on("load",(m)=>{
        var accompt = accomptsManager.accompts[m.username];
        if(typeof accompt != "undefined"){
		  createBotProcess(accompt);            
        }
        else{
            console.log("Can't find accompt data for "+m.username);
        }
	});
	connection.on("unload",(m)=>{
		console.log("UI request for unloading "+m.accompt+" ...");
        for(var i in onlineProcess){
            if(i === m.accompt){
                console.log("Client found !");
                onlineProcess[i].close(()=>{
                    onlineProcess[i].kill();
                    delete onlineProcess[i];
                    connection.send("unload-client",{accompt: i});
                    console.log("Unloading success !");
                    return;
                });
            }
        }
        console.log("Client not found !");
	});
    connection.on("load-groupe",(m)=>{
        console.log("User request for groupe loading ...");
        loadGroupe(m.accompts,m.name);
    });
    connection.on("accompts-request",()=>{
        console.log("Send accompt list to client ...");
        var acs = accomptsManager.getAccompts();
        toSend = [];
        for(var i in acs){
            if(typeof onlineProcess[acs[i].username] == "undefined"){
                toSend.push(acs[i]);
            }
        }
        connection.send("accompts-list",toSend);
    });
    connection.on("add-accompt",(accompt)=>{
        console.log("Adding accompt ...");
        accomptsManager.addAccompt(accompt);
        connection.send("accompts-list",accomptsManager.getAccompts());
    });
    connection.on("client-update-request",(m)=>{
        console.log("Updating client "+m.accompt);
        for(var i in onlineProcess){
            if(i === m.accompt){
                console.log("Sending client infos for "+i);
                let wrap = eventWrapper(onlineProcess[i].dispatcher,()=>{
                    console.log("Client updated !");
                });
                wrap("state-update",(m)=>{
                    connection.send("client-update",m);
                    wrap.done();
                });
                onlineProcess[i].send("global-state-request");
            }
        }
    });
	connection.on("global-update-request",()=>{
		console.log("Process update global request ...");
		updateRequestCount = 0;
		globalState={};
		for(var i in onlineProcess){
			console.log("Request for bot infos ["+i+"] ...");
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
            onlineProcess[i].send("global-state-request");
			updateRequestCount++;
		}
	});
	connection.listen();
}

function loadGroupe(accompts,name){
    groupes[name] = new GroupeFrame(name,accompts);
    
    loadAllAccompts(0,accompts,name,()=>{
        console.log("All client loaded for "+name);
    });
    
    function loadAllAccompts(i,accompts,groupe,callBack){
        if(i<accompts.length){
            accompts[i].groupe = groupe;
            console.log("Loading "+accompts[i].username +"in "+groupe+" index "+i);
            var newProcess = cp.fork(__dirname + "/king-touch-src/main.js");
            let isFollower = true;
            if(accompts[i].rangStr == "Chef du groupe"){ // plus crade tu meurs 
                isFollower = false;
            }
            onlineProcess[accompts[i].username] = new processFrame(newProcess,accompts[i],connection,reloadBotProcess,false,groupe,isFollower);
            var x = i+1
            setTimeout(()=>{loadAllAccompts(x,accompts,groupe,callBack);},3000);
        }
        else{
            callBack();
        }
    }
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
    onlineProcess[user].kill();
    onlineProcess[user] = null;
    var newProcess = cp.fork(__dirname + '/king-touch-src/main.js');
    onlineProcess[user] = new processFrame(newProcess,accompt,connection,reloadBotProcess,true);
}

function registerBotProcess(user){
    onlineProcessQueues[user] = [];
    onlineProcess[user].dispatcher.on("ui-message",(m)=>{
		connection.send("accompt-"+user, m);
    });
    onlineProcess[user].dispatcher.on("add-to-process-queue",(m)=>{
        console.log("****** add message to "+user+" process frame queue ... ******");
        onlineProcessQueues.push(m);
    });
    onlineProcess[user].dispatcher.on("groupe-message",(m)=>{
        console.log("**************** groupe message ****************");
        if(m.call === "send-to-all"){
            for(var i in onlineProcess){
                if(uset != i){
                    console.log("Sending groupe message to "+i);
                    onlineProcess[i].send("groupe-message",m.data);
                }
            }
            console.log(user+" send to all player of is groupe : "+JSON.stringify(m));
        }
        else if(m.call === "send-to-guru"){
            console.log(user+" send to chef of is groupe : "+JSON.stringify(m));
        }
        else if(m.call === "send-to"){
            console.log(user+" send to  : "+JSON.stringify(m));
        }
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

