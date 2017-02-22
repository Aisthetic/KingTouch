var EventEmitter = require("events").EventEmitter;
var WebSocketServer = require('ws').Server;
var SimpleClient = require("./simpleClient.js").SimpleClient;
var wss;
exports = module.exports = new EventEmitter();

exports.listen = function(){
	wss = new WebSocketServer({ port:8081 });
	wss.on('connection', function connection(ws) {//todo bypass ddos
        console.log("Client accepted ! ");
		exports.emit("client-accepted",new SimpleClient(ws));
    });
}
