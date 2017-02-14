var EventEmitter = require("events").EventEmitter;
var httpServer;
var WebSocketServer = require('ws').Server;
var dispatcher = new EventEmitter();
var currentUIClient;
var currentClientConnected = false;
exports = module.exports = dispatcher;
exports.listen = function(){
	
	wss = new WebSocketServer({ port:5555 });
	wss.on('connection', function connection(ws) {
		currentClientConnected=true;
		if(typeof currentUIClient != "undefined"){
			currentUIClient.close();
			currentUIClient=null;
		}
		currentUIClient=ws;
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